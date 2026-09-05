/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { ProductTable } from './components/ProductTable';
import { AddProductModal } from './components/AddProductModal';
import { AiScannerModal } from './components/AiScannerModal';
import { QuickSearchDrawer } from './components/QuickSearchDrawer';
import { FinancialStatsModal } from './components/FinancialStatsModal';
import { ExcelManagerModal } from './components/ExcelManagerModal';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal';
import { LoginScreen } from './components/LoginScreen';
import { Product, AuthUser } from './types';
import { initialProducts } from './data/initialProducts';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Search,
  MessageSquare,
  FileSpreadsheet,
  FileText,
  Smartphone,
  Store,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);
  const [isTelegramWebAppView, setIsTelegramWebAppView] = useState<boolean>(false);

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Verify authentication on mount (check URL auth_token param or localStorage)
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('auth_token');
        const token = urlToken || localStorage.getItem('smartsavdo_auth_token');

        if (token) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setCurrentUser(data.user);
              setAuthToken(token);
              localStorage.setItem('smartsavdo_auth_token', token);
              localStorage.setItem('smartsavdo_auth_user', JSON.stringify(data.user));

              // If launched from telegram with query param, auto switch to WebApp view
              if (urlToken) {
                setIsTelegramWebAppView(true);
              }
              setIsAuthChecking(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      }

      // If invalid or no token
      localStorage.removeItem('smartsavdo_auth_token');
      localStorage.removeItem('smartsavdo_auth_user');
      setCurrentUser(null);
      setAuthToken(null);
      setIsAuthChecking(false);
    };

    verifyAuth();
  }, []);

  // Fetch products from server
  const fetchProducts = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const token = authToken || localStorage.getItem('smartsavdo_auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/products', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch (err) {
      console.warn('API get products fallback to memory state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (currentUser) {
      fetchProducts();
    }
  }, [currentUser, fetchProducts]);

  // Logout Handler
  const handleLogout = async () => {
    try {
      const token = authToken || localStorage.getItem('smartsavdo_auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Logout error:', err);
    }

    localStorage.removeItem('smartsavdo_auth_token');
    localStorage.removeItem('smartsavdo_auth_user');
    setCurrentUser(null);
    setAuthToken(null);
    showToast('Tizimdan muvaffaqiyatli chiqildi');
  };

  // Login Success Handler
  const handleLoginSuccess = (user: AuthUser, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    showToast(`Xush kelibsiz, ${user.name}!`);
  };

  // Save/Update Product
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (productData.id && products.some((p) => p.id === productData.id)) {
        // Update
        const res = await fetch(`/api/products/${productData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });

        if (res.ok) {
          const data = await res.json();
          setProducts((prev) =>
            prev.map((p) => (p.id === productData.id ? data.product : p))
          );
          showToast('Tovar ma\'lumotlari muvaffaqiyatli yangilandi');
        } else {
          // Client state fallback
          setProducts((prev) =>
            prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p))
          );
          showToast('Tovar ma\'lumotlari yangilandi');
        }
      } else {
        // Add
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.products) setProducts(data.products);
          showToast('Yangi tovar muvaffaqiyatli qo\'shildi');
        } else {
          const newItem: Product = {
            id: `prod-${Date.now()}`,
            name: productData.name || 'Yangi tovar',
            category: productData.category || 'Umumiy',
            quantity: productData.quantity || 1,
            unit: productData.unit || 'dona',
            unitCost: productData.unitCost || 0,
            markupPercent: productData.markupPercent || 20,
            date: productData.date || new Date().toISOString().split('T')[0],
            supplier: productData.supplier || "Do'kon ombori",
            notes: productData.notes || '',
          };
          setProducts((prev) => [newItem, ...prev]);
          showToast('Yangi tovar qo\'shildi');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Saqlashda xatolik yuz berdi', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Haqiqatan ham ushbu tovarni ro'yxatdan o'chirmoqchimisiz?")) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast("Tovar muvaffaqiyatli o'chirildi");
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast("Tovar o'chirildi");
      }
    } catch (err) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Tovar o'chirildi");
    }
  };

  // Batch Markup Update
  const handleBatchMarkup = async (ids: string[], markupPercent: number) => {
    try {
      const res = await fetch('/api/products-batch-markup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, markupPercent }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        showToast(`${ids.length} ta tovarga +${markupPercent}% ustama o'rnatildi`);
      } else {
        const idSet = new Set(ids);
        setProducts((prev) =>
          prev.map((p) => (idSet.has(p.id) ? { ...p, markupPercent } : p))
        );
        showToast(`${ids.length} ta tovarga +${markupPercent}% ustama o'rnatildi`);
      }
    } catch (err) {
      const idSet = new Set(ids);
      setProducts((prev) =>
        prev.map((p) => (idSet.has(p.id) ? { ...p, markupPercent } : p))
      );
      showToast(`${ids.length} ta tovarga +${markupPercent}% ustama o'rnatildi`);
    }
  };

  // Add multiple extracted items from AI scanner or Excel
  const handleAddMultipleProducts = async (newItems: Partial<Product>[]) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItems),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) setProducts(data.products);
        showToast(`${newItems.length} ta tovar muvaffaqiyatli qo'shildi!`);
      } else {
        fetchProducts();
        showToast(`${newItems.length} ta tovar qo'shildi!`);
      }
    } catch (err) {
      console.error(err);
      fetchProducts();
    }
  };

  // Reset to default inventory
  const handleResetDemoData = async () => {
    if (!window.confirm("Barcha ma'lumotlarni namunaviy tovarlar ro'yxatiga qaytarmoqchimisiz?")) {
      return;
    }

    try {
      const res = await fetch('/api/products/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      } else {
        setProducts(initialProducts);
      }
      showToast("Namunaviy tovarlar ro'yxati tiklandi");
    } catch (err) {
      setProducts(initialProducts);
      showToast("Namunaviy tovarlar tiklandi");
    }
  };

  // 1. If still checking stored token / auth status
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-950/50 mb-4 animate-pulse">
          <Store className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>SmartSavdo xavfsizlik tekshiruvi...</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Avtorizatsiya ma'lumotlari yuklanmoqda</p>
      </div>
    );
  }

  // 2. If not logged in, show Login Screen (blocks access to main page)
  if (!currentUser) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          isTelegramWebAppView={isTelegramWebAppView}
        />

        {/* Toast Notification Alert */}
        {toast && (
          <div
            id="app-toast-notification"
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-slide-up ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : 'bg-red-900 text-white border-red-500/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      id="app-root"
      className={`min-h-screen ${
        isTelegramWebAppView
          ? 'bg-slate-950 p-0 sm:p-4 text-slate-100'
          : 'bg-slate-950 text-slate-200'
      } flex flex-col font-sans transition-colors duration-300 selection:bg-emerald-500/30 selection:text-emerald-200`}
    >
      {/* Telegram WebApp Simulation Container */}
      {isTelegramWebAppView ? (
        <div className="max-w-4xl mx-auto w-full min-h-screen bg-slate-900 sm:rounded-3xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden">
          {/* Telegram Native WebApp Top Bar */}
          <div className="bg-slate-950/90 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <button
              onClick={() => setIsTelegramWebAppView(false)}
              className="text-xs font-semibold hover:underline flex items-center gap-1 text-slate-300 hover:text-white"
            >
              ← Web rejimiga qaytish
            </button>
            <div className="text-center">
              <span className="text-sm font-bold block text-slate-100">SmartSavdo WebApp</span>
              <span className="text-[10px] text-slate-400">
                {currentUser.name} ({currentUser.roleTitle})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-emerald-400 font-medium">Avtorizatsiyalangan</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1 transition"
                title="Tizimdan chiqish"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Chiqish</span>
              </button>
            </div>
          </div>

          {/* WebApp Inner Content */}
          <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
            {/* Quick Actions in WebApp */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="p-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex flex-col items-center gap-2 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition"
              >
                <ScanLine className="w-5 h-5" />
                <span>AI Skaner</span>
              </button>

              <button
                onClick={() => setIsQuickSearchOpen(true)}
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-sky-300 font-bold text-xs flex flex-col items-center gap-2 border border-slate-700/80 transition"
              >
                <Search className="w-5 h-5 text-sky-400" />
                <span>Tezkor Qidiruv</span>
              </button>

              <button
                onClick={() => setIsStatsModalOpen(true)}
                className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-xs flex flex-col items-center gap-2 border border-slate-700/80 transition"
              >
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Statistika & PDF</span>
              </button>

              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="p-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs flex flex-col items-center gap-2 border border-sky-500/40 transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Telegram Chat</span>
              </button>
            </div>

            {/* KPI Cards */}
            <KpiCards products={products} />

            {/* Product Table in WebApp */}
            <div className="bg-slate-900 rounded-2xl p-1 text-slate-100 shadow-xl border border-slate-800">
              <ProductTable
                products={products}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setIsAddModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onBatchMarkup={handleBatchMarkup}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            </div>

            {/* Telegram Simulated MainButton Sticky at bottom */}
            <div className="sticky bottom-2 z-20 pt-2">
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 flex items-center justify-center gap-2 transition"
              >
                <ScanLine className="w-5 h-5" />
                <span>CHEK YOKI FAKTURANI AI BILAN SKANERLASH</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Web Application Layout */
        <>
          {/* Main Navigation Header */}
          <Header
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAddModal={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onOpenStatsModal={() => setIsStatsModalOpen(true)}
            onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
            onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
            isTelegramWebAppView={isTelegramWebAppView}
            onToggleTelegramView={() => setIsTelegramWebAppView(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {/* Bento Hero / Gemini Vision Callout Card */}
            <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/30 backdrop-blur-md text-slate-100 rounded-2xl p-5 sm:p-7 border border-slate-800/80 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    AI Gemini Vision 3.8
                  </span>
                  <span className="text-xs text-slate-400">
                    O'zbekiston so'mida real vaqtda hisob-kitob
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-100">
                  Tovar Tannarxlari, Kelgan Nakladnoylar va Sof Foyda Boshqaruvi
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Do'konga kelgan chek yoki qog'oz faktura rasmini yuklang, AI avtomatik tovarlar
                  va tannarxlarni ajratadi, ustama foizini belgilang va bir zumda sotish narxi hamda
                  sof foydani Excelga oling.
                </p>
              </div>

              {/* Quick Bento Hero CTA Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  id="hero-btn-scan"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition flex items-center gap-2"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Faktura Skanerlash</span>
                </button>

                <button
                  id="hero-btn-telegram"
                  onClick={() => setIsTelegramModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-sky-300 font-semibold text-xs sm:text-sm border border-sky-500/30 transition flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>Telegram Bot</span>
                </button>

                <button
                  onClick={handleResetDemoData}
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition"
                  title="Namunaviy tovarlarni qayta yuklash"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 KPI Financial Overview Cards */}
            <section id="section-kpis" aria-label="Asosiy moliyaviy ko'rsatkichlar">
              <KpiCards products={products} />
            </section>

            {/* Excel-style Product & Profit Table */}
            <section id="section-products-table" aria-label="Tovarlar jadvali">
              <ProductTable
                products={products}
                onEditProduct={(p) => {
                  setEditingProduct(p);
                  setIsAddModalOpen(true);
                }}
                onDeleteProduct={handleDeleteProduct}
                onBatchMarkup={handleBatchMarkup}
                onOpenAddModal={() => {
                  setEditingProduct(null);
                  setIsAddModalOpen(true);
                }}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-slate-950 border-t border-slate-800/80 mt-auto py-6 text-slate-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">SmartSavdo Tizimi</span>
                <span className="text-slate-600">•</span>
                <span>Tovarlar, xarajatlar va kassa tushumi hisoblagichi</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsTelegramWebAppView(true)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Telegram WebApp ko'rinishi
                </button>
                <span className="text-slate-600">•</span>
                <span>O'zbekiston So'mi (UZS)</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* MODALS */}

      {/* 1. Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />

      {/* 2. AI Gemini Vision Invoice / Receipt Scanner Modal */}
      <AiScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAddExtractedProducts={handleAddMultipleProducts}
      />

      {/* 3. Quick Search Drawer */}
      <QuickSearchDrawer
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        products={products}
      />

      {/* 4. Financial Statistics & A4 PDF Report Modal */}
      <FinancialStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        products={products}
      />

      {/* 5. Excel (.xlsx) Manager Modal */}
      <ExcelManagerModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        products={products}
        onImportProducts={handleAddMultipleProducts}
      />

      {/* 6. Telegram Simulator & Webhook Setup Modal */}
      <TelegramSimulatorModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        products={products}
        onProductsUpdated={fetchProducts}
        onOpenWebAppWithAuth={async (token) => {
          setAuthToken(token);
          localStorage.setItem('smartsavdo_auth_token', token);
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setCurrentUser(data.user);
                localStorage.setItem('smartsavdo_auth_user', JSON.stringify(data.user));
              }
            }
          } catch (err) {
            console.warn(err);
          }
          setIsTelegramModalOpen(false);
          setIsTelegramWebAppView(true);
          showToast("SmartSavdo WebApp ilovasi ishga tushirildi!");
        }}
      />

      {/* Toast Notification Alert */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-slide-up ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/50'
              : 'bg-red-900 text-white border-red-500/50'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
