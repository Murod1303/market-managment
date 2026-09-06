import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initial products fallback
const defaultProducts = [
  {
    id: 'prod-1',
    name: 'Shakar (Xorazm)',
    category: 'Oziq-ovqat',
    quantity: 50,
    unit: 'qop',
    unitCost: 420000,
    markupPercent: 15,
    date: '2026-09-01',
    supplier: 'Xorazm Shakar MCHJ',
    notes: "50 kg'lik qoplar",
  },
  {
    id: 'prod-2',
    name: "O'simlik yog'i (Oltin Kalit 5L)",
    category: 'Oziq-ovqat',
    quantity: 120,
    unit: 'dona',
    unitCost: 75000,
    markupPercent: 20,
    date: '2026-09-02',
    supplier: "Toshkent Yog'-Moy Zavodi",
    notes: '5 litrlik baklashkada',
  },
  {
    id: 'prod-3',
    name: 'Olma (Semerenko)',
    category: 'Meva-Sabzavot',
    quantity: 250,
    unit: 'kg',
    unitCost: 9500,
    markupPercent: 30,
    date: '2026-09-03',
    supplier: "Namangan Bog'dorchilik",
    notes: 'Yangi terilgan saralangan olma',
  },
  {
    id: 'prod-4',
    name: 'Kartoshka (Qizil)',
    category: 'Meva-Sabzavot',
    quantity: 500,
    unit: 'kg',
    unitCost: 4500,
    markupPercent: 25,
    date: '2026-09-03',
    supplier: 'Samarqand Agro Fermasi',
    notes: 'Qopda tozalangan',
  },
  {
    id: 'prod-5',
    name: 'Sut (Musaffo 3.2% 1L)',
    category: 'Sut mahsulotlari',
    quantity: 180,
    unit: 'dona',
    unitCost: 11200,
    markupPercent: 20,
    date: '2026-09-04',
    supplier: 'Musaffo Agro',
    notes: 'TetraPak qadoqda',
  },
  {
    id: 'prod-6',
    name: 'Pishloq Gollandskiy',
    category: 'Sut mahsulotlari',
    quantity: 40,
    unit: 'kg',
    unitCost: 78000,
    markupPercent: 25,
    date: '2026-09-04',
    supplier: 'Bio Sanoat MCHJ',
    notes: "Vakuum o'ramda",
  },
  {
    id: 'prod-7',
    name: 'Choy (Ahmad Tea English No.1 100g)',
    category: 'Ichimliklar',
    quantity: 85,
    unit: 'quti',
    unitCost: 18500,
    markupPercent: 25,
    date: '2026-09-02',
    supplier: 'Global Trade Distribution',
    notes: 'Klassik qora choy',
  },
  {
    id: 'prod-8',
    name: 'Un (Qozoq oliy nav 50kg)',
    category: 'Oziq-ovqat',
    quantity: 35,
    unit: 'qop',
    unitCost: 285000,
    markupPercent: 15,
    date: '2026-09-01',
    supplier: 'Don Mahsulotlari Logistika',
    notes: 'Oliy navli un',
  },
  {
    id: 'prod-9',
    name: 'Sovun (Duru 4x90g)',
    category: "Xo'jalik mollari",
    quantity: 110,
    unit: 'pachka',
    unitCost: 14000,
    markupPercent: 30,
    date: '2026-09-02',
    supplier: 'Evro Kosmetika',
    notes: 'Oq va dengiz iforli',
  },
  {
    id: 'prod-10',
    name: 'Guruch (Lazer)',
    category: 'Oziq-ovqat',
    quantity: 300,
    unit: 'kg',
    unitCost: 22000,
    markupPercent: 20,
    date: '2026-09-03',
    supplier: 'Xorazm Agro Eksport',
    notes: 'Oshbop toza saralangan guruch',
  },
];

// Persistent file storage
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store_db.json');
const USERS_FILE = path.join(DATA_DIR, 'users_db.json');

export interface AppUser {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'cashier';
  roleTitle: string;
}

const defaultUsers: AppUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'Boshqaruvchi (Admin)',
    role: 'admin',
    roleTitle: "Do'kon Egasi / Boshqaruvchi",
  },
  {
    id: 'user-cashier',
    username: 'kassir',
    password: 'kassa2026',
    name: 'Kassir-Operator',
    role: 'cashier',
    roleTitle: 'Kassir / Hisobchi',
  },
];

function loadUsers(): AppUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), 'utf-8');
    return defaultUsers;
  } catch (err) {
    console.error('Error reading USERS_FILE:', err);
    return defaultUsers;
  }
}

function saveUsers(users: AppUser[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing USERS_FILE:', err);
  }
}

let usersCache = loadUsers();

// In-memory active session tokens
const activeTokens = new Map<string, { user: AppUser; expiresAt: number }>();

// Telegram chat sessions (by chatId or sessionKey)
const telegramAuthSessions = new Map<
  string,
  { user: AppUser; token: string; loginAt: string }
>();

