import { env, getCleanTelegramBotToken, getPublicAppUrl } from '../../config/env.ts';
import { telegramClient } from './telegram.client.ts';
import { getMainKeyboard, getMarkupSelectionKeyboard } from './telegram.keyboards.ts';
import { productService } from '../../services/product.service.ts';
import { userService, generateToken } from '../../services/user.service.ts';
import { scanReceiptImage } from '../gemini/gemini.client.ts';
import { formatSom, parseNewProductInput } from '../../utils/formatters.ts';
import { getSavedTelegramSession, saveTelegramSession } from '../../mongodb.ts';
import { Product } from '../../types/index.ts';

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

let pollingActive = false;
let pollingAbortController: AbortController | null = null;
let currentBotMode: 'webhook' | 'polling' | 'idle' = 'idle';
let currentBotUser: any = null;
let lastTelegramError: string | null = null;

function applyMarkupToProducts(
  items: any[],
  markupPercent: number,
  supplierName: string,
  dateStr?: string
): { addedProducts: Product[]; totalCost: number; totalRevenue: number; expectedProfit: number } {
  const percent = Math.max(0, Math.round(markupPercent));
  const addedProducts: Product[] = [];

  for (const item of items) {
    const prod = productService.create({
      name: item.name,
      category: item.category || 'Umumiy',
      quantity: item.quantity,
      unit: item.unit || 'dona',
      unitCost: item.unitCost,
      markupPercent: percent,
      date: dateStr || new Date().toISOString().split('T')[0],
      supplier: supplierName,
      notes: 'Rasm/chek orqali kiritildi',
    });
    addedProducts.push(prod);
  }

  const totalCost = addedProducts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const totalRevenue = addedProducts.reduce(
    (sum, p) => sum + p.quantity * Math.round(p.unitCost * (1 + p.markupPercent / 100)),
    0
  );
  const expectedProfit = totalRevenue - totalCost;

  return { addedProducts, totalCost, totalRevenue, expectedProfit };
}

