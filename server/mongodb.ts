import { MongoClient, Db, Collection } from 'mongodb';
import fs from 'fs';
import path from 'path';

export interface ProductDocument {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  markupPercent: number;
  sellingPrice?: number;
  date: string;
  supplier?: string;
  notes?: string;
  photoUrl?: string;
  updatedAt?: string;
}

export interface UserDocument {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  roleTitle: string;
  updatedAt?: string;
}

export interface TelegramSessionDocument {
  chatId: string;
  userId: string;
  username: string;
  token: string;
  loginAt: string;
  updatedAt: string;
}

// Local fallback files
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');
const USERS_FILE = path.join(DATA_DIR, 'users_db.json');

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let isConnected = false;
let connectionAttempted = false;
let lastMongoError: string | null = null;

function getMongoUri(): string | undefined {
  return (
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    undefined
  );
}

function getDatabaseName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || 'smartsavdo';
}

/**
 * Initializes and connects to MongoDB with graceful local fallback
 */
export async function initMongoDatabase(defaultProducts: ProductDocument[], defaultUsers: UserDocument[]): Promise<boolean> {
  const uri = getMongoUri();
  connectionAttempted = true;

  if (!uri) {
    console.log('[MongoDB] MONGODB_URI/MONGO_URL not set. Running in local JSON file persistence mode.');
    ensureLocalFilesExist(defaultProducts, defaultUsers);
    return false;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB...');
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    });

    await client.connect();
    const dbName = getDatabaseName();
    const db = client.db(dbName);

    // Verify connection via ping
    await db.command({ ping: 1 });

    mongoClient = client;
    mongoDb = db;
    isConnected = true;
    lastMongoError = null;

    console.log(`[MongoDB] Connected successfully to database: "${dbName}"`);

    // Ensure collections and seed initial data if empty
    await seedMongoIfEmpty(db, defaultProducts, defaultUsers);

    return true;
  } catch (err: any) {
    isConnected = false;
    lastMongoError = err.message || 'Failed to connect to MongoDB';
    console.warn(`[MongoDB] Connection failed: ${lastMongoError}. Operating with local fallback file storage.`);
    ensureLocalFilesExist(defaultProducts, defaultUsers);
    return false;
  }
}

function ensureLocalFilesExist(defaultProducts: ProductDocument[], defaultUsers: UserDocument[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultProducts, null, 2), 'utf-8');
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Storage] Error creating local fallback files:', err);
  }
}

async function seedMongoIfEmpty(db: Db, defaultProducts: ProductDocument[], defaultUsers: UserDocument[]) {
  try {
    const productsColl = db.collection<ProductDocument>('products');
    const prodCount = await productsColl.countDocuments();
    if (prodCount === 0) {
      console.log(`[MongoDB] Seeding initial ${defaultProducts.length} products to "products" collection...`);
      await productsColl.insertMany(defaultProducts as any);
      await productsColl.createIndex({ id: 1 }, { unique: true });
      await productsColl.createIndex({ name: 'text', category: 'text' });
    }

    const usersColl = db.collection<UserDocument>('users');
    const userCount = await usersColl.countDocuments();
    if (userCount === 0) {
      console.log(`[MongoDB] Seeding default users to "users" collection...`);
      await usersColl.insertMany(defaultUsers as any);
      await usersColl.createIndex({ id: 1 }, { unique: true });
      await usersColl.createIndex({ username: 1 }, { unique: true });
    }

    // Telegram sessions index
    const tgColl = db.collection<TelegramSessionDocument>('telegram_sessions');
    await tgColl.createIndex({ chatId: 1 }, { unique: true });
  } catch (err) {
    console.error('[MongoDB] Seeding error:', err);
  }
}

// -------------------------------------------------------------
// PRODUCT OPERATIONS (Mongo + Local Cache Sync)
// -------------------------------------------------------------
export async function getDbProducts(fallbackList: ProductDocument[]): Promise<ProductDocument[]> {
  if (isConnected && mongoDb) {
    try {
      const items = await mongoDb.collection<ProductDocument>('products').find({}).toArray();
      if (items && items.length > 0) {
        // Strip mongo internal _id from items
        return items.map(({ _id, ...rest }: any) => rest);
      }
    } catch (err) {
      console.error('[MongoDB] Error reading products:', err);
    }
  }

  // Fallback to local file
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error reading DB_FILE:', err);
  }

  return fallbackList;
}

export async function upsertDbProduct(product: ProductDocument): Promise<void> {
  const updatedProduct = {
    ...product,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write to MongoDB if connected
  if (isConnected && mongoDb) {
    try {
      await mongoDb.collection<ProductDocument>('products').updateOne(
        { id: product.id },
        { $set: updatedProduct },
        { upsert: true }
      );
    } catch (err) {
      console.error('[MongoDB] Error saving product to MongoDB:', err);
    }
  }

  // 2. Always sync with local file storage for redundancy
  try {
    const products = await getDbProducts([]);
    const index = products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      products[index] = updatedProduct;
    } else {
      products.unshift(updatedProduct);
    }
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error updating DB_FILE:', err);
  }
}

