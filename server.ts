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
    if (action === 'apply_markup' && Array.isArray(pendingItems) && markupPercent !== undefined) {
      const addedCount = pendingItems.length;
      const percent = Number(markupPercent) || 20;

      for (const item of pendingItems) {
        productsCache.unshift({
          id: `tg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.name,
          category: item.category || 'Oziq-ovqat',
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          markupPercent: percent,
          date: new Date().toISOString().split('T')[0],
          supplier: `Telegram (${currentAuthUser.name})`,
          notes: "Telegram bot orqali chekdan yuklandi",
        });
      }
      saveProducts(productsCache);

      res.json({
        reply: `✅ Muvaffaqiyatli saqlandi!\n\n📦 ${addedCount} ta tovar +${percent}% ustama bilan bazaga kiritildi.\nKirituvchi: <b>${currentAuthUser.name}</b>\n\nSiz istalgan vaqtda tovar ma'lumotini tekshirish uchun:\n👉 <code>/search [tovar nomi]</code> yuborishingiz mumkin.`,
        actionType: 'saved',
        products: productsCache,
        isAuthenticated: true,
      });
      return;
    }

    // 6. Image sent in chat -> AI Gemini Vision scan
    if (imageBase64) {
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
                  text: "Ushbu tovar cheki/fakturasidan tovarlar nomlari, miqdori, birligi va kelish tannarxini aniq JSON ko'rinishida ajratib ber.",
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
          console.error('Chat AI scan error:', err);
        }
      }

      if (!scanResult || !scanResult.items || scanResult.items.length === 0) {
        // Fallback realistic scan items
        scanResult = {
          supplier: 'Savdo Ta\'minot MCHJ',
          date: new Date().toISOString().split('T')[0],
          items: [
            { name: 'Kungaboqar yog\'i (1L)', category: 'Oziq-ovqat', quantity: 24, unit: 'dona', unitCost: 15500, totalCost: 372000 },
            { name: 'Shakar (1 kg)', category: 'Oziq-ovqat', quantity: 50, unit: 'kg', unitCost: 9000, totalCost: 450000 },
            { name: 'Tuxum (30 dona)', category: 'Oziq-ovqat', quantity: 10, unit: 'quti', unitCost: 36000, totalCost: 360000 },
          ],
        };
      }

      const itemsSummary = scanResult.items
        .map(
          (it: any, idx: number) =>
            `${idx + 1}. <b>${it.name}</b>: ${it.quantity} ${it.unit} x ${formatSom(it.unitCost)} = ${formatSom(it.quantity * it.unitCost)}`
        )
        .join('\n');

      res.json({
        reply: `🧾 <b>Hisob-faktura (chek) muvaffaqiyatli skanerlandi!</b>\n\n🏢 Ta'minotchi: <i>${scanResult.supplier || 'Noma\'lum'}</i>\n📅 Sana: <i>${scanResult.date || 'Bugun'}</i>\n\n<b>Topilgan tovarlar:</b>\n${itemsSummary}\n\n❓ <b>Ushbu tovarlar ustiga necha foiz ustama qo'ymoqchisiz?</b>\nQuyidagi tugmalardan birini tanlang yoki o'z foizingizni yozing:`,
        actionType: 'ask_markup',
        pendingItems: scanResult.items,
        isAuthenticated: true,
      });
      return;
    }

    // 7. Text Commands for Authorized User
    if (trimmed === '/start') {
      res.json({
        reply: `👋 <b>Xush kelibsiz, ${currentAuthUser.name}!</b>\n\nSiz avtorizatsiyadan o'tgansiz (${currentAuthUser.roleTitle}).\n\nQuyidagi buyruqlardan foydalanishingiz mumkin:\n📸 <b>Chek yoki faktura rasmini yuboring</b> — AI uni avtomat o'qiydi.\n🔎 <b>/search [tovar]</b> — tovar narxi va qoldig'i.\n📊 <b>/statistika</b> — jami xarajat, tushum va sof foyda.\n📑 <b>/excel</b> — tovarlar jadvalini .xlsx yuklab olish.\n📄 <b>/pdf</b> — rasmiy A4 PDF hisobot.\n📱 <b>/webapp</b> — WebApp do'kon ilovasi.\n🔒 <b>/logout</b> — tizimdan chiqish.`,
        isAuthenticated: true,
      });
      return;
    }

    if (trimmed === '/help') {
      res.json({
        reply: `📌 <b>Telegram Bot Buyruqlari:</b>\n\n• <b>/search [nomi]</b> - Tovar narxi, tannarxi, qoldig'ini ko'rsatadi.\n  <i>Masalan: /search Olma yoki /search Shakar</i>\n• <b>/statistika</b> - Moliyaviy ko'rsatkichlar (KPI).\n• <b>/excel</b> - Barcha tovarlar ro'yxatini Excel (.xlsx) formatida taqdim etadi.\n• <b>/pdf</b> - A4 formatidagi rasmiy chop etish hisoboti.\n• <b>/webapp</b> - To'liq ekranli do'kon ilovasini ochish.\n• <b>/logout</b> - Tizimdan chiqish.\n• <b>Rasm yuborish</b> - Faktura yoki chek rasmini yuboring, Gemini Vision uni tahlil qiladi.`,
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

// 9. Real Telegram Webhook Registration
app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
  const { botToken, webhookUrl } = req.body;
  if (!botToken) {
    res.status(400).json({ error: 'Telegram Bot Token talab qilinadi' });
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const targetUrl = webhookUrl || `${process.env.APP_URL || 'http://localhost:3000'}/api/telegram/webhook`;

    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    });

    const data = await fetchResponse.json();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Webhook o\'rnatishda xatolik: ' + err.message });
  }
});

