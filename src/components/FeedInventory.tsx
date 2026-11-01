import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { FeedType } from '../types/farm';
import { formatCurrency } from '../i18n/translations';
import { AccuratePieChart, PieDataPoint } from './charts/AccuratePieChart';
import { Wheat, Plus, Trash2, DollarSign, Scale, PieChart as PieChartIcon, Layers } from 'lucide-react';

export const FeedInventory: React.FC<{ isOpenAddModal?: boolean; onCloseAddModal?: () => void; onOpenAddModal: () => void }> = ({
  onOpenAddModal
}) => {
  const { data, t, language, deleteFeedEntry } = useFarm();

  // Aggregated calculations
  const totalFeedKg = useMemo(() => {
    return data.feed.reduce((sum, f) => sum + (f.quantity || 0), 0);
  }, [data.feed]);

  const totalFeedCost = useMemo(() => {
    return data.feed.reduce((sum, f) => sum + (f.cost || 0), 0);
  }, [data.feed]);

  const avgCostPerKg = useMemo(() => {
    return totalFeedKg > 0 ? (totalFeedCost / totalFeedKg).toFixed(1) : '0';
  }, [totalFeedCost, totalFeedKg]);

  // Feed type breakdowns
  const typeBreakdown = useMemo(() => {
    const map: Record<string, { kg: number; cost: number }> = {};
    data.feed.forEach((f) => {
      if (!map[f.feedType]) map[f.feedType] = { kg: 0, cost: 0 };
      map[f.feedType].kg += f.quantity;
      map[f.feedType].cost += f.cost;
    });
    return map;
  }, [data.feed]);

  // Accurate Pie Chart Data for Feed
  const feedPieData: PieDataPoint[] = useMemo(() => {
    const shades = ['#064E3B', '#047857', '#10B981', '#6EE7B7'];
    return Object.entries(typeBreakdown).map(([type, val], idx) => ({
      label: type,
      value: val.cost,
      color: shades[idx % shades.length],
      subLabel: `${val.kg.toLocaleString()} kg`
    })).filter(p => p.value > 0);
  }, [typeBreakdown]);

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.feedInventory}</h1>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
            {language === 'bn' 
              ? 'খাদ্য ক্রয়, পুষ্টি উপকরণ ও প্রতি কেজির ব্যয় পর্যালোচনা' 
              : 'Feed procurement log, cost-per-kg analytics, and stored nutrition inventory'}
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.logFeed}</span>
        </button>
      </div>

      {/* KPI Metrics in Green & White Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Feed Procured</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {totalFeedKg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kg</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Recorded farm nutrition intake</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalCost}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(totalFeedCost, language)}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Cumulative feed investment</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t.costPerKg}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              ৳ {avgCostPerKg} <span className="text-sm font-normal text-slate-400">/ kg</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Weighted average procurement rate</p>
          </div>
        </div>
      </div>

      {/* Accurate Feed Expenditure Pie Chart & Category Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'খাদ্যের ব্যয় অনুপাত' : 'Feed Expense Allocation'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' ? 'দানাদার, ঘাস, খড় ও পুষ্টির শতকরা হিসাব' : 'Precise mathematical distribution of feed spending'}
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-emerald-700" />
          </div>

          <div className="py-2">
            <AccuratePieChart
              data={feedPieData}
              donut={true}
              size={240}
              currencyPrefix="৳ "
            />
          </div>

          <div className="pt-3 border-t border-emerald-50 text-xs text-slate-500">
            Realized feed consumption across {data.feed.length} purchase entries.
          </div>
        </div>

        {/* Category Cards (6 Cols) */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          {['Concentrates', 'Grass', 'Straw', 'Supplements'].map((typeKey, idx) => {
            const item = typeBreakdown[typeKey] || { kg: 0, cost: 0 };
            const staggerClass = `stagger-${idx + 1}`;
            return (
              <div key={typeKey} className={`bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between card-lift ${staggerClass}`}>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-emerald-900 uppercase tracking-wider block">{typeKey}</span>
                  <div className="mt-3 text-2xl font-black text-slate-900 tabular-nums">
                    {item.kg.toLocaleString()} <span className="text-sm font-normal text-slate-400">kg</span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-50 text-xs sm:text-sm font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(item.cost, language)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feed Purchase Ledger Table */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-xs overflow-hidden card-lift">
        <div className="p-5 border-b border-emerald-50 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
            {language === 'bn' ? 'খাদ্য ক্রয়ের সাম্প্রতিক খতিয়ান' : 'Feed Purchase Ledger'}
          </h3>
          <span className="text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {data.feed.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">{t.feedType}</th>
                <th className="py-3.5 px-5">{t.quantityKg}</th>
                <th className="py-3.5 px-5">{t.totalCost}</th>
                <th className="py-3.5 px-5">Rate (৳/kg)</th>
                <th className="py-3.5 px-5">{t.notes}</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm leading-relaxed">
              {data.feed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-slate-400">
                    {t.emptyFeedTitle}. {t.emptyFeedDesc}
                  </td>
                </tr>
              ) : (
                data.feed.map((f) => {
                  const rate = f.quantity > 0 ? (f.cost / f.quantity).toFixed(1) : '-';
                  return (
                    <tr key={f.id} className="table-row-hover">
                      <td className="py-4 px-5 text-slate-500 font-mono text-xs">{f.date}</td>
                      <td className="py-4 px-5 font-bold text-slate-900">{f.feedType}</td>
                      <td className="py-4 px-5 tabular-nums font-semibold">{f.quantity.toLocaleString()} kg</td>
                      <td className="py-4 px-5 tabular-nums font-bold text-slate-800">
                        {formatCurrency(f.cost, language)}
                      </td>
                      <td className="py-4 px-5 tabular-nums font-mono text-emerald-800 font-semibold">৳ {rate}</td>
                      <td className="py-4 px-5 text-slate-500 max-w-xs truncate leading-relaxed">{f.notes || '-'}</td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this feed purchase log?')) {
                              deleteFeedEntry(f.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition btn-interactive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
