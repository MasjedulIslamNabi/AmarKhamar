import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { formatCurrency } from '../i18n/translations';
import { History, TrendingUp, TrendingDown, DollarSign, Archive, UserCheck, Calendar } from 'lucide-react';

export const HerdArchive: React.FC<{ onSelectCow: (cowId: string) => void }> = ({ onSelectCow }) => {
  const { data, t, language } = useFarm();

  const soldCattle = useMemo(() => {
    return data.cattle.filter((c) => c.status === 'Sold');
  }, [data.cattle]);

  // Aggregate stats
  const totalSalesRevenue = useMemo(() => {
    return data.sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
  }, [data.sales]);

  const totalSalesProfit = useMemo(() => {
    return data.sales.reduce((sum, s) => sum + (s.profitOrLoss || 0), 0);
  }, [data.sales]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs card-lift">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.archive}</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            {language === 'bn'
              ? 'খামার থেকে পূর্বে বিক্রীত সকল গবাদিপশুর বিস্তারিত অডিট রেকর্ড'
              : 'Complete audit trail of all departed and sold cattle with realized financial return.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-emerald-50 rounded-xl text-xs font-semibold text-slate-700 border border-emerald-100">
            Total Sold: <span className="tabular-nums font-bold text-slate-900">{soldCattle.length}</span>
          </div>
          <div className={`px-3.5 py-2 rounded-xl text-xs font-bold tabular-nums border ${totalSalesProfit >= 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            Profit: {formatCurrency(totalSalesProfit, language)}
          </div>
        </div>
      </div>

      {/* Sales & Archive Records List */}
      {data.sales.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-xs card-lift">
          <Archive className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
          <h3 className="text-base font-bold text-slate-900 mt-3">{t.emptySalesTitle}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t.emptySalesDesc}</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-xs overflow-hidden card-lift">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-3.5 px-4">{t.tagNumber}</th>
                  <th className="py-3.5 px-4">{t.breed}</th>
                  <th className="py-3.5 px-4">{t.saleDate}</th>
                  <th className="py-3.5 px-4">{t.buyerName}</th>
                  <th className="py-3.5 px-4">{t.purchasePrice}</th>
                  <th className="py-3.5 px-4">{t.salePrice}</th>
                  <th className="py-3.5 px-4 text-right">{t.profitOrLoss}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50 text-sm">
                {data.sales.map((s) => (
                  <tr key={s.id} className="table-row-hover">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      <button
                        onClick={() => onSelectCow(s.cowId)}
                        className="text-emerald-700 hover:text-emerald-900 hover:underline btn-interactive font-bold"
                      >
                        {s.tagNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{s.breed}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{s.date}</td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div>
                        <span className="font-semibold">{s.buyerName}</span>
                        {s.buyerContact && (
                          <span className="text-xs text-slate-500 block font-mono">{s.buyerContact}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                      {formatCurrency(s.purchasePrice || 0, language)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold tabular-nums">
                      {formatCurrency(s.salePrice, language)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black tabular-nums">
                      <span className={`inline-flex items-center gap-1 ${
                        s.profitOrLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {s.profitOrLoss >= 0 ? '+' : ''}{formatCurrency(s.profitOrLoss, language)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
