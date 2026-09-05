import React from 'react';
import { TrendingUp, DollarSign, Wallet, Percent, ArrowUpRight, Package } from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatSom } from '../utils/formatters';

interface KpiCardsProps {
  products: Product[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ products }) => {
  let totalCost = 0;
  let totalRevenue = 0;
  let totalProfit = 0;

  products.forEach((p) => {
    const m = calculateProductMetrics(p);
    totalCost += m.totalCost;
    totalRevenue += m.expectedRevenue;
    totalProfit += m.expectedProfit;
  });

  const avgMarkup =
    products.length > 0
      ? (
          products.reduce((sum, p) => sum + (Number(p.markupPercent) || 0), 0) /
          products.length
        ).toFixed(1)
      : '0';

  const profitMargin =
    totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Jami Xarajat (Investitsiya) */}
      <div
        id="kpi-card-total-cost"
        className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Jami Xarajat (Tannarx)
          </span>
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:scale-105 transition">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            {formatSom(totalCost)}
          </div>
          <div className="mt-1.5 flex items-center text-xs text-slate-400 gap-1.5">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span>{products.length} xil tovar zaxirada</span>
          </div>
        </div>
      </div>

      {/* KPI 2: Kutilayotgan Umumiy Savdo (Tushum) */}
      <div
        id="kpi-card-total-revenue"
        className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/30 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/30 shadow-lg hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kutilayotgan Savdo (Tushum)
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
            {formatSom(totalRevenue)}
          </div>
          <div className="mt-1.5 flex items-center text-xs text-emerald-400/90 gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>To'liq sotilgandagi umumiy aylanma</span>
          </div>
        </div>
      </div>

      {/* KPI 3: Kutilayotgan Sof Foyda */}
      <div
        id="kpi-card-total-profit"
        className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-teal-950/30 backdrop-blur-sm rounded-2xl p-5 border border-teal-500/30 shadow-lg hover:border-teal-500/50 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kutilayotgan Sof Foyda
          </span>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-teal-300 tracking-tight">
            {formatSom(totalProfit)}
          </div>
          <div className="mt-1.5 flex items-center text-xs text-teal-300/90 gap-1.5 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px]">
              {profitMargin}% marja
            </span>
            <span className="text-slate-400">Sof foyda prognozi</span>
          </div>
        </div>
      </div>

      {/* KPI 4: O'rtacha Ustama Foizi */}
      <div
        id="kpi-card-avg-markup"
        className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/80 shadow-lg hover:border-sky-500/40 transition-all duration-300 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            O'rtacha Ustama Foizi
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition">
            <Percent className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            +{avgMarkup}%
          </div>
          <div className="mt-1.5 flex items-center text-xs text-slate-400 gap-1">
            <span>Tannarx ustiga qo'yilgan o'rtacha ustama</span>
          </div>
        </div>
      </div>
    </div>
  );
};
