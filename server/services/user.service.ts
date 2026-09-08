import fs from 'fs';
import { DATA_DIR, USERS_FILE } from '../config/paths.ts';
import { defaultUsers } from '../data/default-users.ts';
import { AppUser, SafeUser } from '../types/index.ts';
import { upsertDbUser as upsertToMongo } from '../mongodb.ts';
import bcrypt from 'bcryptjs';

let usersCache: AppUser[] = [];
const activeTokens = new Map<string, { user: AppUser; expiresAt: number }>();
const telegramAuthSessions = new Map<string, { user: AppUser; token: string; loginAt: string }>();

function loadFromDisk(): AppUser[] {
  try {
    let users = [...defaultUsers];
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        users = parsed;
        for (const du of defaultUsers) {
          const idx = users.findIndex(u => u.id === du.id);
          if (idx >= 0) users[idx] = du;
          else users.push(du);
        }
      }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return users;
  } catch (err) {
    console.error('Error reading USERS_FILE:', err);
    return defaultUsers;
  }
}

function persistUsers(users: AppUser[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing USERS_FILE:', err);
  }

  for (const u of users) {
    upsertToMongo(u).catch(() => {});
  }
}

// Initialize cache
usersCache = loadFromDisk();

export function sanitizeUser(user: AppUser): SafeUser {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function generateToken(userId: string): string {
  return `st_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export const userService = {
  getAll(): AppUser[] {
    return usersCache;
  },

  getAllSafe(): SafeUser[] {
    return usersCache.map(sanitizeUser);
  },

  setAll(users: AppUser[]): void {
    usersCache = users;
    persistUsers(usersCache);
  },

  getById(id: string): AppUser | undefined {
    return usersCache.find((u) => u.id === id);
  },

  getByUsername(username: string): AppUser | undefined {
    return usersCache.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  authenticate(username: string, password: string): { user: SafeUser; token: string } | null {
    const user = this.getByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return null;
    }
    const token = generateToken(user.id);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    activeTokens.set(token, { user, expiresAt });
    return { user: sanitizeUser(user), token };
  },

  verifyToken(token?: string): AppUser | null {
    if (!token) return null;
    const session = activeTokens.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      activeTokens.delete(token);
      return null;
    }
    return session.user;
  },

  create(data: Omit<AppUser, 'id'> & { id?: string }): SafeUser {
    const newUser: AppUser = {
      ...data,
      id: data.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      password: bcrypt.hashSync(data.password, 10),
    };
    usersCache = [...usersCache, newUser];
    persistUsers(usersCache);
    return sanitizeUser(newUser);
  },

  update(id: string, updates: Partial<AppUser>): SafeUser | null {
    const index = usersCache.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const updated = { ...usersCache[index], ...updates };
    if (updates.password && updates.password !== usersCache[index].password) {
      updated.password = bcrypt.hashSync(updates.password, 10);
    }
    
    usersCache[index] = updated;
    persistUsers(usersCache);
    return sanitizeUser(updated);
  },

  changePassword(userId: string, oldPass: string, newPass: string): boolean {
    const user = this.getById(userId);
    if (!user || !bcrypt.compareSync(oldPass, user.password)) return false;
    user.password = bcrypt.hashSync(newPass, 10);
    persistUsers(usersCache);
    return true;
  },

  delete(id: string): boolean {
    const initialLen = usersCache.length;
    usersCache = usersCache.filter((u) => u.id !== id);
    if (usersCache.length !== initialLen) {
      persistUsers(usersCache);
      return true;
    }
    return false;
  },

  count(): number {
    return usersCache.length;
  },

  // Telegram session helpers
  getTelegramSession(key: string) {
    return telegramAuthSessions.get(key);
  },

  setTelegramSession(key: string, session: { user: AppUser; token: string; loginAt: string }) {
    telegramAuthSessions.set(key, session);
  },

  clearTelegramSession(key: string) {
    telegramAuthSessions.delete(key);
  },
};