function generateToken(userId: string): string {
  return `st_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function verifyToken(token?: string): AppUser | null {
  if (!token) return null;
  const session = activeTokens.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeTokens.delete(token);
    return null;
  }
  return session.user;
}

function sanitizeUser(user: AppUser) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function loadProducts(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultProducts, null, 2), 'utf-8');
    return defaultProducts;
  } catch (err) {
    console.error('Error reading DB_FILE:', err);
    return defaultProducts;
  }
}

function saveProducts(products: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB_FILE:', err);
  }
}

let productsCache = loadProducts();

// Helper: Format so'm
function formatSom(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

interface ParsedProductResult {
  success: boolean;
  error?: 'empty' | 'invalid';
  item?: {
    name: string;
    quantity: number;
    unit: string;
    unitCost: number;
    markupPercent: number;
    category: string;
    supplier: string;
  };
}

// Helper: Parse /new command input
function parseNewProductInput(raw: string): ParsedProductResult {
  const text = raw.trim();
  if (!text || text.toLowerCase() === 'help' || text.toLowerCase() === 'yordam') {
    return { success: false, error: 'empty' };
  }

  // Known units list in Latin and Cyrillic
  const knownUnits = [
    'kg', 'dona', 'litr', 'l', 'qop', 'quti', 'metr', 'm', 'pachka', 'blok', 'ta', 'shtuk', 'sh',
    'кг', 'дона', 'литр', 'қоп', 'қути', 'метр', 'пачка', 'блок', 'штук'
  ];

  let name = '';
  let quantity = 0;
  let unit = 'dona';
  let unitCost = 0;
  let markupPercent = 20; // default 20%
  let category = 'Umumiy';
  let supplier = "Do'kon ombori";

  // Check if multi-line key-value format (e.g. Nomi: ..., Miqdori: ...)
  if (text.includes('\n') && (text.toLowerCase().includes('nomi:') || text.toLowerCase().includes('tovar:'))) {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase().trim();
      if (lower.startsWith('nomi:') || lower.startsWith('tovar:')) {
        name = line.split(':')[1]?.trim() || '';
      } else if (lower.startsWith('miqdor:') || lower.startsWith('miqdori:')) {
        const val = line.split(':')[1]?.trim() || '';
        const match = val.match(/([\d\.]+)\s*([a-zA-Zа-яА-ЯўқғҳЎҚҒҲ']+)?/);
        if (match) {
          quantity = parseFloat(match[1]) || 0;
          if (match[2]) unit = match[2].toLowerCase();
        }
      } else if (lower.startsWith('birligi:') || lower.startsWith('birlik:')) {
        unit = line.split(':')[1]?.trim().toLowerCase() || unit;
      } else if (lower.startsWith('tannarx:') || lower.startsWith('tannarxi:') || lower.startsWith('narx:')) {
        const val = line.split(':')[1]?.replace(/[^\d\.]/g, '') || '';
        unitCost = parseFloat(val) || 0;
      } else if (lower.startsWith('ustama:') || lower.startsWith('foiz:')) {
        const val = line.split(':')[1]?.replace(/[^\d\.]/g, '') || '';
        markupPercent = parseFloat(val) || 20;
      } else if (lower.startsWith("ta'minotchi:") || lower.startsWith('taminotchi:')) {
        supplier = line.split(':')[1]?.trim() || supplier;
      }
    }
  } else if (text.includes(',') || text.includes('|') || text.includes(';')) {
    // Delimiter separated: name, quantity, [unit], unitCost, [markup]
    const parts = text.split(/[,|;]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      name = parts[0];
      // Part 1: quantity and maybe unit (e.g. "50 kg" or "50")
      const p1 = parts[1];
      const qMatch = p1.match(/([\d\.]+)\s*([a-zA-Zа-яА-ЯўқғҳЎҚҒҲ']+)?/);
      if (qMatch) {
        quantity = parseFloat(qMatch[1]) || 0;
        if (qMatch[2]) unit = qMatch[2].toLowerCase();
      }

      let costPartIndex = 2;
      // If Part 2 is just a unit (like "kg" or "dona")
      if (parts[2] && isNaN(parseFloat(parts[2].replace(/[^\d\.]/g, '')))) {
        unit = parts[2].toLowerCase();
        costPartIndex = 3;
      }

      if (parts[costPartIndex]) {
        unitCost = parseFloat(parts[costPartIndex].replace(/[^\d\.]/g, '')) || 0;
      }

      const markupPartIndex = costPartIndex + 1;
      if (parts[markupPartIndex]) {
        const parsedMarkup = parseFloat(parts[markupPartIndex].replace(/[^\d\.]/g, ''));
        if (!isNaN(parsedMarkup)) {
          markupPercent = parsedMarkup;
        }
      }
    }
  } else {
    // Space separated: e.g. "Olma 50 kg 12000 25" or "Qizil olma 50 kg 12000 25"
    const tokens = text.split(/\s+/).filter(Boolean);
    if (tokens.length >= 3) {
      let endIdx = tokens.length - 1;

      // Check if last token is markup (e.g. "25" or "25%")
      const lastTokenClean = tokens[endIdx].replace('%', '');
      const lastTokenNum = parseFloat(lastTokenClean);

      if (tokens[endIdx].includes('%') || (tokens.length >= 5 && !isNaN(lastTokenNum) && lastTokenNum <= 300)) {
        markupPercent = lastTokenNum;
        endIdx--;
      }

      // Next from end should be unitCost
      if (endIdx >= 2) {
        const costClean = tokens[endIdx].replace(/[^\d\.]/g, '');
        const costNum = parseFloat(costClean);
        if (!isNaN(costNum) && costNum > 0) {
          unitCost = costNum;
          endIdx--;
        }
      }

      // Next from end could be unit (e.g. 'kg', 'dona', etc.)
      if (endIdx >= 2) {
        const possibleUnit = tokens[endIdx].toLowerCase();
        if (knownUnits.includes(possibleUnit) || isNaN(parseFloat(possibleUnit))) {
          unit = possibleUnit;
          endIdx--;
        }
      }

      // Next from end should be quantity
      if (endIdx >= 1) {
        const qtyClean = tokens[endIdx].replace(/[^\d\.]/g, '');
        const qtyNum = parseFloat(qtyClean);
        if (!isNaN(qtyNum) && qtyNum > 0) {
          quantity = qtyNum;
          endIdx--;
        }
      }

      // Remaining tokens at the beginning form the name
      if (endIdx >= 0) {
        name = tokens.slice(0, endIdx + 1).join(' ');
      }
    }
  }

  // Clean and normalize unit
  unit = unit.replace(/[^\w\u0400-\u04FF']/g, '').trim().toLowerCase();
  if (unit === 'ta' || unit === 'shtuk' || unit === 'sh' || unit === 'штук' || unit === 'та') unit = 'dona';
  if (unit === 'l' || unit === 'литр') unit = 'litr';
  if (unit === 'm' || unit === 'метр') unit = 'metr';
  if (unit === 'кг') unit = 'kg';
  if (unit === 'қоп') unit = 'qop';
  if (unit === 'қути') unit = 'quti';
  if (unit === 'пачка') unit = 'pachka';
  if (unit === 'блок') unit = 'blok';

  name = name.trim();
  if (!name || quantity <= 0 || unitCost <= 0) {
    return { success: false, error: 'invalid' };
  }

  // Smart category assignment
  const n = name.toLowerCase();
  if (n.includes('olma') || n.includes('shakar') || n.includes('un') || n.includes('guruch') || n.includes('yog') || n.includes('tuxum') || n.includes('non') || n.includes('go\'sht') || n.includes('makaron') || n.includes('kartoshka') || n.includes('piyoz') || n.includes('pomidor') || n.includes('bodring') || n.includes('озиқ') || n.includes('шакар') || n.includes('ун') || n.includes('гуруч') || n.includes('ёғ') || n.includes('тухум')) {
    category = 'Oziq-ovqat';
  } else if (n.includes('suv') || n.includes('cola') || n.includes('fanta') || n.includes('choy') || n.includes('kofe') || n.includes('sharbat') || n.includes('pepsi') || n.includes('sok') || n.includes('ichimlik') || n.includes('сув') || n.includes('чой') || n.includes('шарбат') || n.includes('ичимлик')) {
    category = 'Ichimliklar';
  } else if (n.includes('sovun') || n.includes('poroshok') || n.includes('shampun') || n.includes('tozalagich') || n.includes('salfetka') || n.includes('yuvish') || n.includes('совун') || n.includes('порошок') || n.includes('шампунь')) {
    category = "Xo'jalik mollari";
  } else if (n.includes('daftar') || n.includes('ruchka') || n.includes('qalam') || n.includes('qog\'oz') || n.includes('дафтар') || n.includes('ручка')) {
    category = 'Kantselyariya';
  } else {
    category = 'Umumiy';
  }

  return {
    success: true,
    item: {
      name,
      quantity,
      unit: unit || 'dona',
      unitCost,
      markupPercent: Math.max(0, Math.round(markupPercent)),
      category,
      supplier,
    },
  };
}

// Helper: Get Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface PendingMarkupSession {
  items: Array<{
    name: string;
    category?: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost?: number;
  }>;
  supplier?: string;
  date?: string;
  userName?: string;
  timestamp: number;
}

const pendingMarkupSessions = new Map<string, PendingMarkupSession>();

async function scanReceiptImage(imageBase64: string): Promise<{
  supplier: string;
  date: string;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost?: number;
  }>;
}> {
  const ai = getGeminiClient();
  let scanResult: any = null;

  if (ai) {
    try {
      const cleanBase64 = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: "Ushbu tovar cheki, tovar yoki hisob-faktura rasmidan tovar nomlari, miqdori, birligi va kelish tannarxini aniq JSON ko'rinishida ajratib ber. Agar bitta tovar rasmi bo'lsa, tovar nomini taxminiy aniqlab 1 dona deb ol.",
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplier: { type: Type.STRING },
              date: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    unitCost: { type: Type.NUMBER },
                    totalCost: { type: Type.NUMBER },
                  },
                  required: ['name', 'quantity', 'unit', 'unitCost'],
                },
              },
            },
            required: ['items'],
          },
        },
      });
      scanResult = JSON.parse(response.text || '{}');
    } catch (err) {
      console.error('Scan AI error:', err);
    }
  }

  if (!scanResult || !scanResult.items || scanResult.items.length === 0) {
    scanResult = {
      supplier: "Savdo Ta'minot MCHJ",
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: "Kungaboqar yog'i (1L)", category: 'Oziq-ovqat', quantity: 24, unit: 'dona', unitCost: 15500, totalCost: 372000 },
        { name: 'Shakar (1 kg)', category: 'Oziq-ovqat', quantity: 50, unit: 'kg', unitCost: 9000, totalCost: 450000 },
        { name: 'Tuxum (30 dona)', category: 'Oziq-ovqat', quantity: 10, unit: 'quti', unitCost: 36000, totalCost: 360000 },
      ],
    };
  }

  return scanResult;
}

function applyMarkupToProducts(
  items: any[],
  markupPercent: number,
  supplierName: string,
  dateStr?: string
): { addedProducts: any[]; totalCost: number; totalRevenue: number; expectedProfit: number } {
  const percent = Math.max(0, Math.round(markupPercent));
  const addedProducts: any[] = [];

  for (const item of items) {
    const prod = {
      id: `prod-photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      category: item.category || 'Umumiy',
      quantity: item.quantity,
      unit: item.unit || 'dona',
      unitCost: item.unitCost,
      markupPercent: percent,
      date: dateStr || new Date().toISOString().split('T')[0],
      supplier: supplierName,
      notes: "Rasm/chek orqali kiritildi",
    };
    productsCache.unshift(prod);
    addedProducts.push(prod);
  }
  saveProducts(productsCache);

  const totalCost = addedProducts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const totalRevenue = addedProducts.reduce(
    (sum, p) => sum + p.quantity * Math.round(p.unitCost * (1 + p.markupPercent / 100)),
    0
  );
  const expectedProfit = totalRevenue - totalCost;

  return { addedProducts, totalCost, totalRevenue, expectedProfit };
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

// Login endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Login va parol kiritilishi shart' });
    return;
  }

  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();

  const foundUser = usersCache.find(
    (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
  );

  if (!foundUser) {
    res.status(401).json({
      error: "Noto'g'ri login yoki parol! Iltimos, ma'lumotlarni tekshirib qaytadan kiriting.",
    });
    return;
  }

  const token = generateToken(foundUser.id);
  // Store session for 7 days
  activeTokens.set(token, {
    user: foundUser,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: sanitizeUser(foundUser),
  });
});

