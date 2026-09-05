import React, { useState } from 'react';
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser } from '../types';
import { useLanguage, LanguageSwitcher } from '../i18n/LanguageContext';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  isTelegramWebAppView?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isTelegramWebAppView = false,
}) => {
  const { t, language } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const userToSubmit = (customUser !== undefined ? customUser : username).trim();
    const passToSubmit = (customPass !== undefined ? customPass : password).trim();

    if (!userToSubmit || !passToSubmit) {
      setErrorMessage(t('loginErrorMissing'));
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToSubmit, password: passToSubmit }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            (language === 'uz-cyrl'
              ? "Логин ёки парол нотўғри!"
              : "Login yoki parol noto'g'ri!")
        );
      }

      // Save token to localStorage
      localStorage.setItem('smartsavdo_auth_token', data.token);
      localStorage.setItem('smartsavdo_auth_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (language === 'uz-cyrl'
            ? 'Тизимга киришда хатолик юз берди'
            : 'Tizimga kirishda xatolik yuz berdi')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleSubmit(undefined, u, p);
  };

  return (
    <div
      id="login-screen-container"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-slate-950"
    >
      {/* Background subtle Bento Grid ambient lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Language selector on top of login */}
        <div className="flex justify-end">
          <LanguageSwitcher variant="full" />
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl shadow-emerald-950/50 ring-1 ring-emerald-500/20 mb-2">
            <Store className="w-7 h-7 text-emerald-400" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
              {t('brandTitle')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3 h-3" /> {language === 'uz-cyrl' ? 'Хавфсиз' : 'Xavfsiz'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {t('loginSubtitle')}
          </p>

          {isTelegramWebAppView && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30 mt-1">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {language === 'uz-cyrl'
                  ? 'Telegram WebApp орқали кириш'
                  : 'Telegram WebApp orqali kirish'}
              </span>
            </div>
          )}
        </div>

        {/* Login Form Bento Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-200">{t('submitLogin')}</span>
            </div>
            <span className="text-xs text-slate-400">
              {language === 'uz-cyrl' ? 'Авторизация' : 'Avtorizatsiya'}
            </span>
          </div>

          {/* Error Message alert */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-username"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                {t('usernameLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder')}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="input-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>{t('submittingLogin')}</span>
              ) : (
                <>
                  <span>{t('submitLogin')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Bento Card */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-xs font-medium text-slate-400 mb-3 flex items-center justify-between">
              <span>{t('quickAccounts')}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {language === 'uz-cyrl' ? '1 босишда' : '1 bosishda'}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                id="btn-quick-login-admin"
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition">
                    👑 {language === 'uz-cyrl' ? 'Бошқарувчи' : 'Boshqaruvchi'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
                </div>
                <div className="text-[11px] text-slate-400">admin</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {language === 'uz-cyrl' ? 'парол:' : 'parol:'} admin123
                </div>
              </button>

              <button
                id="btn-quick-login-cashier"
                type="button"
                onClick={() => handleQuickLogin('kassir', 'kassa2026')}
                className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition">
                    👤 {language === 'uz-cyrl' ? 'Кассир-Оператор' : 'Kassir-Operator'}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
                </div>
                <div className="text-[11px] text-slate-400">kassir</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {language === 'uz-cyrl' ? 'парол:' : 'parol:'} kassa2026
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Telegram Bot Security Hint Bento Card */}
        <div className="bg-slate-900/60 border border-slate-800/70 rounded-2xl p-4 text-xs text-slate-400 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
            <Bot className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-slate-200">
              {language === 'uz-cyrl'
                ? 'Telegram Бот орқали авторизация:'
                : 'Telegram Bot orqali avtorizatsiya:'}
            </div>
            <p className="leading-relaxed">
              {language === 'uz-cyrl'
                ? "Telegram ботдан фойдаланишда ҳам /login admin admin123 буйруғи орқали рухсат олинади. Бот ичидан WebApp очилганда ҳам ушбу ҳисоб билан кирилади."
                : "Telegram botdan foydalanishda ham /login admin admin123 buyrug'i orqali ruxsat olinadi. Bot ichidan WebApp ochilganda ham ushbu hisob bilan kiriladi."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