export async function processTelegramUpdate(update: any, botToken: string): Promise<void> {
  if (!update || !botToken) return;
  telegramClient.setToken(botToken);

  // A. Handle inline keyboard callback queries
  if (update.callback_query) {
    const cb = update.callback_query;
    const cbChatId = cb.message?.chat?.id || cb.from?.id;
    const cbKey = String(cbChatId);
    const data = String(cb.data || '');

    if (data.startsWith('markup_')) {
      const percent = parseFloat(data.replace('markup_', '')) || 20;
      const pending = pendingMarkupSessions.get(cbKey);
      
      if (pending && pending.items.length > 0) {
        await telegramClient.answerCallbackQuery(cb.id, "Saqlanmoqda...");
        
        const supplierName = pending.userName ? `${pending.userName} (Telegram)` : (pending.supplier || 'Telegram Bot');
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

        await telegramClient.sendMessage(
          cbChatId,
          `✅ <b>Tovarlar muvaffaqiyatli saqlandi!</b>\n\n` +
            `📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n` +
            `💰 Jami partiya tannarxi: <b>${formatSom(totalCost)}</b>\n` +
            `📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n` +
            `💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n\n` +
            `💡 <i>Tovarlar do'kon bazasiga kiritildi va saytda aks etadi!</i>`,
          { reply_markup: getMainKeyboard(true) }
        );
        
        // Remove the inline keyboard from the original message if possible
        if (cb.message?.message_id) {
          telegramClient.editMessageReplyMarkup(cbChatId, cb.message.message_id, { inline_keyboard: [] }).catch(() => {});
        }
        
        return;
      } else {
        await telegramClient.answerCallbackQuery(cb.id, "Allaqachon saqlangan yoki topilmadi");
        return;
      }
    }
    
    await telegramClient.answerCallbackQuery(cb.id);
    return;
  }

  // B. Handle regular messages
  const message = update?.message;
  if (!message) return;

  const chatId = message.chat?.id;
  if (!chatId) return;

  const chatKey = String(chatId);
  let session = userService.getTelegramSession(chatKey);

  // Check saved persistent session from MongoDB if not in memory
  if (!session) {
    try {
      const saved = await getSavedTelegramSession(chatKey);
      if (saved) {
        const matched = userService.getById(saved.userId) || userService.getByUsername(saved.username);
        if (matched) {
          session = {
            user: matched,
            token: saved.token,
            loginAt: saved.loginAt,
          };
          userService.setTelegramSession(chatKey, session);
        }
      }
    } catch {
      // ignore
    }
  }

  // C. Photo upload handling
  if (message.photo && message.photo.length > 0) {
    if (!session) {
      await telegramClient.sendMessage(
        chatId,
        `🔒 <b>Ruxsat etilmadi!</b>\nChek yoki tovar rasmini yuklashdan oldin tizimga kiring:\n👉 <code>/login [login] [parol]</code>\n\nMisol: /login Admin123 Admin7778`,
        { reply_markup: getMainKeyboard(false) }
      );
      return;
    }

    try {
      const photo = message.photo[message.photo.length - 1];
      const fileJson = await telegramClient.getFile(photo.file_id);
      const filePath = fileJson?.result?.file_path;

      let base64 = '';
      if (filePath) {
        const downloaded = await telegramClient.downloadFileAsBase64(filePath);
        if (downloaded) base64 = downloaded;
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

      await telegramClient.sendMessage(
        chatId,
        `🧾 <b>Tovar / hisob-faktura rasmi qabul qilindi!</b>\n\n` +
          `🏢 Ta'minotchi: <i>${scanResult.supplier || "Noma'lum"}</i>\n` +
          `📅 Sana: <i>${scanResult.date || 'Bugun'}</i>\n\n` +
          `<b>Aniqlangan tovarlar:</b>\n${itemsSummary}\n\n` +
          `❓ <b>Ushbu tovarlar ustiga necha foiz ustama qo'ymoqchisiz?</b>\n` +
          `Quyidagi tugmalardan birini tanlang yoki o'z foizingizni yozing (masalan: <code>25</code> yoki <code>30%</code>):`,
        { reply_markup: getMarkupSelectionKeyboard() }
      );
      return;
    } catch (photoErr) {
      console.error('Photo processing error in telegram bot:', photoErr);
      await telegramClient.sendMessage(
        chatId,
        `⚠️ Rasmni o'qishda xatolik yuz berdi. Iltimos qaytadan yuboring yoki /new buyrug'idan foydalaning.`
      );
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
    const authResult = u && p ? userService.authenticate(u, p) : null;

    if (authResult) {
      const fullUser = userService.getById(authResult.user.id)!;
      session = {
        user: fullUser,
        token: authResult.token,
        loginAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      userService.setTelegramSession(chatKey, session);

      saveTelegramSession({
        chatId: chatKey,
        userId: fullUser.id,
        username: fullUser.username,
        token: authResult.token,
        loginAt: session.loginAt,
        updatedAt: new Date().toISOString(),
      }).catch((err) => console.error('Error saving telegram session:', err));

      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `✅ <b>Avtorizatsiya muvaffaqiyatli!</b>\n\nXush kelibsiz, <b>${fullUser.name}</b> (${fullUser.roleTitle})!\n\n📱 <b>SmartSavdo WebApp:</b>\n<a href="${appUrl}?auth_token=${authResult.token}">Do'kon WebApp Ilovasini Ochish</a>\n\nEndi buyruqlar faol:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama]\n📸 Chek yoki tovar rasmini yuboring\n🔎 /search [nomi]\n📊 /statistika\n📑 /excel\n🔒 /logout`;
    } else {
      responseText = `❌ <b>Login yoki parol noto'g'ri!</b>\nQaytadan kiriting: /login [login] [parol]\nMasalan: /login Admin123 Admin7778`;
    }
  } else if (text === '/logout' || text === '🔒 Chiqish') {
    if (session) {
      userService.clearTelegramSession(chatKey);
      pendingMarkupSessions.delete(chatKey);
    }
    responseText = `🔒 <b>Tizimdan chiqildi.</b>\nQayta kirish: /login [login] [parol]`;
  } else if (!session) {
    responseText = `🔒 <b>SmartSavdo Xavfsizlik Tizimi:</b>\nDo'kon ma'lumotlarini ko'rish uchun avval avtorizatsiyadan o'ting:\n\n👉 <code>/login [login] [parol]</code>\n\nHisoblar:\n• <code>/login Admin123 Admin7778</code> (Admin)\n• <code>/login kassir123 kassir7877</code> (Kassir)`;
  } else {
    // Check if user is replying with a markup percentage for pending photo
    const isMarkupInput =
      /^(\+?\s*\d{1,3}\s*%?|ustama\s*\d{1,3}\s*%?)$/i.test(text) ||
      (!isNaN(parseFloat(text.replace(/[+%\s]/g, ''))) &&
        parseFloat(text.replace(/[+%\s]/g, '')) <= 500 &&
        !text.startsWith('/'));
    const pending = pendingMarkupSessions.get(chatKey);

    if (isMarkupInput && pending && pending.items.length > 0) {
      const percent = parseFloat(text.replace(/[^\d.]/g, '')) || 20;
      const supplierName = pending.userName ? `${pending.userName} (Telegram)` : (pending.supplier || 'Telegram Bot');
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

      responseText =
        `✅ <b>Tovarlar muvaffaqiyatli saqlandi!</b>\n\n` +
        `📦 <b>${addedProducts.length} ta tovar</b> +${percent}% ustama bilan bazaga kiritildi:\n\n${itemsList}\n\n` +
        `💰 Jami partiya tannarxi: <b>${formatSom(totalCost)}</b>\n` +
        `📈 Kutilayotgan tushum: <b>${formatSom(totalRevenue)}</b>\n` +
        `💎 Kutilayotgan sof foyda: <b>+${formatSom(expectedProfit)}</b>\n\n` +
        `💡 <i>Tovarlar do'kon bazasiga kiritildi va saytda aks etadi!</i>`;
    } else if (text.startsWith('/start')) {
      responseText = `Assalomu alaykum, <b>${session.user.name}</b>!\nSmartSavdo do'kon botiga xush kelibsiz!\n\nBuyruqlar:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama] - yangi tovar qo'shish\n📸 Chek yoki tovar rasmini yuboring - AI avtomat taniydi\n🔎 /search [nomi] - tovar qidirish\n📊 /statistika - kassa va sof foyda\n📑 /excel - Excel hisobot\n📱 /webapp - WebApp ilovasini ochish\n🔒 /logout - chiqish`;
    } else if (text.startsWith('/new') || text.startsWith('/yangi') || text.startsWith('➕ Yangi tovar')) {
      const param = text.replace(/^(\/(new|yangi)|➕ Yangi tovar(?:\s*\(\/new\))?)\s*/i, '').trim();
      const parsed = parseNewProductInput(param);

      if (!parsed.success) {
        if (parsed.error === 'empty') {
          responseText = `➕ <b>Yangi tovar qo'shish (/new buyrug'i)</b>\n\nFormat:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\n📌 <b>Misollar:</b>\n• <code>/new Olma 50 kg 12000 25</code>\n• <code>/new Shakar 100 kg 9500 20</code>\n• <code>/new Coca-Cola 1.5L 24 dona 14000 15</code>\n• <code>/new O'simlik yog'i 30 litr 16500 20</code>\n\n💡 <i>Ustama foizini yozmasangiz, avtomatik 20% hisoblanadi. Vergul bilan ham yozishingiz mumkin:\n<code>/new Non, 100 dona, 3500, 15%</code>\n\nYoki to'g'ridan-to'g'ri chek/tovar rasmini yuboring!</i>`;
        } else {
          responseText = `⚠️ <b>Tovar ma'lumotlari to'liq kiritilmadi.</b>\n\nIltimos, quyidagi tartibda yozing:\n<code>/new [Nomi] [Miqdori] [Birligi] [Tannarxi] [Ustama%]</code>\n\nMisol:\n<code>/new Olma 50 kg 12000 25</code>\nyoki\n<code>/new Non, 100 dona, 3500 so'm, 15%</code>`;
        }
      } else {
        const it = parsed.item!;
        const newProduct = productService.create({
          name: it.name,
          category: it.category,
          quantity: it.quantity,
          unit: it.unit,
          unitCost: it.unitCost,
          markupPercent: it.markupPercent,
          date: new Date().toISOString().split('T')[0],
          supplier: session ? `${session.user.name} (Telegram)` : 'Telegram Bot orqali',
          notes: "Telegram /new buyrug'i orqali kiritildi",
        });

        const unitPrice = Math.round(newProduct.unitCost * (1 + newProduct.markupPercent / 100));
        const totalCost = newProduct.quantity * newProduct.unitCost;
        const totalRevenue = newProduct.quantity * unitPrice;
        const expectedProfit = totalRevenue - totalCost;

        responseText =
          `✅ <b>Yangi tovar muvaffaqiyatli qo'shildi!</b>\n\n` +
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
    } else if (text.startsWith('/search') || text.startsWith('🔎')) {
      const q = text.replace(/^(\/search|🔎)\s*/i, '').trim().toLowerCase();
      const match = productService.search(q)[0];
      if (match) {
        responseText = `📦 <b>${match.name}</b> (${match.category})\nMiqdor: ${match.quantity} ${match.unit}\nTannarx: ${formatSom(match.unitCost)}\nSotish narxi: ${formatSom(match.unitCost * (1 + match.markupPercent / 100))}\nUstama: +${match.markupPercent}%\nTa'minotchi: ${match.supplier}`;
      } else {
        responseText = `"${q}" bo'yicha tovar topilmadi.`;
      }
    } else if (text.startsWith('/statistika') || text.startsWith('📊')) {
      const products = productService.getAll();
      const totalCost = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
      const totalRev = products.reduce((sum, p) => sum + p.quantity * (p.unitCost * (1 + p.markupPercent / 100)), 0);
      responseText = `📊 <b>Do'kon Balansi:</b>\n💰 Tannarx: ${formatSom(totalCost)}\n📈 Tushum: ${formatSom(totalRev)}\n💎 Sof Foyda: ${formatSom(totalRev - totalCost)}\n📦 Tovar turlari: ${products.length} xil`;
    } else if (text.startsWith('/webapp') || text.startsWith('📱')) {
      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `📱 <b>SmartSavdo WebApp:</b>\n\nQuyidagi havola orqali do'koningizni to'liq boshqaring:\n<a href="${appUrl}?auth_token=${session.token}">👉 SmartSavdo WebApp Ilovasini Ochish</a>`;
    } else if (text.startsWith('/excel') || text.startsWith('📑')) {
      const appUrl = getPublicAppUrl() || 'https://aistudio.google.com';
      responseText = `📑 <b>Do'kon tovarlari Excel hisoboti:</b>\n\nJami tovarlar soni: ${productService.count()} xil.\nExcel va PDF fayllarni to'liq yuklab olish uchun WebApp ilovasiga kiring:\n<a href="${appUrl}">SmartSavdo Tizimi</a>`;
    } else if (text === '📦 Tovarlar') {
      const products = productService.getAll().slice(0, 5);
      const list = products
        .map((p, i) => `${i + 1}. <b>${p.name}</b>: ${p.quantity} ${p.unit} - ${formatSom(p.unitCost * (1 + p.markupPercent / 100))}`)
        .join('\n');
      responseText = `📦 <b>Tovarlar ro'yxati (so'nggi 5 ta):</b>\n\n${list}\n\nJami tovarlar: ${productService.count()} ta. Batafsil ko'rish uchun WebApp ilovasiga kiring.`;
    } else if (text === '💰 Kassa') {
      const products = productService.getAll();
      const totalRev = products.reduce((sum, p) => sum + p.quantity * (p.unitCost * (1 + p.markupPercent / 100)), 0);
      responseText = `💰 <b>Do'kon Kassasi:</b>\n\nJami tovarlar narxi: <b>${formatSom(totalRev)}</b>\nKassa hisob-kitobini WebApp orqali to'liq yuritishingiz mumkin.`;
    } else {
      responseText = `Xush kelibsiz! Buyruqlar:\n➕ /new [nomi] [miqdor] [birlik] [tannarx] [ustama]\n📸 Chek rasmini yuboring\n🔎 /search [tovar]\n📊 /statistika\n📱 /webapp\n🔒 /logout`;
    }
  }

  await telegramClient.sendMessage(chatId, responseText, {
    reply_markup: getMainKeyboard(!!session),
  });
}

export const telegramService = {
  async init(): Promise<void> {
    const token = getCleanTelegramBotToken();
    if (!token) {
      console.log('[Telegram Bot] TELEGRAM_BOT_TOKEN kiritilmagan.');
      return;
    }

    telegramClient.setToken(token);

    try {
      const meData = await telegramClient.getMe();
      if (meData.ok) {
        currentBotUser = meData.result;
        console.log(`[Telegram Bot] Connected as @${meData.result.username} (${meData.result.first_name})`);

        const detectedUrl = getPublicAppUrl();
        const explicitWebhook = env.TELEGRAM_BOT_MODE === 'webhook' && !!detectedUrl;

        if (!explicitWebhook) {
          console.log('[Telegram Bot] Starting in Long Polling mode...');
          await telegramClient.deleteWebhook();
          this.startPolling(token);
        } else {
          const targetWebhook = `${detectedUrl}/api/telegram/webhook`;
          console.log(`[Telegram Bot] Configuring webhook to: ${targetWebhook}`);
          const setResult = await telegramClient.setWebhook(targetWebhook);
          if (!setResult.ok) {
            console.warn('[Telegram Bot] Webhook failed, falling back to Polling...');
            await telegramClient.deleteWebhook();
            this.startPolling(token);
          } else {
            currentBotMode = 'webhook';
          }
        }
      } else {
        lastTelegramError = meData.description;
        console.warn('[Telegram Bot] Token invalid:', meData.description);
      }
    } catch (err: any) {
      lastTelegramError = err.message || 'Connection error';
      console.warn('[Telegram Bot] Startup notice:', err.message || err);
    }
  },

  async startPolling(token: string): Promise<void> {
    const cleanToken = getCleanTelegramBotToken(token);
    if (!cleanToken) return;

    if (pollingActive) return;
    pollingActive = true;
    currentBotMode = 'polling';
    pollingAbortController = new AbortController();

    let offset = 0;
    let consecutiveNetworkErrors = 0;

    while (pollingActive) {
      let timeoutId: NodeJS.Timeout | null = null;
      let reqController: AbortController | null = null;

      try {
        reqController = new AbortController();
        const currentReq = reqController;

        timeoutId = setTimeout(() => {
          try {
            currentReq.abort();
          } catch {}
        }, 30000);

        const data = await telegramClient.getUpdates(offset, 15, currentReq.signal);

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (data.ok && Array.isArray(data.result)) {
          consecutiveNetworkErrors = 0;
          for (const update of data.result) {
            offset = update.update_id + 1;
            await processTelegramUpdate(update, cleanToken).catch((err) => {
              console.warn('[Telegram Update Notice]:', err?.message || err);
            });
          }
        } else if (!data.ok) {
          console.warn('[Telegram Polling Notice]:', data.description);
          if (data.description && data.description.includes('webhook is active')) {
            await telegramClient.deleteWebhook();
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (err: any) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (err.name === 'AbortError') {
          if (!pollingActive) break;
          continue;
        }

        consecutiveNetworkErrors++;
        const delay = Math.min(20000, 2000 * Math.pow(1.5, Math.min(consecutiveNetworkErrors, 5)));
        console.log(`[Telegram Bot Polling] Aloqa qayta tiklanmoqda: ${err.message || 'tarmoq uzilishi'}`);
        lastTelegramError = `Qayta ulanish (${err.message || 'tarmoq'})`;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    pollingActive = false;
    if (currentBotMode === 'polling') {
      currentBotMode = 'idle';
    }
  },

  stopPolling(): void {
    pollingActive = false;
    if (pollingAbortController) {
      try {
        pollingAbortController.abort();
      } catch {}
      pollingAbortController = null;
    }
  },

  getStatus() {
    const token = getCleanTelegramBotToken();
    return {
      configured: !!token,
      mode: currentBotMode,
      pollingActive,
      botUser: currentBotUser,
      lastError: lastTelegramError,
      maskedToken: token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : null,
      appUrl: getPublicAppUrl() || null,
    };
  },

  async configure(token: string, mode: 'polling' | 'webhook'): Promise<{ success: boolean; botUser?: any; error?: string }> {
    const cleanToken = getCleanTelegramBotToken(token);
    if (!cleanToken) {
      return { success: false, error: 'Token kiritilmadi' };
    }

    this.stopPolling();
    telegramClient.setToken(cleanToken);

    try {
      const meData = await telegramClient.getMe();
      if (!meData.ok) {
        return { success: false, error: meData.description || 'Token yaroqsiz' };
      }

      currentBotUser = meData.result;

      if (mode === 'polling') {
        await telegramClient.deleteWebhook();
        this.startPolling(cleanToken);
        return { success: true, botUser: currentBotUser };
      } else {
        const publicUrl = getPublicAppUrl();
        if (!publicUrl) {
          await telegramClient.deleteWebhook();
          this.startPolling(cleanToken);
          return { success: true, botUser: currentBotUser };
        }

        const targetWebhook = `${publicUrl}/api/telegram/webhook`;
        const setResult = await telegramClient.setWebhook(targetWebhook);
        if (setResult.ok) {
          currentBotMode = 'webhook';
          return { success: true, botUser: currentBotUser };
        } else {
          await telegramClient.deleteWebhook();
          this.startPolling(cleanToken);
          return { success: true, botUser: currentBotUser };
        }
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Xatolik yuz berdi' };
    }
  },
};
