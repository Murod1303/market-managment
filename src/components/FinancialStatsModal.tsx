import React, { useMemo } from 'react';
import {
  X,
  PieChart,
  FileText,
  Download,
  Award,
  Wallet,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Product } from '../types';
import { calculateProductMetrics, formatNumber, formatSom } from '../utils/formatters';
import { generateStorePdfReport } from '../utils/pdfGenerator';

interface FinancialStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const FinancialStatsModal: React.FC<FinancialStatsModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  if (!isOpen) return null;

  // Category distribution analysis
  const { categoryStats, topCostProducts, grandTotalCost, grandTotalRevenue, grandTotalProfit } =
    useMemo(() => {
      let costSum = 0;
      let revenueSum = 0;
      let profitSum = 0;

      const catMap: { [key: string]: { cost: number; revenue: number; profit: number; count: number } } =
        {};

      const itemsWithCost = products.map((p) => {
        const m = calculateProductMetrics(p);
        costSum += m.totalCost;
        revenueSum += m.expectedRevenue;
        profitSum += m.expectedProfit;

        const cat = p.category || 'Boshqa';
        if (!catMap[cat]) {
          catMap[cat] = { cost: 0, revenue: 0, profit: 0, count: 0 };
        }
        catMap[cat].cost += m.totalCost;
        catMap[cat].revenue += m.expectedRevenue;
        catMap[cat].profit += m.expectedProfit;
        catMap[cat].count += 1;

        return { ...p, calculatedTotalCost: m.totalCost, calculatedProfit: m.expectedProfit };
      });

      const categories = Object.entries(catMap).map(([category, data]) => ({
        category,
        cost: data.cost,
        revenue: data.revenue,
        profit: data.profit,
        count: data.count,
        percent: costSum > 0 ? ((data.cost / costSum) * 100).toFixed(1) : '0',
      })).sort((a, b) => b.cost - a.cost);

      const top5 = itemsWithCost
        .sort((a, b) => b.calculatedTotalCost - a.calculatedTotalCost)
        .slice(0, 5);

      return {
        categoryStats: categories,
        topCostProducts: top5,
        grandTotalCost: costSum,
        grandTotalRevenue: revenueSum,
        grandTotalProfit: profitSum,
      };
    }, [products]);

  const avgMarkup =
    products.length > 0
      ? (
          products.reduce((acc, p) => acc + (Number(p.markupPercent) || 0), 0) /
          products.length
        ).toFixed(1)
      : '0';

  // Handle PDF Download
  const handleDownloadPdf = () => {
    const doc = generateStorePdfReport(products, "Markaziy Savdo Do'koni");
    doc.save(`dokon_hisoboti_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-financial-stats"
        className="bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-800 overflow-hidden my-6 animate-scale-up text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80 text-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Moliyaviy Statistika va A4 PDF Hisobot
              </h3>
              <p className="text-xs text-slate-400">
                Xarajatlarning kategoriyalar kesimidagi taqsimoti va rasmiy PDF hisobot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              id="btn-download-pdf-modal-header"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition"
            >
              <Download className="w-4 h-4" />
              <span>A4 PDF Hisobot</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-amber-400" /> Jami Xarajat
              </span>
              <div className="text-sm sm:text-lg font-bold text-amber-400 mt-1 font-mono">
                {formatSom(grandTotalCost)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Kutilgan Savdo
              </span>
              <div className="text-sm sm:text-lg font-bold text-emerald-400 mt-1 font-mono">
                {formatSom(grandTotalRevenue)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> Kutilgan Sof Foyda
              </span>
              <div className="text-sm sm:text-lg font-bold text-teal-300 mt-1 font-mono">
                +{formatSom(grandTotalProfit)}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-sky-400" /> O'rtacha Ustama
              </span>
              <div className="text-sm sm:text-lg font-bold text-sky-300 mt-1 font-mono">
                +{avgMarkup}%
              </div>
            </div>
          </div>

          {/* Two-column layout: Category distribution & Top-5 Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category expenditure distribution */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  Kategoriyalar Kesimida Xarajat
                </h4>
                <span className="text-xs text-slate-400">{categoryStats.length} ta kategoriya</span>
              </div>

              <div className="space-y-3">
                {categoryStats.map((cat, idx) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-200 font-semibold">{cat.category}</span>
                      <span className="text-slate-400 font-mono">
                        {formatSom(cat.cost)} ({cat.percent}%)
                      </span>
                    </div>
                    {/* Visual Bar Indicator */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor:
                            idx === 0
                              ? '#10b981'
                              : idx === 1
                              ? '#0ea5e9'
                              : idx === 2
                              ? '#f59e0b'
                              : idx === 3
                              ? '#8b5cf6'
                              : '#64748b',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top-5 Highest Expenditure Products */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Eng Ko'p Xarajat Sarflangan Top-5 Tovar
                </h4>
                <span className="text-xs text-slate-400">Investitsiya bo'yicha</span>
              </div>

              <div className="space-y-2.5">
                {topCostProducts.map((prod, index) => {
                  const percentOfTotal =
                    grandTotalCost > 0
                      ? ((prod.calculatedTotalCost / grandTotalCost) * 100).toFixed(1)
                      : '0';

                  return (
                    <div
                      key={prod.id}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-100 truncate">
                            {prod.name}
                          </h5>
                          <span className="text-[11px] text-slate-400">
                            {formatNumber(prod.quantity)} {prod.unit} x {formatSom(prod.unitCost)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-slate-100 font-mono">
                          {formatSom(prod.calculatedTotalCost)}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          {percentOfTotal}% xarajat
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Official A4 PDF Action Section */}
          <div className="p-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Rasmiy A4 Formatidagi Chop Etish Hisoboti
                </h4>
                <p className="text-xs text-slate-400">
                  Kompaniya bosh hisobchisi va do'kon rahbari imzosi, tovarlar jadvallari va moliyaviy xulosa
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPdf}
              id="btn-download-pdf-modal-footer"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40 transition flex items-center justify-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>PDF Hisobotni Yuklab Olish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