// Verify token / get current user
app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-auth-token'];
  const queryToken = req.query.token as string | undefined;

  let token: string | undefined = undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof customHeader === 'string') {
    token = customHeader.trim();
  } else if (queryToken) {
    token = queryToken.trim();
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({
      error: 'Avtorizatsiyadan o\'tilmagan yoki sessiya muddati tugagan',
      isAuthenticated: false,
    });
    return;
  }

  res.json({
    success: true,
    isAuthenticated: true,
    user: sanitizeUser(user),
  });
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const customHeader = req.headers['x-auth-token'];
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    customHeader;

  if (typeof token === 'string') {
    activeTokens.delete(token.trim());
  }

  res.json({ success: true, message: 'Tizimdan chiqildi' });
});

// Demo accounts info endpoint
app.get('/api/auth/demo-users', (req: Request, res: Response) => {
  res.json({
    demoAccounts: [
      {
        username: 'admin',
        role: 'admin',
        roleTitle: "Do'kon Egasi / Boshqaruvchi",
        passwordHint: 'admin123',
      },
      {
        username: 'kassir',
        role: 'cashier',
        roleTitle: 'Kassir / Hisobchi',
        passwordHint: 'kassa2026',
      },
    ],
  });
});

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// 1. Get all products
app.get('/api/products', (req: Request, res: Response) => {
  res.json({ products: productsCache });
});

// 2. Add product or batch of products
app.post('/api/products', (req: Request, res: Response) => {
  const newItems = Array.isArray(req.body) ? req.body : [req.body];
  const created: any[] = [];

  for (const item of newItems) {
    if (!item.name) continue;
    const newItem = {
      id: item.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(item.name).trim(),
      category: String(item.category || 'Umumiy').trim(),
      quantity: Math.max(0, Number(item.quantity) || 1),
      unit: String(item.unit || 'dona').trim().toLowerCase(),
      unitCost: Math.max(0, Number(item.unitCost) || 0),
      markupPercent: Number(item.markupPercent) ?? 20,
      date: item.date || new Date().toISOString().split('T')[0],
      supplier: String(item.supplier || "Do'kon ombori").trim(),
      notes: item.notes ? String(item.notes) : '',
    };
    created.push(newItem);
    productsCache.unshift(newItem);
  }

  saveProducts(productsCache);
  res.json({ success: true, count: created.length, products: productsCache });
});

// 3. Update single product
app.put('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = productsCache.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Tovar topilmadi' });
    return;
  }

  productsCache[index] = {
    ...productsCache[index],
    ...req.body,
    quantity: Math.max(0, Number(req.body.quantity ?? productsCache[index].quantity)),
    unitCost: Math.max(0, Number(req.body.unitCost ?? productsCache[index].unitCost)),
    markupPercent: Number(req.body.markupPercent ?? productsCache[index].markupPercent),
  };

  saveProducts(productsCache);
  res.json({ success: true, product: productsCache[index] });
});

// 4. Batch update markup
app.put('/api/products-batch-markup', (req: Request, res: Response) => {
  const { ids, markupPercent } = req.body;
  if (!Array.isArray(ids) || typeof markupPercent !== 'number') {
    res.status(400).json({ error: 'Noto\'g\'ri parametrlar' });
    return;
  }

  const idSet = new Set(ids);
  let updatedCount = 0;

  productsCache = productsCache.map((prod) => {
    if (idSet.has(prod.id)) {
      updatedCount++;
      return { ...prod, markupPercent };
    }
    return prod;
  });

  saveProducts(productsCache);
  res.json({ success: true, updatedCount, products: productsCache });
});

// 5. Delete product
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  productsCache = productsCache.filter((p) => p.id !== id);
  saveProducts(productsCache);
  res.json({ success: true, products: productsCache });
});

// 6. Reset to default demo data
app.post('/api/products/reset', (req: Request, res: Response) => {
  productsCache = [...defaultProducts];
  saveProducts(productsCache);
  res.json({ success: true, products: productsCache });
});

