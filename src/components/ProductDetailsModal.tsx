import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  TrendingUp,
  DollarSign,
  Calendar,
  Truck,
  Tag,
  Sparkles,
  Calculator,
  Copy,
  Check,
  Edit2,
  Trash2,
  Boxes,
  FileText,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Share2,
} from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatNumber, formatSom } from '../utils/formatters';
import { useLanguage } from '../i18n/LanguageContext';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t, transCategory, transUnit, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [calcQty, setCalcQty] = useState<number>(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDeleteConfirm, onClose]);

  // Reset calculator when product changes
  useEffect(() => {
    if (product) {
      setCalcQty(1);
      setCopied(false);
      setShowDeleteConfirm(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const metrics = calculateProductMetrics(product);
  const unitProfit = metrics.unitPrice - product.unitCost;
  const marginPercent = metrics.unitPrice > 0 ? ((unitProfit / metrics.unitPrice) * 100).toFixed(1) : '0';

  // Stock status determination
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 15;

  // Interactive calculator metrics
  const simQuantity = Math.max(0, calcQty);
  const simTotalPay = simQuantity * metrics.unitPrice;
  const simTotalCost = simQuantity * product.unitCost;
  const simNetProfit = simTotalPay - simTotalCost;

  // Copy product info to clipboard
  const handleCopy = () => {
    const textToCopy = `📦 ${product.name}\n` +
      `📁 ${transCategory(product.category)}\n` +
      `💰 ${language === 'uz-cyrl' ? 'Нархи' : 'Narxi'}: ${formatSom(metrics.unitPrice, language)} / ${transUnit(product.unit)}\n` +
      `📊 ${language === 'uz-cyrl' ? 'Таннархи' : 'Tannarxi'}: ${formatSom(product.unitCost, language)} (+${product.markupPercent}%)\n` +
      `📦 ${language === 'uz-cyrl' ? 'Қолдиқ' : 'Qoldiq'}: ${formatNumber(product.quantity)} ${transUnit(product.unit)}\n` +
      `🏢 ${language === 'uz-cyrl' ? 'Таъминотчи' : "Ta'minotchi"}: ${product.supplier || t('defaultSupplier')}\n` +
      `📅 ${language === 'uz-cyrl' ? 'Сана' : 'Sana'}: ${product.date}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = () => {
    onDelete(product.id);
    onClose();
  };

  return (
    <div
      id="product-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="product-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-sm">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/60">
                  {transCategory(product.category)}
                </span>
                <span className="text-slate-500 font-mono text-xs">
                  {t('skuCode')}: #{product.id.slice(0, 7).toUpperCase()}
                </span>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-3 h-3" /> {t('stockOut')}
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" /> {t('stockLow')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" /> {t('stockSufficient')}
                  </span>
                )}
              </div>
              <h2
                id="product-details-title"
                className="text-lg sm:text-xl font-bold text-slate-100 mt-1 break-words leading-snug"
              >
                {product.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-copy-product-details"
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition"
              title={t('copyInfoBtn')}
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              id="btn-close-product-details"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition"
              title={t('closeMenu')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Main 4 Visual Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Selling Price */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-emerald-400">
                {t('colUnitPrice')} (1 {transUnit(product.unit)})
              </span>
              <div className="mt-1">
                <div className="text-lg sm:text-xl font-black text-emerald-300 font-mono tracking-tight">
                  {formatSom(metrics.unitPrice, language)}
                </div>
                <div className="text-[10px] text-emerald-400/70 font-medium">
                  {language === 'uz-cyrl' ? 'Сотув нархи' : 'Sotuv narxi'}
                </div>
              </div>
            </div>

            {/* 2. Unit Cost */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {t('colUnitCost')} (1 {transUnit(product.unit)})
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-bold text-slate-200 font-mono">
                  {formatSom(product.unitCost, language)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {language === 'uz-cyrl' ? 'Келтирилган таннарх' : 'Keltirilgan tannarx'}
                </div>
              </div>
            </div>

            {/* 3. Markup */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {t('colMarkup')}
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  +{product.markupPercent}%
                </div>
                <div className="text-[10px] text-slate-500">
                  {marginPercent}% {t('profitMargin')}
                </div>
              </div>
            </div>

            {/* 4. Quantity in Stock */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                {t('colQuantity')}
              </span>
              <div className="mt-1">
                <div className="text-base sm:text-lg font-bold text-slate-100 font-mono">
                  {formatNumber(product.quantity)}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {transUnit(product.unit)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {language === 'uz-cyrl' ? 'Омбордаги захира' : 'Ombordagi zaxira'}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Totals Bento Grid */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{language === 'uz-cyrl' ? 'Молиявий Кўрсаткичлар Ва Фойда' : "Moliyaviy Ko'rsatkichlar Va Foyda"}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {product.quantity} {transUnit(product.unit)} {language === 'uz-cyrl' ? 'учун' : 'uchun'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Total Investment Cost */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">
                  {t('colTotalCost')}
                </div>
                <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                  {formatSom(metrics.totalCost, language)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {product.quantity} × {formatSom(product.unitCost, language)}
                </div>
              </div>

              {/* Total Expected Revenue */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">
                  {t('colExpectedRevenue')}
                </div>
                <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                  {formatSom(metrics.expectedRevenue, language)}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {product.quantity} × {formatSom(metrics.unitPrice, language)}
                </div>
              </div>

              {/* Total Expected Net Profit */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-xs text-emerald-400 font-medium">
                  {t('colExpectedProfit')}
                </div>
                <div className="text-base font-black text-emerald-300 font-mono mt-0.5">
                  +{formatSom(metrics.expectedProfit, language)}
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">
                  {t('unitProfit')}: +{formatSom(unitProfit, language)}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Quick Sales Simulator (Kalkulyator) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <Calculator className="w-4 h-4 text-sky-400" />
                <span>{t('quickSalesCalc')}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {language === 'uz-cyrl' ? 'Тезкор мижоз ҳисоб-китоби' : 'Tezkor mijoz hisob-kitobi'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 whitespace-nowrap">{t('calcIfSold')}</span>
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setCalcQty((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={calcQty}
                    onChange={(e) => setCalcQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-16 text-center font-bold font-mono text-sm bg-transparent text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCalcQty((prev) => prev + 1)}
                    className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {transUnit(product.unit)}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[1, 2, 5, 10, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCalcQty(preset)}
                    className={`px-2 py-1 text-xs rounded-md transition font-medium ${
                      calcQty === preset
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {preset} {transUnit(product.unit)}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator Output Result */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{t('calcTotalPay')}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-slate-100">
                  {formatSom(simTotalPay, language)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <span className="text-xs text-emerald-400">{t('calcNetProfit')}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-300">
                  +{formatSom(simNetProfit, language)}
                </span>
              </div>
            </div>
          </div>

          {/* Supply & Store Information Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Supplier & Receipt Date */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Truck className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'uz-cyrl' ? 'Таъминотчи ва Ҳужжат' : "Ta'minotchi va Hujjat"}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{language === 'uz-cyrl' ? 'Таъминотчи:' : "Ta'minotchi:"}</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {product.supplier || t('defaultSupplier')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{language === 'uz-cyrl' ? 'Қабул санаси:' : 'Qabul sanasi:'}</span>
                  <span className="font-mono text-slate-300">{product.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">{t('colCategory')}:</span>
                  <span className="text-emerald-400 font-medium">
                    {transCategory(product.category)}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Tag Preview (Vitrina Yorlig'i) */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('priceTagPreview')}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  {t('brandTitle')}
                </span>
              </div>

              <div className="my-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <div className="text-xs text-slate-300 font-semibold truncate">
                  {product.name}
                </div>
                <div className="text-base font-black text-emerald-400 font-mono my-0.5">
                  {formatSom(metrics.unitPrice, language)}
                </div>
                <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  |||||| {product.id.slice(0, 6)} ||||||
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Description if available */}
          {product.notes && (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
              <span className="font-semibold text-slate-400 block mb-1">
                {language === 'uz-cyrl' ? 'Қўшимча изоҳ:' : "Qo'shimcha izoh:"}
              </span>
              <p className="text-slate-300 leading-relaxed">{product.notes}</p>
            </div>
          )}

          {/* Delete Confirmation Box if triggered */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 animate-in fade-in space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{t('deleteConfirmTitle')}</span>
              </div>
              <p className="text-xs text-rose-200/90">
                {t('deleteConfirmDesc')} (<b>{product.name}</b>)
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-confirm-delete-product"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
                >
                  {t('deleteProductConfirmBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="btn-edit-from-details"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t('edit')}</span>
            </button>

            {!showDeleteConfirm && (
              <button
                type="button"
                id="btn-delete-from-details"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              id="btn-copy-info-footer"
              onClick={handleCopy}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t('copiedSuccess')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copyInfoBtn')}</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            id="btn-close-details-footer"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
          >
            {t('closeMenu')}
          </button>
        </div>
      </div>
    </div>
  );
};