export async function deleteDbProduct(id: string): Promise<boolean> {
  if (isConnected && mongoDb) {
    try {
      await mongoDb.collection<ProductDocument>('products').deleteOne({ id });
    } catch (err) {
      console.error('[MongoDB] Error deleting product from MongoDB:', err);
    }
  }

  // Sync local file
  try {
    const products = await getDbProducts([]);
    const filtered = products.filter((p) => p.id !== id);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error deleting from DB_FILE:', err);
    return false;
  }
}

export async function bulkUpsertDbProducts(newProducts: ProductDocument[]): Promise<void> {
  if (!newProducts || newProducts.length === 0) return;

  if (isConnected && mongoDb) {
    try {
      const coll = mongoDb.collection<ProductDocument>('products');
      for (const p of newProducts) {
        await coll.updateOne(
          { id: p.id },
          { $set: { ...p, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('[MongoDB] Error bulk saving products:', err);
    }
  }

  // Sync local file
  try {
    const existing = await getDbProducts([]);
    const map = new Map<string, ProductDocument>();
    existing.forEach((p) => map.set(p.id, p));
    newProducts.forEach((p) => map.set(p.id, p));
    const merged = Array.from(map.values());
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error bulk updating DB_FILE:', err);
  }
}

// -------------------------------------------------------------
// USER OPERATIONS (Mongo + Local Cache Sync)
// -------------------------------------------------------------
export async function getDbUsers(defaultUsers: UserDocument[]): Promise<UserDocument[]> {
  if (isConnected && mongoDb) {
    try {
      const items = await mongoDb.collection<UserDocument>('users').find({}).toArray();
      if (items && items.length > 0) {
        return items.map(({ _id, ...rest }: any) => rest);
      }
    } catch (err) {
      console.error('[MongoDB] Error reading users:', err);
    }
  }

  // Fallback to local file
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('[Storage] Error reading USERS_FILE:', err);
  }

  return defaultUsers;
}

export async function upsertDbUser(user: UserDocument): Promise<void> {
  if (isConnected && mongoDb) {
    try {
      await mongoDb.collection<UserDocument>('users').updateOne(
        { id: user.id },
        { $set: { ...user, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (err) {
      console.error('[MongoDB] Error saving user to MongoDB:', err);
    }
  }

  // Sync local file
  try {
    const users = await getDbUsers([]);
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) users[index] = user;
    else users.push(user);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Error saving USERS_FILE:', err);
  }
}

// -------------------------------------------------------------
// TELEGRAM SESSIONS (Mongo Persistent across restarts)
// -------------------------------------------------------------
export async function getSavedTelegramSession(chatId: string): Promise<TelegramSessionDocument | null> {
  if (isConnected && mongoDb) {
    try {
      const session = await mongoDb.collection<TelegramSessionDocument>('telegram_sessions').findOne({ chatId: String(chatId) });
      return session ? (({ _id, ...rest }: any) => rest)(session) : null;
    } catch (err) {
      console.error('[MongoDB] Error reading telegram session:', err);
    }
  }
  return null;
}

export async function saveTelegramSession(session: TelegramSessionDocument): Promise<void> {
  if (isConnected && mongoDb) {
    try {
      await mongoDb.collection<TelegramSessionDocument>('telegram_sessions').updateOne(
        { chatId: String(session.chatId) },
        { $set: { ...session, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    } catch (err) {
      console.error('[MongoDB] Error saving telegram session:', err);
    }
  }
}

// -------------------------------------------------------------
// DATABASE STATUS & DIAGNOSTICS
// -------------------------------------------------------------
export async function getDbDiagnostics() {
  const uri = getMongoUri();
  const dbName = getDatabaseName();
  let maskedUri = '';
  if (uri) {
    maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  }

  let productCount = 0;
  let userCount = 0;

  try {
    if (isConnected && mongoDb) {
      productCount = await mongoDb.collection('products').countDocuments();
      userCount = await mongoDb.collection('users').countDocuments();
    } else {
      const p = await getDbProducts([]);
      const u = await getDbUsers([]);
      productCount = p.length;
      userCount = u.length;
    }
  } catch (err) {
    // ignore
  }

  return {
    configured: !!uri,
    connected: isConnected,
    mode: isConnected ? 'mongodb' : 'local_json_fallback',
    databaseName: dbName,
    maskedUri: maskedUri || null,
    productCount,
    userCount,
    lastError: lastMongoError,
    railwayInstruction:
      'Railway Dashboard -> New -> Database -> Add MongoDB. Railway MONGODB_URI yoki MONGO_URL o\'zgaruvchisini avtomatik qo\'shadi.',
  };
}