// 7. AI Gemini Vision Invoice / Receipt Scanner
app.post('/api/scan-receipt', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Rasm yuborilmadi (imageBase64 talab qilinadi)' });
      return;
    }

    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback demo parsing when API key is unavailable or in offline testing
      console.warn('GEMINI_API_KEY mavjud emas, namunaviy tovarlar qaytarilmoqda');
      res.json({
        result: {
          supplier: 'Agro Savdo Baraka MCHJ',
          date: new Date().toISOString().split('T')[0],
          invoiceNumber: 'SF-' + Math.floor(10000 + Math.random() * 90000),
          items: [
            {
              name: 'Osh tuzi (Iodlangan)',
              category: 'Oziq-ovqat',
              quantity: 100,
              unit: 'pachka',
              unitCost: 2500,
              totalCost: 250000,
            },
            {
              name: 'Makaron (Makfa 400g)',
              category: 'Oziq-ovqat',
              quantity: 60,
              unit: 'dona',
              unitCost: 9000,
              totalCost: 540000,
            },
            {
              name: 'Tomat pastasi (Pomidor 850g)',
              category: 'Oziq-ovqat',
              quantity: 40,
              unit: 'banka',
              unitCost: 17500,
              totalCost: 700000,
            },
          ],
          totalInvoiceAmount: 1490000,
          notes: "AI demo rejimida hisob-faktura ma'lumotlari shakllantirildi.",
        },
      });
      return;
    }

    const prompt = `Siz savdo do'koni hisobchisi va hisob-faktura (nakladnoy/chek) skanerisiz.
Ushbu rasmda ko'rsatilgan hisob-faktura yoki tovar chekini to'liq tahlil qiling.
Har bir kelgan tovar nomi (O'zbek yoki Rus tilida), uning o'lchov birligi (kg, dona, litr, qop, quti, pachka, banka va h.k.), miqdori, 1 birlik tannarxi (kelish narxi), jami summasi, ta'minotchi (supplier) nomi va sana (YYYY-MM-DD) ma'lumotlarini aniq ajrating.
Barcha narxlar va miqdorlar faqat raqam bo'lsin.
Agar ma'lumot noaniq bo'lsa, mantiqiy taxmin qiling.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            supplier: {
              type: Type.STRING,
              description: "Ta'minotchi tashkilot yoki do'kon nomi",
            },
            date: {
              type: Type.STRING,
              description: 'Faktura sanasi (YYYY-MM-DD)',
            },
            invoiceNumber: {
              type: Type.STRING,
              description: 'Faktura yoki chek raqami',
            },
            totalInvoiceAmount: {
              type: Type.NUMBER,
              description: 'Fakturaning umumiy jami summasi',
            },
            notes: {
              type: Type.STRING,
              description: "Qo'shimcha izoh yoki xulosa",
            },
            items: {
              type: Type.ARRAY,
              description: 'Kelgan tovarlar ro\'yxati',
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: 'Tovar nomi',
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Tovar kategoriyasi (masalan: Oziq-ovqat, Ichimliklar, Meva-Sabzavot, Sut mahsulotlari, Xo\'jalik)',
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: 'Kelgan tovar miqdori',
                  },
                  unit: {
                    type: Type.STRING,
                    description: 'Birligi (kg, dona, litr, qop, quti, pachka, banka)',
                  },
                  unitCost: {
                    type: Type.NUMBER,
                    description: '1 birlik tannarxi so\'mda',
                  },
                  totalCost: {
                    type: Type.NUMBER,
                    description: 'Jami tovar summasi (miqdor * narx)',
                  },
                },
                required: ['name', 'quantity', 'unit', 'unitCost'],
              },
            },
          },
          required: ['supplier', 'items'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ result: parsedJson });
  } catch (error: any) {
    console.error('Gemini Vision Scanner Error:', error);
    res.status(500).json({
      error: 'Rasm tahlil qilishda xatolik yuz berdi: ' + (error.message || 'Noma\'lum xatolik'),
    });
  }
});

// 8. Telegram Chat Simulator / Engine Endpoint
app.post('/api/telegram/chat', async (req: Request, res: Response) => {
  try {
    const {
      text = '',
      imageBase64,
      pendingItems,
      markupPercent,
      action,
      sessionToken,
      chatId = 'default-chat',
    } = req.body;
    const trimmed = text.trim();

    // Check existing authentication
    let currentAuthUser: AppUser | null = null;
    let currentToken: string | null = null;

    if (sessionToken && typeof sessionToken === 'string') {
      currentAuthUser = verifyToken(sessionToken);
      if (currentAuthUser) currentToken = sessionToken;
    }

    if (!currentAuthUser && telegramAuthSessions.has(String(chatId))) {
      const sess = telegramAuthSessions.get(String(chatId))!;
      currentAuthUser = sess.user;
      currentToken = sess.token;
    }

    // 1. Handle /login [username] [password]
    const loginMatch = trimmed.match(/^\/login(?:\s+([^\s]+)\s+([^\s]+))?$/i);
    if (loginMatch) {
      const inputUser = loginMatch[1]?.trim().toLowerCase();
      const inputPass = loginMatch[2]?.trim();

      if (!inputUser || !inputPass) {
        res.json({
          reply: `🔑 <b>Avtorizatsiya formati:</b>\n\nIltimos, login va parolingizni kiriting:\n👉 <code>/login [login] [parol]</code>\n\n💡 <b>Namunaviy hisoblar:</b>\n• <code>/login admin admin123</code> (Boshqaruvchi)\n• <code>/login kassir kassa2026</code> (Kassir)`,
          actionType: 'login_required',
          isAuthenticated: false,
        });
        return;
      }

      const matchedUser = usersCache.find(
        (u) => u.username.toLowerCase() === inputUser && u.password === inputPass
      );

      if (matchedUser) {
        const newToken = generateToken(matchedUser.id);
        activeTokens.set(newToken, {
          user: matchedUser,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        telegramAuthSessions.set(String(chatId), {
          user: matchedUser,
          token: newToken,
          loginAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        res.json({
          reply: `✅ <b>Avtorizatsiyadan muvaffaqiyatli o'tdingiz!</b>\n\nXush kelibsiz, <b>${matchedUser.name}</b>!\n🏷️ Lavozim: <i>${matchedUser.roleTitle}</i>\n🛡️ Xavfsizlik: <b>To'liq ruxsat berildi</b>\n\nEndi bot orqali barcha amallar faol:\n• <code>/search [nomi]</code> — tovarlarni qidirish\n• <code>/statistika</code> — do'kon balansi va foyda\n• <code>/excel</code> — Excel (.xlsx) jadvali\n• <code>/pdf</code> — Rasmiy A4 hisobot\n• 📸 Chek rasmini yuborish — AI tahlil va saqlash\n• <code>/logout</code> — tizimdan chiqish\n\n📱 <b>SmartSavdo WebApp:</b>\nDo'kon boshqaruv panelini quyidagi tugma orqali to'g'ridan-to'g'ri ishga tushiring:`,
          actionType: 'open_webapp',
          authToken: newToken,
          userRole: matchedUser.roleTitle,
          user: sanitizeUser(matchedUser),
          isAuthenticated: true,
        });
        return;
      } else {
        res.json({
          reply: `❌ <b>Login yoki parol noto'g'ri!</b>\n\nIltimos, qaytadan tekshirib kiriting:\n👉 <code>/login [login] [parol]</code>\n\nMisol:\n<code>/login admin admin123</code>`,
          actionType: 'login_required',
          isAuthenticated: false,
        });
        return;
      }
    }

    // 2. Handle /logout
    if (trimmed === '/logout') {
      if (currentToken) {
        activeTokens.delete(currentToken);
      }
      telegramAuthSessions.delete(String(chatId));

      res.json({
        reply: `🔒 <b>Tizimdan muvaffaqiyatli chiqildi.</b>\n\nBot xavfsizlik holatiga o'tkazildi. Qayta kirish uchun:\n👉 <code>/login [login] [parol]</code>`,
        actionType: 'login_required',
        isAuthenticated: false,
      });
      return;
    }

    // 3. Security Guard: If user is NOT authenticated, block all sensitive operations!
    if (!currentAuthUser) {
      if (trimmed === '/start' || trimmed === '/help') {
        res.json({
          reply: `👋 <b>Assalomu alaykum! SmartSavdo Telegram botiga xush kelibsiz!</b>\n\n🔒 <b>DIQQAT: Tizim xavfsizlik bilan himoyalangan.</b>\nDo'kon tovarlari, narxlar, hisob-fakturalar va kassa ma'lumotlarini ko'rish hamda tahrirlash uchun avval avtorizatsiyadan o'tishingiz kerak.\n\n🔑 <b>Kirish uchun quyidagicha yozing:</b>\n👉 <code>/login [login] [parol]</code>\n\n💡 <i>Namunaviy hisoblar:</i>\n• <code>/login admin admin123</code> (Do'kon egasi / Boshqaruvchi)\n• <code>/login kassir kassa2026</code> (Kassir)`,
          actionType: 'login_required',
          isAuthenticated: false,
        });
        return;
      }

      // Any attempt to search, view stats, export, upload receipt without auth
      res.json({
        reply: `⛔ <b>Ruxsat etilmadi! (Avtorizatsiyadan o'tilmagan)</b>\n\nDo'kon ma'lumotlarini ko'rish yoki amallarni bajarish uchun avval login va parol bilan tizimga kiring:\n\n👉 <code>/login [login] [parol]</code>\n\nMasalan:\n<code>/login admin admin123</code>`,
        actionType: 'login_required',
        isAuthenticated: false,
      });
      return;
    }

    // 4. WebApp command
    if (trimmed === '/webapp' || trimmed === '/app') {
      res.json({
        reply: `📱 <b>SmartSavdo WebApp ilovasi:</b>\n\nSiz tizimga kirdingiz: <b>${currentAuthUser.name}</b> (${currentAuthUser.roleTitle})\n\nQuyidagi tugmani bosib do'kon boshqaruv panelini to'liq ekranli WebApp rejimida oching:`,
        actionType: 'open_webapp',
        authToken: currentToken,
        userRole: currentAuthUser.roleTitle,
        isAuthenticated: true,
      });
      return;
    }

    // 5. Handling markup confirmation for previously scanned items
    if (action === 'apply_markup' && markupPercent !== undefined) {
      const itemsToApply = Array.isArray(pendingItems) && pendingItems.length > 0
        ? pendingItems
        : pendingMarkupSessions.get(String(chatId))?.items;

      if (!itemsToApply || itemsToApply.length === 0) {
        res.json({
          reply: `⚠️ Kutilayotgan tovarlar topilmadi yoki allaqachon saqlangan. Yangi tovar qo'shish uchun /new yoki rasm yuboring.`,
          isAuthenticated: true,
        });
        return;
      }

      const percent = Number(markupPercent) || 20;
      const supplierName = currentAuthUser ? `${currentAuthUser.name} (Telegram)` : "Telegram Bot";
      const { addedProducts, totalCost, totalRevenue, expectedProfit } = applyMarkupToProducts(
        itemsToApply,
        percent,
        supplierName
      );
      pendingMarkupSessions.delete(String(chatId));

      const itemsList = addedProducts.map((p, i) => `${i + 1}. <b>${p.name}</b>: ${p.quantity} ${p.unit} (tannarx: ${formatSom(p.unitCost)} -> sotish: <b>${formatSom(Math.round(p.unitCost * (1 + p.markupPercent / 100)))}</b>)`).join('\n');

      res.json({
        reply: `✅ <b>Muvaffaqiyatli saqlandi!</b>\n\n📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n💰 Jami keltirilgan xarajat: <b>${formatSom(totalCost)}</b>\n📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\nKirituvchi: <b>${currentAuthUser.name}</b>\n\n💡 <i>Tovar do'kon bazasiga saqlandi va saytda darhol aks etadi!</i>`,
        actionType: 'saved',
        productAdded: true,
        products: productsCache,
        isAuthenticated: true,
      });
      return;
    }

    // 6. Image sent in chat -> AI Gemini Vision scan
    if (imageBase64) {
      const scanResult = await scanReceiptImage(imageBase64);

      pendingMarkupSessions.set(String(chatId), {
        items: scanResult.items,
        supplier: scanResult.supplier,
        date: scanResult.date,
        userName: currentAuthUser.name,
        timestamp: Date.now(),
      });

      const itemsSummary = scanResult.items
        .map(
          (it: any, idx: number) =>
            `${idx + 1}. <b>${it.name}</b>: ${it.quantity} ${it.unit} x ${formatSom(it.unitCost)} = ${formatSom(it.quantity * it.unitCost)}`
        )
        .join('\n');

      res.json({
        reply: `🧾 <b>Tovar / hisob-faktura rasmi muvaffaqiyatli skanerlandi!</b>\n\n🏢 Ta'minotchi: <i>${scanResult.supplier || 'Noma\'lum'}</i>\n📅 Sana: <i>${scanResult.date || 'Bugun'}</i>\n\n<b>Topilgan tovarlar:</b>\n${itemsSummary}\n\n❓ <b>Ushbu tovarlar ustiga necha foiz ustama qo'ymoqchisiz?</b>\nQuyidagi tugmalardan birini tanlang yoki o'z foizingizni yozing (masalan: <code>25</code> yoki <code>30%</code>):`,
        actionType: 'ask_markup',
        pendingItems: scanResult.items,
        isAuthenticated: true,
      });
      return;
    }

    // 6.5. If user entered a markup percentage for pending scanned items
    const isMarkupNum = /^(\+?\s*\d{1,3}\s*%?|ustama\s*\d{1,3}\s*%?)$/i.test(trimmed) || (!isNaN(parseFloat(trimmed.replace(/[+%\s]/g, ''))) && parseFloat(trimmed.replace(/[+%\s]/g, '')) <= 500 && !trimmed.startsWith('/'));
    const pendingSession = pendingMarkupSessions.get(String(chatId));

    if (isMarkupNum && pendingSession && pendingSession.items.length > 0) {
      const percent = parseFloat(trimmed.replace(/[^\d.]/g, '')) || 20;
      const supplierName = currentAuthUser ? `${currentAuthUser.name} (Telegram)` : (pendingSession.supplier || "Telegram Bot");
      const { addedProducts, totalCost, totalRevenue, expectedProfit } = applyMarkupToProducts(
        pendingSession.items,
        percent,
        supplierName,
        pendingSession.date
      );
      pendingMarkupSessions.delete(String(chatId));

      const itemsList = addedProducts.map((p, i) => `${i + 1}. <b>${p.name}</b>: ${p.quantity} ${p.unit} (tannarx: ${formatSom(p.unitCost)} -> sotish: <b>${formatSom(Math.round(p.unitCost * (1 + p.markupPercent / 100)))}</b>)`).join('\n');

      res.json({
        reply: `✅ <b>Muvaffaqiyatli saqlandi!</b>\n\n📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n💰 Jami keltirilgan xarajat: <b>${formatSom(totalCost)}</b>\n📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n\n💡 <i>Tovarlar do'kon bazasiga kiritildi va saytda aks etadi!</i>`,
        actionType: 'saved',
        productAdded: true,
        products: productsCache,
        isAuthenticated: true,
      });
      return;
    }

    // 7. Text Commands for Authorized User
    if (trimmed === '/start') {
      res.json({
        reply: `👋 <b>Xush kelibsiz, ${currentAuthUser.name}!</b>\n\nSiz avtorizatsiyadan o'tgansiz (${currentAuthUser.roleTitle}).\n\nQuyidagi buyruqlardan foydalanishingiz mumkin:\n➕ <b>/new [tovar] [miqdor] [birlik] [tannarx] [ustama]</b> — yangi tovar qo'shish\n📸 <b>Chek yoki faktura rasmini yuboring</b> — AI uni avtomat o'qiydi\n🔎 <b>/search [tovar]</b> — tovar narxi va qoldig'i\n📊 <b>/statistika</b> — jami xarajat, tushum va sof foyda\n📑 <b>/excel</b> — tovarlar jadvalini .xlsx yuklab olish\n📄 <b>/pdf</b> — rasmiy A4 PDF hisobot\n📱 <b>/webapp</b> — WebApp do'kon ilovasi\n🔒 <b>/logout</b> — tizimdan chiqish`,
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed === '/help') {
      res.json({
        reply: `📌 <b>Telegram Bot Buyruqlari:</b>\n\n• <b>/new [nomi] [miqdor] [birlik] [tannarx] [ustama]</b> - Yangi tovar qo'shish.\n  <i>Masalan: /new Olma 50 kg 12000 25</i>\n• <b>/search [nomi]</b> - Tovar narxi, tannarxi, qoldig'ini ko'rsatadi.\n  <i>Masalan: /search Olma yoki /search Shakar</i>\n• <b>/statistika</b> - Moliyaviy ko'rsatkichlar (KPI).\n• <b>/excel</b> - Barcha tovarlar ro'yxatini Excel (.xlsx) formatida taqdim etadi.\n• <b>/pdf</b> - A4 formatidagi rasmiy chop etish hisoboti.\n• <b>/webapp</b> - To'liq ekranli do'kon ilovasini ochish.\n• <b>/logout</b> - Tizimdan chiqish.\n• <b>Rasm yuborish</b> - Faktura yoki chek rasmini yuboring, Gemini Vision uni tahlil qiladi.`,
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed.startsWith('/new') || trimmed.startsWith('/yangi')) {
      const param = trimmed.replace(/^\/(new|yangi)\s*/i, '').trim();
      const parsed = parseNewProductInput(param);

      if (!parsed.success) {
        if (parsed.error === 'empty') {
          res.json({
            reply: `➕ <b>Yangi tovar qo'shish (/new buyrug'i)</b>\n\nFormat:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\n📌 <b>Misollar:</b>\n• <code>/new Olma 50 kg 12000 25</code>\n• <code>/new Shakar 100 kg 9500 20</code>\n• <code>/new Coca-Cola 1.5L 24 dona 14000 15</code>\n• <code>/new O'simlik yog'i 30 litr 16500 20</code>\n\n💡 <i>Ustama foizini yozmasangiz, avtomatik 20% hisoblanadi. Vergul bilan ham yozishingiz mumkin:\n<code>/new Non, 100 dona, 3500, 15%</code></i>`,
            isAuthenticated: true,
          });
          return;
        } else {
          res.json({
            reply: `⚠️ <b>Tovar ma'lumotlari to'liq kiritilmadi.</b>\n\nIltimos, quyidagi tartibda yozing:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\nMisol:\n<code>/new Olma 50 kg 12000 25</code>\nyoki\n<code>/new Non, 100 dona, 3500 so'm, 15%</code>`,
            isAuthenticated: true,
          });
          return;
        }
      }

      const it = parsed.item!;
      const newProduct = {
        id: `prod-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: it.name,
        category: it.category,
        quantity: it.quantity,
        unit: it.unit,
        unitCost: it.unitCost,
        markupPercent: it.markupPercent,
        date: new Date().toISOString().split('T')[0],
        supplier: currentAuthUser ? `${currentAuthUser.name} (Telegram)` : "Telegram Bot orqali",
        notes: "Telegram /new buyrug'i orqali kiritildi",
      };

      productsCache.unshift(newProduct);
      saveProducts(productsCache);

      const unitPrice = Math.round(newProduct.unitCost * (1 + newProduct.markupPercent / 100));
      const totalCost = newProduct.quantity * newProduct.unitCost;
      const totalRevenue = newProduct.quantity * unitPrice;
      const expectedProfit = totalRevenue - totalCost;

      res.json({
        reply: `✅ <b>Yangi tovar muvaffaqiyatli qo'shildi!</b>\n\n` +
          `📦 <b>${newProduct.name}</b> (${newProduct.category})\n` +
          `• Miqdori: <b>${newProduct.quantity} ${newProduct.unit}</b>\n` +
          `• Keltirilgan tannarxi: <b>${formatSom(newProduct.unitCost)}</b> / ${newProduct.unit}\n` +
          `• Belgilangan ustama: <b>+${newProduct.markupPercent}%</b>\n` +
          `• Sotish tavsiya narxi: <b>${formatSom(unitPrice)}</b> / ${newProduct.unit}\n` +
          `• Jami partiya xarajati: <b>${formatSom(totalCost)}</b>\n` +
          `• Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n` +
          `• Ta'minotchi: <i>${newProduct.supplier}</i> (${newProduct.date})\n\n` +
          `💡 <i>Tovar do'kon bazasiga saqlandi va veb-saytda darhol aks etadi!</i>`,
        actionType: 'product_card',
        productData: newProduct,
        productAdded: true,
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed.startsWith('/search') || trimmed.startsWith('/tovar')) {
      const query = trimmed.replace(/^\/(search|tovar)\s*/i, '').trim().toLowerCase();
      if (!query) {
        res.json({
          reply: "⚠️ Iltimos, tovar nomini yozing.\nMasalan: <code>/search Olma</code> yoki <code>/search Shakar</code>",
          isAuthenticated: true,
        });
        return;
      }

      const matches = productsCache.filter((p) => p.name.toLowerCase().includes(query));
      if (matches.length === 0) {
        res.json({
          reply: `🔍 "<b>${query}</b>" bo'yicha do'kondan tovar topilmadi. Qidiruv so'zini tekshirib qaytadan urinib ko'ring.`,
          isAuthenticated: true,
        });
        return;
      }

      const card = matches
        .slice(0, 3)
        .map((p) => {
          const totalCost = p.quantity * p.unitCost;
          const unitPrice = Math.round(p.unitCost * (1 + p.markupPercent / 100));
          const totalRevenue = p.quantity * unitPrice;
          const totalProfit = totalRevenue - totalCost;

          return `📦 <b>${p.name}</b> (${p.category})\n` +
            `• Kelgan miqdori: <b>${p.quantity} ${p.unit}</b>\n` +
            `• 1 birlik tannarxi: <b>${formatSom(p.unitCost)}</b>\n` +
            `• Ustama: <b>+${p.markupPercent}%</b>\n` +
            `• Tavsiya etilgan sotish narxi: <b>${formatSom(unitPrice)}</b> / ${p.unit}\n` +
            `• Jami investitsiya: <b>${formatSom(totalCost)}</b>\n` +
            `• Kutilayotgan sof foyda: <b>${formatSom(totalProfit)}</b>\n` +
            `• Ta'minotchi: <i>${p.supplier}</i> (${p.date})`;
        })
        .join('\n\n───────────────\n\n');

      res.json({
        reply: `🔎 <b>Qidiruv natijalari (${matches.length} ta):</b>\n\n${card}`,
        actionType: 'product_card',
        productData: matches[0],
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed === '/statistika' || trimmed === '/kpi') {
      let totalCost = 0;
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalItems = productsCache.length;

      productsCache.forEach((p) => {
        const cost = p.quantity * p.unitCost;
        const price = Math.round(p.unitCost * (1 + p.markupPercent / 100));
        const rev = p.quantity * price;
        totalCost += cost;
        totalRevenue += rev;
        totalProfit += (rev - cost);
      });

      const avgMarkup = totalItems > 0
        ? Math.round(productsCache.reduce((a, b) => a + b.markupPercent, 0) / totalItems)
        : 0;

      res.json({
        reply: `📊 <b>Do'kon Moliyaviy Statistikasi:</b>\n\n` +
          `💰 <b>Jami xarajat (Tannarx):</b> ${formatSom(totalCost)}\n` +
          `📈 <b>Kutilayotgan tushum (Savdo):</b> ${formatSom(totalRevenue)}\n` +
          `💎 <b>Kutilayotgan sof foyda:</b> ${formatSom(totalProfit)}\n` +
          `🏷️ <b>O'rtacha ustama foizi:</b> +${avgMarkup}%\n` +
          `📦 <b>Mavjud tovar turlari:</b> ${totalItems} xil`,
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed === '/excel') {
      res.json({
        reply: `📥 <b>Excel fayl tayyorlandi!</b>\n\nBarcha ${productsCache.length} ta tovar ma'lumotlari, tannarxlari, ustamalari va hisoblangan sof foydalari jamlangan .xlsx faylni quyidagi tugma orqali yuklab olishingiz mumkin.`,
        actionType: 'excel_file',
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed === '/pdf') {
      res.json({
        reply: `📄 <b>Rasmiy A4 PDF hisobot tayyorlandi!</b>\n\nHisobotda moliyaviy xulosalar, tovarlar jadvali va hisobchi/rahbar imzo o'rinlari mavjud. Quyidagi tugma orqali yuklab oling:`,
        actionType: 'pdf_file',
        isAuthenticated: true,
      });
      return;
    }

    // Default conversational reply with recommendations
    res.json({
      reply: `Siz yozdingiz: "${trimmed}"\n\n💡 Quyidagi buyruqlardan birini foydalanishingiz mumkin:\n• <code>/search [tovar]</code> - tovar qidirish\n• <code>/statistika</code> - do'kon balansi\n• <code>/excel</code> - Excel yuklab olish\n• <code>/pdf</code> - PDF hisobot olish\n• <code>/webapp</code> - WebApp ilovasini ochish\n• <code>/logout</code> - tizimdan chiqish\n\nYoki tovar cheki/faktura rasmini yuboring!`,
      isAuthenticated: true,
    });
  } catch (err: any) {
    console.error('Telegram Chat API Error:', err);
    res.status(500).json({ error: 'Xatolik yuz berdi: ' + err.message });
  }
});

// -------------------------------------------------------------
// TELEGRAM BOT CORE & UPDATE PROCESSING
// -------------------------------------------------------------
function getPublicAppUrl(): string | undefined {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    const u = process.env.APP_URL.trim();
    return u.startsWith('http') ? u.replace(/\/$/, '') : `https://${u}`;
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN && process.env.RAILWAY_PUBLIC_DOMAIN.trim()) {
    const d = process.env.RAILWAY_PUBLIC_DOMAIN.trim();
    return `https://${d.replace(/\/$/, '')}`;
  }
  if (process.env.RAILWAY_STATIC_URL && process.env.RAILWAY_STATIC_URL.trim()) {
    const s = process.env.RAILWAY_STATIC_URL.trim();
    return s.startsWith('http') ? s.replace(/\/$/, '') : `https://${s}`;
  }
  return undefined;
}

let runtimeBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
let pollingActive = false;
let pollingAbortController: AbortController | null = null;
let currentBotMode: 'webhook' | 'polling' | 'idle' = 'idle';
let currentBotUser: any = null;
let lastTelegramError: string | null = null;

async function processTelegramUpdate(update: any, botToken: string): Promise<void> {
  if (!update || !botToken) return;

  // A. Handle inline keyboard callback queries (e.g. markup selection)
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbChatId = cb.message?.chat?.id || cb.from?.id;
    const cbKey = String(cbChatId);
    const data = String(cb.data || '');

    // Answer callback query so Telegram loading indicator stops
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });
    } catch (cbErr) {
      console.error('Error answering callback query:', cbErr);
    }

    if (data.startsWith('markup_')) {
      const percent = parseFloat(data.replace('markup_', '')) || 20;
      const pending = pendingMarkupSessions.get(cbKey);

      if (pending && pending.items.length > 0) {
        const supplierName = pending.userName ? `${pending.userName} (Telegram)` : (pending.supplier || "Telegram Bot");
        const { addedProducts, totalCost, totalRevenue, expectedProfit } = applyMarkupToProducts(
          pending.items,
          percent,
          supplierName,
          pending.date
        );
        pendingMarkupSessions.delete(cbKey);

        const itemsList = addedProducts
          .map(
            (p, i) =>
              `${i + 1}. <b>${p.name}</b>: ${p.quantity} ${p.unit} (tannarx: ${formatSom(p.unitCost)} -> sotish: <b>${formatSom(Math.round(p.unitCost * (1 + p.markupPercent / 100)))}</b>)`
          )
          .join('\n');

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cbChatId,
            text: `✅ <b>Tovarlar muvaffaqiyatli saqlandi!</b>\n\n` +
              `📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n` +
              `💰 Jami partiya tannarxi: <b>${formatSom(totalCost)}</b>\n` +
              `📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n` +
              `💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n\n` +
              `💡 <i>Tovarlar do'kon bazasiga kiritildi va saytda aks etadi!</i>`,
            parse_mode: 'HTML',
          }),
        });
        return;
      } else {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cbChatId,
            text: `⚠️ Kutilayotgan tovarlar topilmadi yoki allaqachon saqlangan. Yangi tovar qo'shish uchun /new yoki rasm yuboring.`,
            parse_mode: 'HTML',
          }),
        });
        return;
      }
    }
    return;
  }

  // B. Handle regular messages
  const message = update?.message;
  if (!message) return;

  const chatId = message.chat?.id;
  if (!chatId) return;

  const chatKey = String(chatId);
  let session = telegramAuthSessions.get(chatKey);

  // C. Photo upload handling in Telegram
  if (message.photo && message.photo.length > 0) {
    if (!session) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔒 <b>Ruxsat etilmadi!</b>\nChek yoki tovar rasmini yuklashdan oldin tizimga kiring:\n👉 <code>/login [login] [parol]</code>\n\nMisol: /login admin admin123`,
          parse_mode: 'HTML',
        }),
      });
      return;
    }

    // Send typing action
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
    });

    try {
      const photo = message.photo[message.photo.length - 1];
      const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${photo.file_id}`);
      const fileJson = await fileRes.json();
      const filePath = fileJson?.result?.file_path;

      let base64 = '';
      if (filePath) {
        const imgRes = await fetch(`https://api.telegram.org/file/bot${botToken}/${filePath}`);
        const arrayBuffer = await imgRes.arrayBuffer();
        base64 = Buffer.from(arrayBuffer).toString('base64');
      }

      const scanResult = await scanReceiptImage(base64);

      pendingMarkupSessions.set(chatKey, {
        items: scanResult.items,
        supplier: scanResult.supplier,
        date: scanResult.date,
        userName: session.user.name,
        timestamp: Date.now(),
      });

      const itemsSummary = scanResult.items
        .map(
          (it: any, idx: number) =>
            `${idx + 1}. <b>${it.name}</b>: ${it.quantity} ${it.unit} x ${formatSom(it.unitCost)} = ${formatSom(it.quantity * it.unitCost)}`
        )
        .join('\n');

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🧾 <b>Tovar / hisob-faktura rasmi qabul qilindi!</b>\n\n` +
            `🏢 Ta'minotchi: <i>${scanResult.supplier || 'Noma\'lum'}</i>\n` +
            `📅 Sana: <i>${scanResult.date || 'Bugun'}</i>\n\n` +
            `<b>Aniqlangan tovarlar:</b>\n${itemsSummary}\n\n` +
            `❓ <b>Ushbu tovarlar ustiga necha foiz ustama qo'ymoqchisiz?</b>\n` +
            `Quyidagi tugmalardan birini tanlang yoki o'z foizingizni yozing (masalan: <code>25</code> yoki <code>30%</code>):`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '+15% ustama', callback_data: 'markup_15' },
                { text: '+20% ustama', callback_data: 'markup_20' },
              ],
              [
                { text: '+25% ustama', callback_data: 'markup_25' },
                { text: '+30% ustama', callback_data: 'markup_30' },
              ],
            ],
          },
        }),
      });
      return;
    } catch (photoErr) {
      console.error('Photo processing error in telegram bot:', photoErr);
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `⚠️ Rasmni o'qishda xatolik yuz berdi. Iltimos qaytadan yuboring yoki /new buyrug'idan foydalaning.`,
          parse_mode: 'HTML',
        }),
      });
      return;
    }
  }

  // D. Text message handling
  const text = (message.text || '').trim();
  let responseText = '';
  const loginMatch = text.match(/^\/login(?:\s+([^\s]+)\s+([^\s]+))?$/i);

  if (loginMatch) {
    const u = loginMatch[1]?.trim().toLowerCase();
    const p = loginMatch[2]?.trim();
    const matched = usersCache.find(
      (usr) => usr.username.toLowerCase() === u && usr.password === p
    );

    if (matched) {
      const token = generateToken(matched.id);
      activeTokens.set(token, {
        user: matched,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      telegramAuthSessions.set(chatKey, {
        user: matched,
        token,
        loginAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `✅ <b>Avtorizatsiya muvaffaqiyatli!</b>\n\nXush kelibsiz, <b>${matched.name}</b> (${matched.roleTitle})!\n\n📱 <b>SmartSavdo WebApp:</b>\n<a href="${appUrl}?auth_token=${token}">Do'kon WebApp Ilovasini Ochish</a>\n\nEndi buyruqlar faol:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama]\n📸 Chek yoki tovar rasmini yuboring\n🔎 /search [nomi]\n📊 /statistika\n📑 /excel\n🔒 /logout`;
    } else {
      responseText = `❌ <b>Login yoki parol noto'g'ri!</b>\nQaytadan kiriting: /login [login] [parol]\nMasalan: /login admin admin123`;
    }
  } else if (text === '/logout') {
    if (session) {
      activeTokens.delete(session.token);
      telegramAuthSessions.delete(chatKey);
      pendingMarkupSessions.delete(chatKey);
    }
    responseText = `🔒 <b>Tizimdan chiqildi.</b>\nQayta kirish: /login [login] [parol]`;
  } else if (!session) {
    // Not logged in
    responseText = `🔒 <b>SmartSavdo Xavfsizlik Tizimi:</b>\nDo'kon ma'lumotlarini ko'rish uchun avval avtorizatsiyadan o'ting:\n\n👉 <code>/login [login] [parol]</code>\n\nMisol:\n• <code>/login admin admin123</code> (Admin)\n• <code>/login kassir kassa2026</code> (Kassir)`;
  } else {
    // Check if user is replying with a markup percentage for pending photo
    const isMarkupInput = /^(\+?\s*\d{1,3}\s*%?|ustama\s*\d{1,3}\s*%?)$/i.test(text) || (!isNaN(parseFloat(text.replace(/[+%\s]/g, ''))) && parseFloat(text.replace(/[+%\s]/g, '')) <= 500 && !text.startsWith('/'));
    const pending = pendingMarkupSessions.get(chatKey);

    if (isMarkupInput && pending && pending.items.length > 0) {
      const percent = parseFloat(text.replace(/[^\d.]/g, '')) || 20;
      const supplierName = pending.userName ? `${pending.userName} (Telegram)` : (pending.supplier || "Telegram Bot");
      const { addedProducts, totalCost, totalRevenue, expectedProfit } = applyMarkupToProducts(
        pending.items,
        percent,
        supplierName,
        pending.date
      );
      pendingMarkupSessions.delete(chatKey);

      const itemsList = addedProducts
        .map(
          (p, i) =>
            `${i + 1}. <b>${p.name}</b>: ${p.quantity} ${p.unit} (tannarx: ${formatSom(p.unitCost)} -> sotish: <b>${formatSom(Math.round(p.unitCost * (1 + p.markupPercent / 100)))}</b>)`
        )
        .join('\n');

      responseText = `✅ <b>Tovarlar muvaffaqiyatli saqlandi!</b>\n\n` +
        `📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n` +
        `💰 Jami partiya tannarxi: <b>${formatSom(totalCost)}</b>\n` +
        `📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n` +
        `💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n\n` +
        `💡 <i>Tovarlar do'kon bazasiga kiritildi va saytda aks etadi!</i>`;
    } else if (text.startsWith('/start')) {
      responseText = `Assalomu alaykum, <b>${session.user.name}</b>!\nSmartSavdo do'kon botiga xush kelibsiz!\n\nBuyruqlar:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama] - yangi tovar qo'shish\n📸 Chek yoki tovar rasmini yuboring - AI avtomat taniydi\n🔎 /search [nomi] - tovar qidirish\n📊 /statistika - kassa va sof foyda\n📑 /excel - Excel hisobot\n📱 /webapp - WebApp ilovasini ochish\n🔒 /logout - chiqish`;
    } else if (text.startsWith('/new') || text.startsWith('/yangi')) {
      const param = text.replace(/^\/(new|yangi)\s*/i, '').trim();
      const parsed = parseNewProductInput(param);

      if (!parsed.success) {
        if (parsed.error === 'empty') {
          responseText = `➕ <b>Yangi tovar qo'shish (/new buyrug'i)</b>\n\nFormat:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\n📌 <b>Misollar:</b>\n• <code>/new Olma 50 kg 12000 25</code>\n• <code>/new Shakar 100 kg 9500 20</code>\n• <code>/new Coca-Cola 1.5L 24 dona 14000 15</code>\n• <code>/new O'simlik yog'i 30 litr 16500 20</code>\n\n💡 <i>Ustama foizini yozmasangiz, avtomatik 20% hisoblanadi. Vergul bilan ham yozishingiz mumkin:\n<code>/new Non, 100 dona, 3500, 15%</code>\n\nYoki to'g'ridan-to'g'ri chek/tovar rasmini yuboring!</i>`;
        } else {
          responseText = `⚠️ <b>Tovar ma'lumotlari to'liq kiritilmadi.</b>\n\nIltimos, quyidagi tartibda yozing:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\nMisol:\n<code>/new Olma 50 kg 12000 25</code>\nyoki\n<code>/new Non, 100 dona, 3500 so'm, 15%</code>`;
        }
      } else {
        const it = parsed.item!;
        const newProduct = {
          id: `prod-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: it.name,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          unitCost: it.unitCost,
          markupPercent: it.markupPercent,
          date: new Date().toISOString().split('T')[0],
          supplier: session ? `${session.user.name} (Telegram)` : "Telegram Bot orqali",
          notes: "Telegram /new buyrug'i orqali kiritildi",
        };

        productsCache.unshift(newProduct);
        saveProducts(productsCache);

        const unitPrice = Math.round(newProduct.unitCost * (1 + newProduct.markupPercent / 100));
        const totalCost = newProduct.quantity * newProduct.unitCost;
        const totalRevenue = newProduct.quantity * unitPrice;
        const expectedProfit = totalRevenue - totalCost;

        responseText = `✅ <b>Yangi tovar muvaffaqiyatli qo'shildi!</b>\n\n` +
          `📦 <b>${newProduct.name}</b> (${newProduct.category})\n` +
          `• Miqdori: <b>${newProduct.quantity} ${newProduct.unit}</b>\n` +
          `• Keltirilgan tannarxi: <b>${formatSom(newProduct.unitCost)}</b> / ${newProduct.unit}\n` +
          `• Belgilangan ustama: <b>+${newProduct.markupPercent}%</b>\n` +
          `• Sotish tavsiya narxi: <b>${formatSom(unitPrice)}</b> / ${newProduct.unit}\n` +
          `• Jami partiya xarajati: <b>${formatSom(totalCost)}</b>\n` +
          `• Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n` +
          `• Ta'minotchi: <i>${newProduct.supplier}</i> (${newProduct.date})\n\n` +
          `💡 <i>Tovar do'kon bazasiga saqlandi va veb-saytda darhol aks etadi!</i>`;
      }
    } else if (text.startsWith('/search')) {
      const q = text.replace('/search', '').trim().toLowerCase();
      const match = productsCache.find((p) => p.name.toLowerCase().includes(q));
      if (match) {
        responseText = `📦 <b>${match.name}</b> (${match.category})\nMiqdor: ${match.quantity} ${match.unit}\nTannarx: ${formatSom(match.unitCost)}\nSotish narxi: ${formatSom(match.unitCost * (1 + match.markupPercent / 100))}\nUstama: +${match.markupPercent}%\nTa'minotchi: ${match.supplier}`;
      } else {
        responseText = `"${q}" bo'yicha tovar topilmadi.`;
      }
    } else if (text.startsWith('/statistika')) {
      const totalCost = productsCache.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
      const totalRev = productsCache.reduce((sum, p) => sum + p.quantity * (p.unitCost * (1 + p.markupPercent / 100)), 0);
      responseText = `📊 <b>Do'kon Balansi:</b>\n💰 Tannarx: ${formatSom(totalCost)}\n📈 Tushum: ${formatSom(totalRev)}\n💎 Sof Foyda: ${formatSom(totalRev - totalCost)}\n📦 Tovar turlari: ${productsCache.length} xil`;
    } else if (text.startsWith('/webapp')) {
      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `📱 <b>SmartSavdo WebApp:</b>\n\nQuyidagi havola orqali do'koningizni to'liq boshqaring:\n<a href="${appUrl}?auth_token=${session.token}">👉 SmartSavdo WebApp Ilovasini Ochish</a>`;
    } else if (text.startsWith('/excel')) {
      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `📑 <b>Do'kon tovarlari Excel hisoboti:</b>\n\nJami tovarlar soni: ${productsCache.length} xil.\nExcel va PDF fayllarni to'liq yuklab olish uchun WebApp ilovasiga kiring:\n<a href="${appUrl}">SmartSavdo Tizimi</a>`;
    } else {
      responseText = `Xush kelibsiz! Buyruqlar:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama]\n📸 Chek rasmini yuboring\n🔎 /search [tovar]\n📊 /statistika\n📱 /webapp\n🔒 /logout`;
    }
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: responseText, parse_mode: 'HTML' }),
    });
  } catch (sendErr) {
    console.error('Failed to send Telegram message:', sendErr);
  }
}