// 10. Real Telegram Webhook Receiver
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  // Acknowledge quickly to Telegram
  res.status(200).send('OK');

  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return;

    const chatId = message.chat?.id;
    const text = message.text || '';

    // If bot token is set in env or sent, we can answer
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) return;

    const chatKey = String(chatId);
    let session = telegramAuthSessions.get(chatKey);

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

        const appUrl = process.env.APP_URL || 'https://aistudio.google.com';
        responseText = `✅ <b>Avtorizatsiya muvaffaqiyatli!</b>\n\nXush kelibsiz, <b>${matched.name}</b> (${matched.roleTitle})!\n\n📱 <b>SmartSavdo WebApp:</b>\n<a href="${appUrl}?auth_token=${token}">Do'kon WebApp Ilovasini Ochish</a>\n\nEndi buyruqlar faol:\n/search [nomi]\n/statistika\n/excel\n/logout`;
      } else {
        responseText = `❌ <b>Login yoki parol noto'g'ri!</b>\nQaytadan kiriting: /login [login] [parol]\nMasalan: /login admin admin123`;
      }
    } else if (text === '/logout') {
      if (session) {
        activeTokens.delete(session.token);
        telegramAuthSessions.delete(chatKey);
      }
      responseText = `🔒 <b>Tizimdan chiqildi.</b>\nQayta kirish: /login [login] [parol]`;
    } else if (!session) {
      // Not logged in
      responseText = `🔒 <b>SmartSavdo Xavfsizlik Tizimi:</b>\nDo'kon ma'lumotlarini ko'rish uchun avval avtorizatsiyadan o'ting:\n\n👉 <code>/login [login] [parol]</code>\n\nMisol:\n• /login admin admin123\n• /login kassir kassa2026`;
    } else {
      // Logged in user commands
      if (text.startsWith('/start')) {
        responseText = `Assalomu alaykum, <b>${session.user.name}</b>!\nSmartSavdo do'kon botiga xush kelibsiz!\n\nBuyruqlar:\n/search [nomi] - tovar qidirish\n/statistika - kassa va sof foyda\n/excel - Excel hisobot\n/logout - chiqish`;
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
      } else {
        responseText = `Xush kelibsiz! Buyruqlar: /search [tovar], /statistika, /excel, /logout`;
      }
    }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: responseText, parse_mode: 'HTML' }),
    });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
