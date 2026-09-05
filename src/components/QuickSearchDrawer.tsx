import React, { useState } from 'react';
import { Search, X, Package, ArrowRight, TrendingUp, DollarSign, Calendar, Truck } from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatNumber, formatSom } from '../utils/formatters';

interface QuickSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const QuickSearchDrawer: React.FC<QuickSearchDrawerProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [query, setQuery] = useState('');
  const [sellQuantitySim, setSellQuantitySim] = useState<{ [id: string]: number }>({});

  if (!isOpen) return null;

  const trimmedQuery = query.toLowerCase().trim();
  const matchedProducts = products.filter((p) => {
    if (!trimmedQuery) return true;
    return (
      p.name.toLowerCase().includes(trimmedQuery) ||
      p.category.toLowerCase().includes(trimmedQuery) ||
      (p.supplier && p.supplier.toLowerCase().includes(trimmedQuery))
    );
  });

  const handleSimQuantityChange = (productId: string, val: number) => {
    setSellQuantitySim((prev) => ({
      ...prev,
      [productId]: Math.max(0, val),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div
        id="drawer-quick-search"
        className="w-full max-w-xl bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800 text-slate-100 animate-slide-left"
      >
        {/* Top Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Tezkor Tovar Qidiruvi</h3>
              <p className="text-xs text-slate-400">
                Tovar nomi bo'yicha qoldiq, tannarx va tavsiya etilgan sotish narxi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-quick-search-drawer"
              type="text"
              autoFocus
              placeholder="Masalan: Olma, Kartoshka, Shakar, Yog'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-900 text-slate-100 placeholder:text-slate-500 shadow-2xs"
            />
          </div>

          {/* Quick Suggestions */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto text-xs text-slate-400 scrollbar-none">
            <span className="shrink-0 font-medium text-slate-400">Tezkor namunalar:</span>
            {['Olma', 'Kartoshka', 'Shakar', 'Sut', 'Yog\'', 'Choy'].map((item) => (
              <button
                key={item}
                onClick={() => setQuery(item)}
                className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700/80 hover:bg-slate-700 text-slate-300 shrink-0 transition"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Natijalar: {matchedProducts.length} ta tovar</span>
            {trimmedQuery && <span>Qidiruv: "{trimmedQuery}"</span>}
          </div>

          {matchedProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">
                "{trimmedQuery}" nomli tovar topilmadi
              </p>
              <p className="text-xs text-slate-500">Boshqa so'z bilan qidirib ko'ring yoki yangi tovar kiriting.</p>
            </div>
          ) : (
            matchedProducts.map((prod) => {
              const m = calculateProductMetrics(prod);
              const customSimQty = sellQuantitySim[prod.id] ?? 1;
              const simRevenue = customSimQty * m.unitPrice;
              const simCost = customSimQty * prod.unitCost;
              const simProfit = simRevenue - simCost;

              return (
                <div
                  key={prod.id}
                  id={`quick-search-card-${prod.id}`}
                  className="bg-slate-950/70 rounded-2xl border border-slate-800 shadow-xs hover:border-emerald-500/50 transition p-4 space-y-3"
                >
                  {/* Title & Category Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-100 leading-tight">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-medium border border-slate-700">
                          {prod.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-500" />
                          {prod.supplier}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                        Ustama
                      </span>
                      <div className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        +{prod.markupPercent}%
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Kelgan Miqdori
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5 font-mono">
                        {formatNumber(prod.quantity)} {prod.unit}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        1 Birlik Tannarxi
                      </span>
                      <div className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5 font-mono">
                        {formatSom(prod.unitCost)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                        Sotish Narxi
                      </span>
                      <div className="text-xs sm:text-sm font-extrabold text-emerald-400 mt-0.5 font-mono">
                        {formatSom(m.unitPrice)}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-teal-500/30">
                      <span className="text-[10px] text-teal-400 uppercase font-semibold">
                        Jami Sof Foyda
                      </span>
                      <div className="text-xs sm:text-sm font-extrabold text-teal-300 mt-0.5 font-mono">
                        +{formatSom(m.expectedProfit)}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Sales Calculator Widget inside card */}
                  <div className="mt-2 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        Tezkor savdo hisoblagichi:
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Miqdor:</span>
                        <input
                          type="number"
                          min="1"
                          max={prod.quantity}
                          value={customSimQty}
                          onChange={(e) =>
                            handleSimQuantityChange(prod.id, Number(e.target.value))
                          }
                          className="w-14 px-1.5 py-0.5 text-xs text-center font-bold bg-slate-950 text-slate-100 border border-slate-700 rounded-lg"
                        />
                        <span className="text-slate-400 font-medium">{prod.unit}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-slate-300">
                      <div>
                        Xaridor to'laydi: <b className="text-emerald-400 font-mono">{formatSom(simRevenue)}</b>
                      </div>
                      <div>
                        Sof foyda: <b className="text-teal-300 font-mono">+{formatSom(simProfit)}</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
