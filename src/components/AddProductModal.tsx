import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, Check } from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatSom } from '../utils/formatters';
import { useLanguage } from '../i18n/LanguageContext';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  editingProduct?: Product | null;
}

const CATEGORIES = [
  'Oziq-ovqat',
  'Ichimliklar',
  'Meva-Sabzavot',
  'Sut mahsulotlari',
  "Xo'jalik mollari",
  'Shirinliklar',
  'Go\'sht mahsulotlari',
  'Boshqa',
];

const UNITS = ['kg', 'dona', 'litr', 'qop', 'quti', 'pachka', 'banka', 'blok', 'metr'];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}) => {
  const { t, transCategory, transUnit, language } = useLanguage();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Oziq-ovqat');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [unit, setUnit] = useState('dona');
  const [unitCost, setUnitCost] = useState<number | ''>(15000);
  const [markupPercent, setMarkupPercent] = useState<number | ''>(20);
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setCategory(editingProduct.category || 'Oziq-ovqat');
      setQuantity(editingProduct.quantity);
      setUnit(editingProduct.unit || 'dona');
      setUnitCost(editingProduct.unitCost);
      setMarkupPercent(editingProduct.markupPercent);
      setSupplier(editingProduct.supplier || '');
      setDate(editingProduct.date || new Date().toISOString().split('T')[0]);
      setNotes(editingProduct.notes || '');
    } else {
      setName('');
      setCategory('Oziq-ovqat');
      setQuantity(10);
      setUnit('dona');
      setUnitCost(15000);
      setMarkupPercent(20);
      setSupplier('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const numQty = Math.max(0, Number(quantity) || 0);
  const numCost = Math.max(0, Number(unitCost) || 0);
  const numMarkup = Number(markupPercent) || 0;

  const metrics = calculateProductMetrics({
    quantity: numQty,
    unitCost: numCost,
    markupPercent: numMarkup,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: editingProduct?.id,
      name: name.trim(),
      category,
      quantity: numQty,
      unit,
      unitCost: numCost,
      markupPercent: numMarkup,
      supplier: supplier.trim() || (language === 'uz-cyrl' ? 'Дўкон омбори' : "Do'kon ombori"),
      date,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-add-product"
        className="bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden my-8 animate-scale-up text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              {editingProduct ? t('editProductModalTitle') : t('addProductModalTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('addProductModalSubtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="bg-slate-950/80 p-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">{t('liveUnitSelling')}</span>
            <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5">
              {formatSom(metrics.unitPrice, language)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">{t('liveTotalCost')}</span>
            <div className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">
              {formatSom(metrics.totalCost, language)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">{t('liveExpRevenue')}</span>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
              {formatSom(metrics.expectedRevenue, language)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40">
            <span className="text-[11px] text-slate-950/80 uppercase font-semibold">{t('liveExpProfit')}</span>
            <div className="text-xs sm:text-sm font-extrabold mt-0.5">
              +{formatSom(metrics.expectedProfit, language)}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tovar nomi */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colName')} <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-product-name"
                type="text"
                required
                placeholder={t('nameInputPlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100 placeholder-slate-500"
              />
            </div>

            {/* Kategoriya */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colCategory')}
              </label>
              <select
                id="select-product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-slate-100">
                    {transCategory(c)}
                  </option>
                ))}
              </select>
            </div>

            {/* O'lchov Birligi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colUnit')}
              </label>
              <select
                id="select-product-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u} className="bg-slate-900 text-slate-100">
                    {transUnit(u)}
                  </option>
                ))}
              </select>
            </div>

            {/* Kelgan Miqdori */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colQuantity')}
              </label>
              <input
                id="input-product-qty"
                type="number"
                min="0.1"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
              />
            </div>

            {/* 1 birlik tannarxi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colUnitCost')} ({language === 'uz-cyrl' ? 'келиш нархи, сўм' : "kelish narxi, so'm"})
              </label>
              <input
                id="input-product-unit-cost"
                type="number"
                min="0"
                step="any"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
              />
            </div>

            {/* Ustama foizi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('colMarkup')} (%)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="input-product-markup"
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
                />
                {[15, 20, 25, 30].map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setMarkupPercent(p)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      markupPercent === p
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Ta'minotchi */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('supplierInputLabel')}
              </label>
              <input
                id="input-product-supplier"
                type="text"
                placeholder={t('supplierInputPlaceholder')}
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100 placeholder-slate-500"
              />
            </div>

            {/* Kelgan sana */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('dateLabel')}
              </label>
              <input
                id="input-product-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100"
              />
            </div>

            {/* Izoh */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('notesInputLabel')}
              </label>
              <input
                id="input-product-notes"
                type="text"
                placeholder={t('notesInputPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              id="btn-save-product-modal"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition"
            >
              <Check className="w-4 h-4" />
              <span>{editingProduct ? t('saveChanges') : t('addToTable')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
