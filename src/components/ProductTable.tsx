import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  ArrowUpDown,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatNumber, formatSom } from '../utils/formatters';

interface ProductTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onBatchMarkup: (ids: string[], markupPercent: number) => void;
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  onBatchMarkup,
  onOpenAddModal,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customMarkup, setCustomMarkup] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Product | 'totalCost' | 'expectedProfit'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ['Barchasi', ...Array.from(set)];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'Barchasi' || p.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.supplier && p.supplier.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof Product];
        let valB: any = b[sortField as keyof Product];

        if (sortField === 'totalCost') {
          valA = a.quantity * a.unitCost;
          valB = b.quantity * b.unitCost;
        } else if (sortField === 'expectedProfit') {
          const mA = calculateProductMetrics(a);
          const mB = calculateProductMetrics(b);
          valA = mA.expectedProfit;
          valB = mB.expectedProfit;
        }

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      });
  }, [products, searchQuery, selectedCategory, sortField, sortDirection]);

  // Total summary calculations
  const totals = useMemo(() => {
    let cost = 0;
    let revenue = 0;
    let profit = 0;

    filteredProducts.forEach((p) => {
      const m = calculateProductMetrics(p);
      cost += m.totalCost;
      revenue += m.expectedRevenue;
      profit += m.expectedProfit;
    });

    const avgMarkup =
      filteredProducts.length > 0
        ? Math.round(
            filteredProducts.reduce((sum, p) => sum + (Number(p.markupPercent) || 0), 0) /
              filteredProducts.length
          )
        : 0;

    return {
      totalCost: cost,
      totalRevenue: revenue,
      totalProfit: profit,
      avgMarkup,
      count: filteredProducts.length,
    };
  }, [filteredProducts]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApplyBatchMarkup = (percent: number) => {
    if (selectedIds.length === 0) return;
    onBatchMarkup(selectedIds, percent);
  };

  const handleApplyCustomMarkup = () => {
    const val = Number(customMarkup);
    if (isNaN(val) || val < 0) return;
    if (selectedIds.length === 0) return;
    onBatchMarkup(selectedIds, val);
    setCustomMarkup('');
  };

  const toggleSort = (field: keyof Product | 'totalCost' | 'expectedProfit') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div id="product-table-container" className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
      {/* Top Filter and Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Tovarlar Jadvali va Foyda Hisoblagich</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                {products.length} ta
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelgan tovarlar, tannarxlar, ustama foizlari va kutilayotgan sof foyda hisob-kitobi
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-table-row"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tovar qo'shish</span>
            </button>
            <button
              id="btn-scan-table-receipt"
              onClick={onOpenScanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Faktura skanerlash</span>
            </button>
          </div>
        </div>

        {/* Search and Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                id="input-table-search"
                type="text"
                placeholder="Tovar nomi, ta'minotchi qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-950 text-slate-100 placeholder-slate-500"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-200 shrink-0"
              >
                Tozalash
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Kategoriya:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-xl font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Panel (When items selected) */}
        {selectedIds.length > 0 && (
          <div
            id="bulk-actions-toolbar"
            className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>
                <b>{selectedIds.length} ta tovar tanlandi</b>. Ommaviy ustama belgilang:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  onClick={() => handleApplyBatchMarkup(pct)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-2xs"
                >
                  +{pct}%
                </button>
              ))}

              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  placeholder="%"
                  value={customMarkup}
                  onChange={(e) => setCustomMarkup(e.target.value)}
                  className="w-14 px-2 py-1 text-xs border border-emerald-500/40 rounded-lg bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleApplyCustomMarkup}
                  disabled={!customMarkup}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 disabled:opacity-50"
                >
                  O'rnatish
                </button>
              </div>

              <button
                onClick={() => setSelectedIds([])}
                className="ml-2 text-xs text-emerald-400 hover:underline"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold text-xs tracking-wider">
              <th className="p-3 w-10 text-center">
                <button
                  onClick={handleSelectAll}
                  className="text-slate-400 hover:text-slate-200"
                  title="Barchasini belgilash"
                >
                  {selectedIds.length > 0 && selectedIds.length === filteredProducts.length ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 w-12 text-center text-slate-500">№</th>
              <th
                onClick={() => toggleSort('name')}
                className="p-3 cursor-pointer hover:text-slate-200 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Tovar Nomi</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="p-3">Kategoriya</th>
              <th
                onClick={() => toggleSort('quantity')}
                className="p-3 text-right cursor-pointer hover:text-slate-200 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Kelgan Miqdori</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('unitCost')}
                className="p-3 text-right cursor-pointer hover:text-slate-200 select-none"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>1 Birlik Tannarxi</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('totalCost')}
                className="p-3 text-right cursor-pointer hover:text-slate-200 select-none bg-slate-950/40"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Jami Xarajat</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('markupPercent')}
                className="p-3 text-center cursor-pointer hover:text-slate-200 select-none"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Ustama (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="p-3 text-right font-bold text-slate-200">
                1 Birlik Sotish Narxi
              </th>
              <th className="p-3 text-right font-medium text-emerald-400">
                Kutilayotgan Tushum
              </th>
              <th
                onClick={() => toggleSort('expectedProfit')}
                className="p-3 text-right cursor-pointer hover:text-teal-200 select-none bg-teal-950/20 font-bold text-teal-300"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Kutilayotgan Sof Foyda</span>
                  <ArrowUpDown className="w-3 h-3 text-teal-400" />
                </div>
              </th>
              <th className="p-3">Sana & Ta'minotchi</th>
              <th className="p-3 text-center w-20">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-8 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-medium text-slate-200">Hech qanday tovar topilmadi</p>
                    <p className="text-xs text-slate-500">
                      Qidiruv so'zini o'zgartiring yoki yangi tovar/faktura qo'shing.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, idx) => {
                const metrics = calculateProductMetrics(product);
                const isSelected = selectedIds.includes(product.id);

                return (
                  <tr
                    key={product.id}
                    id={`product-row-${product.id}`}
                    className={`hover:bg-slate-800/40 transition-colors text-slate-200 ${
                      isSelected ? 'bg-emerald-950/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleSelect(product.id)}
                        className="text-slate-500 hover:text-slate-300"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Sequence Number */}
                    <td className="p-3 text-center text-slate-500 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* Name */}
                    <td className="p-3 font-semibold text-slate-100">
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        {product.notes && (
                          <span className="text-[11px] font-normal text-slate-400 line-clamp-1">
                            {product.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3 text-slate-300">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                        {product.category}
                      </span>
                    </td>

                    {/* Quantity & Unit */}
                    <td className="p-3 text-right font-medium text-slate-100">
                      <span>{formatNumber(product.quantity)}</span>{' '}
                      <span className="text-xs text-slate-400 font-normal">{product.unit}</span>
                    </td>

                    {/* Unit Cost */}
                    <td className="p-3 text-right text-slate-300 font-mono">
                      {formatSom(product.unitCost)}
                    </td>

                    {/* Total Cost */}
                    <td className="p-3 text-right font-semibold text-slate-100 font-mono bg-slate-950/20">
                      {formatSom(metrics.totalCost)}
                    </td>

                    {/* Markup % */}
                    <td className="p-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        +{product.markupPercent}%
                      </span>
                    </td>

                    {/* Unit Selling Price */}
                    <td className="p-3 text-right font-bold text-slate-100 font-mono">
                      {formatSom(metrics.unitPrice)}
                    </td>

                    {/* Expected Revenue */}
                    <td className="p-3 text-right font-medium text-emerald-400 font-mono">
                      {formatSom(metrics.expectedRevenue)}
                    </td>

                    {/* Expected Net Profit */}
                    <td className="p-3 text-right font-bold text-teal-300 font-mono bg-teal-950/20">
                      +{formatSom(metrics.expectedProfit)}
                    </td>

                    {/* Date & Supplier */}
                    <td className="p-3 text-xs text-slate-300">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 truncate max-w-[140px]">
                          {product.supplier || "Do'kon ombori"}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">{product.date}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky / Real-time Total Summary Footer */}
          <tfoot>
            <tr className="bg-slate-950 text-slate-200 font-semibold text-xs sm:text-sm border-t-2 border-slate-800">
              <td className="p-3.5 text-center font-bold text-slate-300">JAMI</td>
              <td className="p-3.5 text-slate-400 text-xs font-mono">{totals.count} xil</td>
              <td className="p-3.5 font-bold text-slate-100" colSpan={3}>
                JAMI HISOBLANGAN KO'RSATKICHLAR
              </td>
              <td className="p-3.5 text-slate-400 text-xs text-right font-mono">Xarajat:</td>
              <td className="p-3.5 text-right font-mono text-amber-400 font-bold">
                {formatSom(totals.totalCost)}
              </td>
              <td className="p-3.5 text-center font-mono text-xs text-slate-300">
                O'rtacha: +{totals.avgMarkup}%
              </td>
              <td className="p-3.5 text-slate-400 text-xs text-right font-mono">Tushum:</td>
              <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                {formatSom(totals.totalRevenue)}
              </td>
              <td className="p-3.5 text-right font-mono text-teal-300 font-bold text-sm bg-teal-950/70">
                +{formatSom(totals.totalProfit)}
              </td>
              <td colSpan={2} className="p-3.5 text-xs text-slate-400 text-right">
                Sof foyda kafolatlangan
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
