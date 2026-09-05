import React from 'react';
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
} from 'lucide-react';
import { AuthUser } from '../types';

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
  return (
    <header
      id="app-main-header"
      className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 text-slate-100 sticky top-0 z-30 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Store Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 shrink-0 ring-1 ring-emerald-500/20">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-100 truncate">
                  SmartSavdo
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> AI Vision
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate hidden sm:block">
                Do'kon tovarlari, fakturalar va xarajatlar boshqaruvi
              </p>
            </div>
          </div>

          {/* Quick Actions Navigation */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Search */}
            <button
              id="btn-quick-search"
              onClick={onOpenQuickSearch}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition shadow-xs"
              title="Tezkor tovar qidiruvi"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Qidiruv</span>
            </button>

            {/* AI Scanner Button (Highlighted Bento Accent) */}
            <button
              id="btn-ai-scanner"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chek Skaneri</span>
              <span className="sm:hidden">Skaner</span>
            </button>

            {/* Add Product Manual */}
            <button
              id="btn-add-product"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">Yangi tovar</span>
            </button>

            {/* Excel Actions */}
            <button
              id="btn-excel-manager"
              onClick={onOpenExcelModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition"
              title="Excel (.xlsx) yuklash va import"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Excel</span>
            </button>

            {/* Statistics & PDF */}
            <button
              id="btn-stats-pdf"
              onClick={onOpenStatsModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 hover:border-slate-700 transition"
              title="Statistika va A4 PDF"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span className="hidden xl:inline">Statistika / PDF</span>
            </button>

            {/* Telegram Bot & Simulator */}
            <button
              id="btn-telegram-bot"
              onClick={onOpenTelegramModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition shadow-xs"
              title="Telegram Bot va Simulyator"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span className="hidden md:inline">Telegram Bot</span>
            </button>

            {/* Telegram WebApp Mode Toggle */}
            <button
              id="btn-toggle-webapp-view"
              onClick={onToggleTelegramView}
              className={`p-2 rounded-xl border transition ${
                isTelegramWebAppView
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
              title="Telegram WebApp Ko'rinishi (Mobil simulyatsiya)"
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Current Auth User Badge & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800/80">
                <div
                  className="hidden xl:flex flex-col text-right pr-1"
                  title={`Tizimga kirilgan: ${currentUser.name}`}
                >
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[120px]">
                    {currentUser.roleTitle}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-4 h-4" />
                </div>

                {onLogout && (
                  <button
                    id="btn-app-logout"
                    onClick={onLogout}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 transition"
                    title="Tizimdan chiqish (Xavfsiz yopish)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