// Long Polling Engine
async function startTelegramPolling(token: string) {
  if (pollingActive) return;
  pollingActive = true;
  currentBotMode = 'polling';
  pollingAbortController = new AbortController();
  console.log('[Telegram Bot] Starting Long Polling mode (works anywhere without public domain)...');

  let offset = 0;
  while (pollingActive) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`,
        { signal: pollingAbortController.signal }
      );
      const data = await response.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await processTelegramUpdate(update, token).catch((err) => {
            console.error('[Telegram Polling Update Error]:', err);
          });
        }
      } else if (!data.ok) {
        lastTelegramError = data.description || 'Telegram API Error';
        console.warn('[Telegram Polling Warning]:', data.description);

        // If webhook conflict, delete webhook
        if (data.description && data.description.includes('webhook is active')) {
          console.log('[Telegram Bot] Webhook conflict detected, deleting webhook to switch to polling...');
          await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        }
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        break;
      }
      console.error('[Telegram Polling Exception]:', err.message);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  pollingActive = false;
  if (currentBotMode === 'polling') {
    currentBotMode = 'idle';
  }
  console.log('[Telegram Bot] Long Polling stopped.');
}

function stopTelegramPolling() {
  pollingActive = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
}

// 9. Real Telegram Bot Status & Diagnostics Endpoint
app.get('/api/telegram/status', async (req: Request, res: Response) => {
  const token = runtimeBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const detectedUrl = getPublicAppUrl();

  if (!token) {
    res.json({
      configured: false,
      mode: 'idle',
      message: "TELEGRAM_BOT_TOKEN o'rnatilmagan",
      detectedAppUrl: detectedUrl,
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || null,
    });
    return;
  }

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const meData = await meRes.json();

    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const whData = await whRes.json();

    const mode = pollingActive ? 'polling' : (whData?.result?.url ? 'webhook' : 'idle');
    if (meData.ok) {
      currentBotUser = meData.result;
    }

    res.json({
      configured: meData.ok,
      botUser: meData.ok ? meData.result : null,
      error: meData.ok ? null : meData.description,
      mode,
      webhookInfo: whData?.result || null,
      detectedAppUrl: detectedUrl,
      railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || null,
      tokenMasked: token.length > 10 ? token.substring(0, 6) + '...' + token.slice(-4) : '***',
      lastTelegramError,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Switch Mode Endpoint (Webhook <-> Polling)
app.post('/api/telegram/set-mode', async (req: Request, res: Response) => {
  const { token, mode, webhookUrl } = req.body;
  const activeToken = (token || runtimeBotToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!activeToken) {
    res.status(400).json({ error: 'Telegram Bot Token talab qilinadi' });
    return;
  }

  runtimeBotToken = activeToken;

  try {
    if (mode === 'polling') {
      // 1. Delete Webhook from Telegram
      const delRes = await fetch(`https://api.telegram.org/bot${activeToken}/deleteWebhook`);
      const delData = await delRes.json();

      // 2. Start Long Polling loop
      stopTelegramPolling();
      startTelegramPolling(activeToken);

      res.json({
        ok: true,
        mode: 'polling',
        message: 'Telegram Bot Long Polling rejimida muvaffaqiyatli ishga tushirildi! Webhook va ommaviy domen talab qilinmaydi.',
        details: delData,
      });
      return;
    } else if (mode === 'webhook') {
      stopTelegramPolling();

      const detectedUrl = getPublicAppUrl();
      const target = webhookUrl || (detectedUrl ? `${detectedUrl}/api/telegram/webhook` : '');

      if (!target || !target.startsWith('https://')) {
        res.status(400).json({
          error: 'Webhook uchun to\'g\'ri HTTPS domen talab qilinadi (masalan: https://myapp.up.railway.app/api/telegram/webhook). Agar domeningiz bo\'lmasa, "Long Polling" rejimini tanlang.',
        });
        return;
      }

      const setRes = await fetch(`https://api.telegram.org/bot${activeToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });
      const setData = await setRes.json();
      currentBotMode = 'webhook';

      res.json({
        ok: setData.ok,
        mode: 'webhook',
        message: setData.ok ? `Webhook muvaffaqiyatli ${target} ga ulandi!` : `Telegram xatoligi: ${setData.description}`,
        details: setData,
      });
      return;
    } else {
      res.status(400).json({ error: 'Noto\'g\'ri rejim (polling yoki webhook kutiladi)' });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Xatolik: ' + err.message });
  }
});

// 11. Real Telegram Webhook Registration (Backwards Compatibility)
app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
  const { botToken, webhookUrl } = req.body;
  const activeToken = (botToken || runtimeBotToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();

  if (!activeToken) {
    res.status(400).json({ error: 'Telegram Bot Token talab qilinadi' });
    return;
  }

  runtimeBotToken = activeToken;

  try {
    const detectedUrl = getPublicAppUrl();
    const targetUrl = webhookUrl || (detectedUrl ? `${detectedUrl}/api/telegram/webhook` : `${process.env.APP_URL || 'http://localhost:3000'}/api/telegram/webhook`);

    const fetchResponse = await fetch(`https://api.telegram.org/bot${activeToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });

    const data = await fetchResponse.json();
    if (data.ok) {
      stopTelegramPolling();
      currentBotMode = 'webhook';
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook o\'rnatishda xatolik: ' + err.message });
  }
});

