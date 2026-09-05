import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Image as ImageIcon,
  Paperclip,
  CheckCheck,
  Bot,
  User,
  Sparkles,
  Download,
  Percent,
  Settings,
  Globe,
  HelpCircle,
  ExternalLink,
  Lock,
  ShieldCheck,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { Product, TelegramMessage, AuthUser } from '../types';
import { exportProductsToExcel } from '../utils/excelManager';
import { generateStorePdfReport } from '../utils/pdfGenerator';
import { formatSom } from '../utils/formatters';

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdated: () => void;
  onOpenWebAppWithAuth?: (token: string, user?: any) => void;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductsUpdated,
  onOpenWebAppWithAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'setup'>('chat');
  const [botSessionToken, setBotSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('smartsavdo_auth_token') || null;
  });
  const [botUser, setBotUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem('smartsavdo_auth_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: botSessionToken
        ? "👋 <b>Assalomu alaykum!</b>\nMen do'kon tovarlari va hisob-kitoblar botiman.\n\n🛡️ <b>Siz avtorizatsiyadan o'tgansiz</b>.\n\nTezkor buyruqlar:\n• <code>/search [nomi]</code> — tovar narxi va qoldig'i\n• <code>/statistika</code> — kassa va sof foyda\n• <code>/excel</code> — Excel jadvali\n• <code>/pdf</code> — A4 hisobot\n• <code>/webapp</code> — WebApp do'kon ilovasini ochish\n• 📸 Chek rasmini yuborish — AI tahlil"
        : "👋 <b>Assalomu alaykum!</b>\nMen <b>SmartSavdo</b> do'kon boshqaruv botiman.\n\n🔒 <b>Xavfsizlik talabi:</b> Ma'lumotlarni ko'rish va amallarni bajarish uchun avval tizimga kiring:\n👉 <code>/login [login] [parol]</code>\n\nMisol:\n• <code>/login admin admin123</code> (Boshqaruvchi)\n• <code>/login kassir kassa2026</code> (Kassir)",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionType: botSessionToken ? undefined : 'login_required',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [pendingMarkupItems, setPendingMarkupItems] = useState<any[] | null>(null);

  // Webhook setup states
  const [botToken, setBotToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/telegram/webhook`);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  if (!isOpen) return null;

  // Send message to server simulator
  const handleSendMessage = async (customText?: string, imageBase64?: string) => {
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() && !imageBase64) return;

    const userMsg: TelegramMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      image: imageBase64,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsBotTyping(true);

    try {
      const res = await fetch('/api/telegram/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          imageBase64,
          sessionToken: botSessionToken,
          chatId: 'simulator-user',
        }),
      });

      const data = await res.json();
      setIsBotTyping(false);

      if (data.reply) {
        // If login successful
        if (data.authToken && data.user) {
          setBotSessionToken(data.authToken);
          setBotUser(data.user);
          localStorage.setItem('smartsavdo_auth_token', data.authToken);
          localStorage.setItem('smartsavdo_auth_user', JSON.stringify(data.user));
        }

        // If logout
        if (textToSend.trim() === '/logout') {
          setBotSessionToken(null);
          setBotUser(null);
        }

        const botMsg: TelegramMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: data.actionType,
          pendingItems: data.pendingItems,
          productData: data.productData,
          authToken: data.authToken || botSessionToken || undefined,
          userRole: data.userRole || botUser?.roleTitle,
        };

        if (data.actionType === 'ask_markup' && data.pendingItems) {
          setPendingMarkupItems(data.pendingItems);
        }

        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      setIsBotTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: "⚠️ Xatolik yuz berdi: " + err.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Handle Markup Confirmation from Inline buttons in chat
  const handleSelectMarkup = async (percent: number) => {
    if (!pendingMarkupItems) return;

    setIsBotTyping(true);
    try {
      const res = await fetch('/api/telegram/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_markup',
          pendingItems: pendingMarkupItems,
          markupPercent: percent,
          sessionToken: botSessionToken,
          chatId: 'simulator-user',
        }),
      });

      const data = await res.json();
      setIsBotTyping(false);
      setPendingMarkupItems(null);

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }

      onProductsUpdated();
    } catch (err: any) {
      setIsBotTyping(false);
      console.error(err);
    }
  };

  // Attach Image from chat
  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSendMessage('📷 Chek / hisob-faktura rasmi yuborildi', base64);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Set real webhook
  const handleSetRealWebhook = async () => {
    if (!botToken.trim()) {
      setWebhookStatus('⚠️ Iltimos, Telegram Bot tokeningizni kiriting');
      return;
    }

    setIsSettingWebhook(true);
    setWebhookStatus(null);

    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: botToken.trim(), webhookUrl: webhookUrl.trim() }),
      });

      const data = await res.json();
      if (data.ok) {
        setWebhookStatus(`✅ Webhook muvaffaqiyatli ulandi! Telegram botingiz faollashdi.`);
      } else {
        setWebhookStatus(`❌ Telegram xatoligi: ${data.description || 'Noma\'lum xatolik'}`);
      }
    } catch (err: any) {
      setWebhookStatus(`❌ Xatolik: ${err.message}`);
    } finally {
      setIsSettingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-telegram-simulator"
        className="bg-slate-900 rounded-2xl max-w-lg w-full h-[85vh] max-h-[720px] shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-scale-up text-slate-100"
      >
        {/* Telegram Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center font-bold text-lg text-sky-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base leading-tight text-slate-100 truncate">
                  SmartSavdo Bot
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                {botSessionToken ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1 truncate">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{botUser?.name || 'Admin'} (Avtorizatsiyalangan)</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Kirilmagan</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {botSessionToken && (
              <button
                onClick={() => handleSendMessage('/logout')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold mr-1 transition"
                title="Bot sessiyasidan chiqish"
              >
                <LogOut className="w-3 h-3" />
                <span>Chiqish</span>
              </button>
            )}

            {/* Tab switch */}
            <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-xl flex items-center text-xs mr-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'chat' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  activeTab === 'setup' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                API Token
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Live Chat Simulator */}
        {activeTab === 'chat' ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/60">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                        isBot
                          ? 'bg-slate-900 text-slate-100 rounded-tl-xs border border-slate-800 shadow-xs'
                          : 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {/* Attached Image if any */}
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-800 max-h-48">
                          <img
                            src={msg.image}
                            alt="Chek"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}

                      {/* Text HTML rendering for bold/code */}
                      <div
                        dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
                        className="space-y-1 font-sans"
                      />

                      {/* Action: Inline Markup Selection Buttons */}
                      {msg.actionType === 'ask_markup' && pendingMarkupItems && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5">
                          {[15, 20, 25, 30].map((p) => (
                            <button
                              key={p}
                              onClick={() => handleSelectMarkup(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                            >
                              +{p}% ustama
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action: Excel Download Button */}
                      {msg.actionType === 'excel_file' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800">
                          <button
                            onClick={() =>
                              exportProductsToExcel(
                                products,
                                `telegram_tovarlar_${new Date().toISOString().split('T')[0]}.xlsx`
                              )
                            }
                            className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                          >
                            <Download className="w-4 h-4" />
                            <span>tovarlar_va_hisob_kitob.xlsx yuklash</span>
                          </button>
                        </div>
                      )}

                      {/* Action: Open WebApp Button */}
                      {msg.actionType === 'open_webapp' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800">
                          <button
                            onClick={() => {
                              if (onOpenWebAppWithAuth && msg.authToken) {
                                onOpenWebAppWithAuth(msg.authToken, msg.userRole);
                                onClose();
                              } else {
                                onClose();
                              }
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/25 cursor-pointer"
                          >
                            <Smartphone className="w-4 h-4" />
                            <span>🚀 SmartSavdo WebApp Ilovasini Ochish</span>
                          </button>
                        </div>
                      )}

                      {/* Action: Login Required Prompt Buttons */}
                      {msg.actionType === 'login_required' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleSendMessage('/login admin admin123')}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold text-left sm:text-center transition"
                          >
                            👑 Admin (/login admin admin123)
                          </button>
                          <button
                            onClick={() => handleSendMessage('/login kassir kassa2026')}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold text-left sm:text-center transition"
                          >
                            👤 Kassir (/login kassir kassa2026)
                          </button>
                        </div>
                      )}

                      {/* Action: PDF Download Button */}
                      {msg.actionType === 'pdf_file' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800">
                          <button
                            onClick={() => {
                              const doc = generateStorePdfReport(products);
                              doc.save('dokon_hisobot_telegram.pdf');
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
                          >
                            <Download className="w-4 h-4" />
                            <span>dokon_hisobot_A4.pdf yuklash</span>
                          </button>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                        <span>{msg.timestamp}</span>
                        {!isBot && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isBotTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  <span>SmartSavdo bot yozmoqda...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Command Chips */}
            <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(botSessionToken
                ? [
                    { label: '📱 /webapp', cmd: '/webapp' },
                    { label: '📊 /statistika', cmd: '/statistika' },
                    { label: '🔎 /search Olma', cmd: '/search Olma' },
                    { label: '🔎 /search Shakar', cmd: '/search Shakar' },
                    { label: '📥 /excel', cmd: '/excel' },
                    { label: '📄 /pdf', cmd: '/pdf' },
                    { label: '🔒 /logout', cmd: '/logout' },
                  ]
                : [
                    { label: '👑 /login admin', cmd: '/login admin admin123' },
                    { label: '👤 /login kassir', cmd: '/login kassir kassa2026' },
                    { label: 'ℹ️ /help', cmd: '/help' },
                    { label: '👋 /start', cmd: '/start' },
                  ]
              ).map((chip) => (
                <button
                  key={chip.cmd}
                  onClick={() => handleSendMessage(chip.cmd)}
                  className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-emerald-400 text-xs font-mono shrink-0 transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAttachImage}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition"
                title="Chek rasmini yuklash"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder="Xabar yozing yoki /search..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-30 transition shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Tab 2: Real BotFather Token & Webhook Setup */
          <div className="flex-1 p-6 bg-slate-950/60 text-slate-200 overflow-y-auto space-y-5">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Haqiqiy Telegram Botni Ulash (BotFather Token)
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ushbu ilovani Telegramdagi haqiqiy botingizga Webhook orqali ulashingiz mumkin.
                Buning uchun Telegramda @BotFather orqali bot oching va API tokenini kiriting.
              </p>
            </div>

            {webhookStatus && (
              <div className="p-3 bg-slate-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                {webhookStatus}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Telegram Bot API Token (@BotFather'dan olingan):
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 7123456789:AAHk..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Webhook URL (Avtomatik aniqlangan):
                </label>
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono select-all"
                />
              </div>

              <button
                onClick={handleSetRealWebhook}
                disabled={isSettingWebhook}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 disabled:opacity-50"
              >
                {isSettingWebhook ? 'Webhook faollashtirilmoqda...' : 'Webhookni Faollashtirish (setWebhook)'}
              </button>
            </div>

            {/* Instruction Checklist */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-semibold text-slate-100">Botni 1 daqiqada qanday ulash mumkin?</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Telegramda <b>@BotFather</b> ga kiring va <code>/newbot</code> yozing.</li>
                <li>Botingizga nom va username bering.</li>
                <li>BotFather bergan uzun <b>HTTP API Token</b> nusxasini yuqoridagi maydonga qo'ying.</li>
                <li>"Webhookni Faollashtirish" tugmasini bosing.</li>
                <li>Tayyor! Botingiz do'koningiz tovarlari va fakturalarini boshqarishga tayyor.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
