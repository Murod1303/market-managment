import React, { useState, useEffect } from 'react';
import {
  Store,
  ScanLine,
  PlusCircle,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  Smartphone,
  LogOut,
  UserCheck,
  Menu,
  X,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { AuthUser } from '../types';
import { useLanguage, LanguageSwitcher } from '../i18n/LanguageContext';

interface HeaderProps {
  onOpenScanner: () => void;
  onOpenAddModal: () => void;
  onOpenExcelModal: () => void;
  onOpenStatsModal: () => void;
  onOpenTelegramModal: () => void;
  onOpenQuickSearch: () => void;
  isTelegramWebAppView: boolean;
  onToggleTelegramView: () => void;
  currentUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenScanner,
  onOpenAddModal,
  onOpenExcelModal,
  onOpenStatsModal,
  onOpenTelegramModal,
  onOpenQuickSearch,
  isTelegramWebAppView,
  onToggleTelegramView,
  currentUser,
  onLogout,
}) => {
  const { t, language } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menu if viewport expands to xl
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userRoleDisplay = currentUser
    ? currentUser.role === 'admin'
      ? t('adminRole')
      : t('cashierRole')
    : '';

  return (
    <header
      id="app-main-header"
      className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-slate-100 sticky top-0 z-40 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 flex-nowrap overflow-hidden">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0 ring-1 ring-emerald-500/20">
              <Store className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-100 truncate">
                  {t('brandTitle')}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> {t('aiVision')}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden xl:block">
                {t('brandSubtitle')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation (Visible on xl screens: >= 1280px) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0 whitespace-nowrap">
            {/* Language Switcher Pill */}
            <LanguageSwitcher variant="compact" className="mr-1 shrink-0" />

            {/* Quick Search */}
            <button
              id="btn-quick-search"
              onClick={onOpenQuickSearch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition shadow-xs shrink-0 whitespace-nowrap"
              title={t('quickSearchTitle')}
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>{t('searchBtn')}</span>
            </button>

            {/* AI Scanner Button */}
            <button
              id="btn-ai-scanner"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition shrink-0 whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t('aiScannerBtn')}</span>
            </button>

            {/* Add Product Manual */}
            <button
              id="btn-add-product"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition shrink-0 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('newProductBtn')}</span>
            </button>

            {/* Excel Actions */}
            <button
              id="btn-excel-manager"
              onClick={onOpenExcelModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition shrink-0 whitespace-nowrap"
              title={t('excelModalTitle')}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{t('excelBtn')}</span>
            </button>

            {/* Statistics & PDF */}
            <button
              id="btn-stats-pdf"
              onClick={onOpenStatsModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition shrink-0 whitespace-nowrap"
              title={t('statsModalTitle')}
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>{t('statsPdfBtn')}</span>
            </button>

            {/* Telegram Bot & Simulator */}
            <button
              id="btn-telegram-bot"
              onClick={onOpenTelegramModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition shadow-xs shrink-0 whitespace-nowrap"
              title={t('telegramTitle')}
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>{t('telegramBotBtn')}</span>
            </button>

            {/* Telegram WebApp Mode Toggle */}
            <button
              id="btn-toggle-webapp-view"
              onClick={onToggleTelegramView}
              className={`p-2 rounded-xl border transition shrink-0 ${
                isTelegramWebAppView
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title={t('webAppViewTooltip')}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Current Auth User Badge & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800/80 shrink-0">
                <div
                  className="flex flex-col text-right pr-1"
                  title={`${t('authorized')}: ${currentUser.name}`}
                >
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[110px]">
                    {userRoleDisplay}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>

                {onLogout && (
                  <button
                    id="btn-app-logout"
                    onClick={onLogout}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition shrink-0"
                    title={t('logoutTooltip')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Compact / Mobile Navigation Bar (< xl: < 1280px) */}
          <div className="flex xl:hidden items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
            {/* Ultra-compact 1-tap Language Switcher so it NEVER overlaps any element */}
            <LanguageSwitcher variant="toggle" className="shrink-0" />

            {/* Primary Action: AI Scanner */}
            <button
              id="btn-ai-scanner-compact"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition shrink-0 whitespace-nowrap"
              title={t('aiScannerBtn')}
            >
              <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">{t('scannerShort')}</span>
            </button>

            {/* Hamburger Menu Toggle Button */}
            <button
              id="btn-header-hamburger"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`p-1.5 sm:p-2.5 rounded-xl border transition flex items-center justify-center shrink-0 ${
                isMenuOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              aria-label={isMenuOpen ? t('closeMenu') : t('menuTitle')}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Menu className="w-5 h-5 text-slate-200 shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-down / Dropdown Menu for screens < xl */}
      {isMenuOpen && (
        <div
          id="header-mobile-drawer"
          className="xl:hidden border-t border-slate-800/90 bg-slate-950/98 backdrop-blur-2xl shadow-2xl px-4 py-4 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-w-7xl mx-auto space-y-3">
            {/* Dedicated Language Selector Row in Drawer */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {language === 'uz-cyrl' ? 'Тизим тили' : 'Tizim tili'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'uz-cyrl' ? 'Ўзбекча (Кирилл / Лотин)' : "O'zbekcha (Lotin / Kirill)"}
                  </div>
                </div>
              </div>
              <LanguageSwitcher variant="compact" />
            </div>

            {/* User Info Card in Drawer */}
            {currentUser && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">
                      {currentUser.name}
                    </div>
                    <div className="text-xs text-emerald-400 font-medium">
                      {userRoleDisplay}
                    </div>
                  </div>
                </div>

                {onLogout && (
                  <button
                    id="btn-drawer-logout"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition shrink-0"
                    title={t('logoutTooltip')}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('logout')}</span>
                  </button>
                )}
              </div>
            )}

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* 1. Quick Search */}
              <button
                id="btn-drawer-quick-search"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenQuickSearch();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                      {t('quickSearchTitle')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('searchPlaceholder')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>

              {/* 2. AI Receipt & Invoice Scanner */}
              <button
                id="btn-drawer-ai-scanner"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenScanner();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 hover:border-emerald-500/50 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-300">
                      {t('aiScannerBtn')}
                    </div>
                    <div className="text-xs text-emerald-400/80">
                      {t('scannerModalSubtitle')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              {/* 3. Add Product Manual */}
              <button
                id="btn-drawer-add-product"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAddModal();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                      {t('newProductBtn')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('modalProductDesc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>

              {/* 4. Excel Manager */}
              <button
                id="btn-drawer-excel-manager"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenExcelModal();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                      {t('excelModalTitle')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('exportExcelBtn')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>

              {/* 5. Statistics & A4 PDF */}
              <button
                id="btn-drawer-stats-pdf"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenStatsModal();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/10 transition">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition">
                      {t('statsModalTitle')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('downloadPdfBtn')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
              </button>

              {/* 6. Telegram Bot & Webhook */}
              <button
                id="btn-drawer-telegram-bot"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenTelegramModal();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/10 transition">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition">
                      {t('telegramTitle')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('realBotTitle')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition" />
              </button>

              {/* 7. Telegram WebApp View Mode Toggle */}
              <button
                id="btn-drawer-toggle-webapp"
                onClick={() => {
                  setIsMenuOpen(false);
                  onToggleTelegramView();
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 text-left transition group sm:col-span-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                      isTelegramWebAppView
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition flex items-center gap-2">
                      <span>{t('footerTelegramView')}</span>
                      {isTelegramWebAppView && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ON
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {t('webAppViewTooltip')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