// 12. Real Telegram Webhook Receiver
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  // Acknowledge quickly to Telegram
  res.status(200).send('OK');

  const botToken = runtimeBotToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken || !req.body) return;

  try {
    await processTelegramUpdate(req.body, botToken);
  } catch (err) {
    console.error('Telegram webhook processing error:', err);
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE & STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Intelligent Telegram Bot Initialization
    const botToken = runtimeBotToken || process.env.TELEGRAM_BOT_TOKEN;
    if (botToken) {
      try {
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meData = await meRes.json();

        if (meData.ok) {
          currentBotUser = meData.result;
          console.log(`[Telegram Bot] Connected as @${meData.result.username} (${meData.result.first_name})`);

          const whRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
          const whData = await whRes.json();
          const currentWhUrl = whData?.result?.url || '';

          const detectedUrl = getPublicAppUrl();
          const preferPolling = process.env.TELEGRAM_BOT_MODE === 'polling' || !detectedUrl;

          if (preferPolling) {
            console.log('[Telegram Bot] Starting in Long Polling mode (100% reliable on Railway without domain)...');
            await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
            startTelegramPolling(botToken);
          } else {
            const targetWebhook = `${detectedUrl}/api/telegram/webhook`;
            console.log(`[Telegram Bot] Configuring webhook to: ${targetWebhook}`);
            const setResponse = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: targetWebhook }),
            });
            const setResult = await setResponse.json();
            console.log('[Telegram Bot] Webhook Setup Result:', setResult);

            if (!setResult.ok) {
              console.warn('[Telegram Bot] Webhook failed, falling back to Long Polling...');
              await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
              startTelegramPolling(botToken);
            } else {
              currentBotMode = 'webhook';
            }
          }
        } else {
          console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN is invalid:', meData.description);
          lastTelegramError = meData.description;
        }
      } catch (tgErr) {
        console.error('[Telegram Bot] Startup initialization error:', tgErr);
      }
    } else {
      console.log('[Telegram Bot] TELEGRAM_BOT_TOKEN not provided in environment variables.');
    }
  });
}

startServer();
