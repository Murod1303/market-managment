import { Router, Request, Response } from 'express';
import { telegramService, processTelegramUpdate } from '../integrations/telegram/telegram.service.ts';
import { telegramClient } from '../integrations/telegram/telegram.client.ts';
import { getCleanTelegramBotToken, getPublicAppUrl } from '../config/env.ts';
import { userService } from '../services/user.service.ts';
import { productService } from '../services/product.service.ts';
import { formatSom } from '../utils/formatters.ts';

const router = Router();

// 1. In-App Telegram Chat Simulator
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { text = '', sessionToken, chatId = 'default-chat' } = req.body;
    const trimmed = text.trim();

    let currentAuthUser = sessionToken ? userService.verifyToken(sessionToken) : null;
    let currentToken = currentAuthUser ? sessionToken : null;

    if (!currentAuthUser) {
      const sess = userService.getTelegramSession(String(chatId));
      if (sess) {
        currentAuthUser = sess.user;
        currentToken = sess.token;
      }
    }

    // A. Handle /login [username] [password]
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

      const authResult = userService.authenticate(inputUser, inputPass);
      if (authResult) {
        const fullUser = userService.getById(authResult.user.id)!;
        userService.setTelegramSession(String(chatId), {
          user: fullUser,
          token: authResult.token,
          loginAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        res.json({
          reply: `✅ <b>Avtorizatsiyadan muvaffaqiyatli o'tdingiz!</b>\n\nXush kelibsiz, <b>${fullUser.name}</b>!\n🏷️ Lavozim: <i>${fullUser.roleTitle}</i>\n🛡️ Xavfsizlik: <b>To'liq ruxsat berildi</b>\n\nEndi bot orqali barcha amallar faol:\n• <code>/search [nomi]</code> — tovarlarni qidirish\n• <code>/statistika</code> — do'kon balansi va foyda\n• <code>/excel</code> — Excel (.xlsx) jadvali\n• <code>/logout</code> — tizimdan chiqish`,
          actionType: 'open_webapp',
          authToken: authResult.token,
          userRole: fullUser.roleTitle,
          user: authResult.user,
          isAuthenticated: true,
        });
        return;
      } else {
        res.json({
          reply: `❌ <b>Login yoki parol noto'g'ri!</b>\n\nIltimos, qaytadan tekshirib kiriting:\n👉 <code>/login [login] [parol]</code>`,
          actionType: 'login_required',
          isAuthenticated: false,
        });
        return;
      }
    }

    // B. Handle /logout
    if (trimmed === '/logout') {
      userService.clearTelegramSession(String(chatId));
      res.json({
        reply: `🔒 <b>Tizimdan muvaffaqiyatli chiqildi.</b>\n\nQayta kirish: <code>/login [login] [parol]</code>`,
        actionType: 'login_required',
        isAuthenticated: false,
      });
      return;
    }

    // C. Security Guard
    if (!currentAuthUser) {
      res.json({
        reply: `🔒 <b>SmartSavdo Xavfsizlik Tizimi:</b>\nDo'kon ma'lumotlarini ko'rish uchun avval avtorizatsiyadan o'ting:\n👉 <code>/login [login] [parol]</code>`,
        actionType: 'login_required',
        isAuthenticated: false,
      });
      return;
    }

    // D. Authenticated commands
    if (trimmed.startsWith('/search') || trimmed.startsWith('/tovar')) {
      const q = trimmed.replace(/^\/(search|tovar)\s*/i, '').trim();
      const results = productService.search(q);
      if (results.length === 0) {
        res.json({ reply: `"${q}" bo'yicha tovar topilmadi.`, isAuthenticated: true });
        return;
      }
      const card = results
        .slice(0, 3)
        .map((p) => `📦 <b>${p.name}</b> (${p.category})\nMiqdor: ${p.quantity} ${p.unit}\nTannarx: ${formatSom(p.unitCost)}\nSotish: ${formatSom(p.unitCost * (1 + p.markupPercent / 100))}`)
        .join('\n\n───────────────\n\n');
      res.json({ reply: `🔎 <b>Qidiruv natijalari:</b>\n\n${card}`, isAuthenticated: true });
      return;
    }

    if (trimmed === '/statistika' || trimmed === '/kpi') {
      const products = productService.getAll();
      const totalCost = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
      const totalRev = products.reduce((sum, p) => sum + p.quantity * (p.unitCost * (1 + p.markupPercent / 100)), 0);
      res.json({
        reply: `📊 <b>Do'kon Balansi:</b>\n💰 Tannarx: ${formatSom(totalCost)}\n📈 Tushum: ${formatSom(totalRev)}\n💎 Sof Foyda: ${formatSom(totalRev - totalCost)}\n📦 Tovar turlari: ${products.length} xil`,
        isAuthenticated: true,
      });
      return;
    }

    res.json({
      reply: `Siz yozdingiz: "${trimmed}"\n\n💡 Buyruqlar: /search, /statistika, /excel, /logout`,
      isAuthenticated: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Xatolik: ' + err.message });
  }
});

// 2. Status & Diagnostics
router.get('/status', (req: Request, res: Response) => {
  res.json(telegramService.getStatus());
});

// 3. Configure bot mode (polling / webhook)
router.post('/set-mode', async (req: Request, res: Response) => {
  const { token, mode } = req.body;
  const result = await telegramService.configure(token, mode);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json({ ok: true, mode, details: result.botUser });
});

// 4. Set Webhook
router.post('/set-webhook', async (req: Request, res: Response) => {
  const { botToken, webhookUrl } = req.body;
  const token = getCleanTelegramBotToken(botToken);
  if (!token) {
    res.status(400).json({ error: 'Token talab qilinadi' });
    return;
  }

  telegramClient.setToken(token);
  const target = webhookUrl || `${getPublicAppUrl() || 'http://localhost:3000'}/api/telegram/webhook`;
  const result = await telegramClient.setWebhook(target);
  res.json(result);
});

// 5. Telegram Webhook Receiver
router.post('/webhook', async (req: Request, res: Response) => {
  res.status(200).send('OK');
  const token = getCleanTelegramBotToken();
  if (!token || !req.body) return;

  try {
    await processTelegramUpdate(req.body, token);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

export default router;
