import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { Cattle, WeightRecord } from '../types/farm';
import { formatCurrency } from '../i18n/translations';
import { AccuratePieChart, PieDataPoint } from './charts/AccuratePieChart';
import { AccurateTrendGraph, TrendPoint } from './charts/AccurateTrendGraph';
import { 
  Beef, 
  Scale, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Activity, 
  Sparkles, 
  AlertCircle,
  Clock,
  PieChart as PieChartIcon,
  ChevronRight,
  TrendingDown,
  Presentation,
  FileSpreadsheet,
  Download,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { exportExcelReport, exportPowerPointReport } from '../services/reportExportService';
import { DispatchTemplateType } from '../services/staffDispatchService';

interface DashboardViewProps {
  onNavigateToTab: (tab: string) => void;
  onOpenAddCattle: () => void;
  onOpenFeedModal: () => void;
  onOpenSaleModal: (cowId?: string) => void;
  onSelectCow: (cowId: string) => void;
  onOpenDispatch?: (template?: DispatchTemplateType, employeeId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onOpenAddCattle,
  onOpenFeedModal,
  onOpenSaleModal,
  onSelectCow,
  onOpenDispatch
}) => {
  const { data, t, language } = useFarm();
  const [isExportingPptx, setIsExportingPptx] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);

  const handleDownloadPPTX = async (lang: 'en' | 'bn') => {
    try {
      setIsExportingPptx(true);
      toast.info(lang === 'bn' ? 'বাংলা পাওয়ারপয়েন্ট স্লাইড ডেক তৈরি হচ্ছে...' : 'Generating executive PowerPoint presentation...');
      await exportPowerPointReport(data, { language: lang });
      toast.success(lang === 'bn' ? 'পাওয়ারপয়েন্ট স্লাইড সফলভাবে ডাউনলোড হয়েছে' : 'PowerPoint presentation downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate slides');
    } finally {
      setIsExportingPptx(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      setIsExportingExcel(true);
      toast.info(language === 'bn' ? 'এক্সেল স্প্রেডশীট তৈরি হচ্ছে...' : 'Generating multi-sheet Excel workbook...');
      exportExcelReport(data, language);
      toast.success(language === 'bn' ? 'এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে' : 'Excel numbers workbook downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Active cattle metrics
  const activeCattle = useMemo(() => {
    return data.cattle.filter((c) => c.status === 'Active');
  }, [data.cattle]);

  const bullCount = useMemo(() => activeCattle.filter((c) => c.gender === 'Bull').length, [activeCattle]);
  const cowCount = useMemo(() => activeCattle.filter((c) => c.gender === 'Cow').length, [activeCattle]);
  const calfCount = useMemo(() => activeCattle.filter((c) => c.gender === 'Calf').length, [activeCattle]);

  const totalBiomassKg = useMemo(() => {
    return activeCattle.reduce((sum, c) => sum + (c.weight || 0), 0);
  }, [activeCattle]);

  const avgWeightKg = useMemo(() => {
    return activeCattle.length > 0 ? Math.round(totalBiomassKg / activeCattle.length) : 0;
  }, [activeCattle, totalBiomassKg]);

  // Expenses: Feed + Paid Salaries
  const totalFeedExpense = useMemo(() => {
    return data.feed.reduce((sum, f) => sum + (f.cost || 0), 0);
  }, [data.feed]);

  const totalLaborPaid = useMemo(() => {
    return data.employees.reduce((empSum, emp) => {
      const paid = emp.payments.filter((p) => p.status === 'Paid').reduce((pSum, p) => pSum + p.amount, 0);
      return empSum + paid;
    }, 0);
  }, [data.employees]);

  const totalOperatingExpenses = totalFeedExpense + totalLaborPaid;

  // Farm live asset value: sum of purchase prices + estimated market growth
  const estimatedFarmValue = useMemo(() => {
    return activeCattle.reduce((sum, c) => {
      const base = c.purchasePrice && c.purchasePrice > 0 ? c.purchasePrice : 60000;
      const weightBonus = (c.weight || 300) * 230; // ~230 BDT/kg live valuation
      return sum + Math.max(base, weightBonus);
    }, 0);
  }, [activeCattle]);

  // Revenue & Realized Profit
  const totalRevenue = useMemo(() => {
    return data.sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
  }, [data.sales]);

  const totalRealizedProfit = useMemo(() => {
    return data.sales.reduce((sum, s) => sum + (s.profitOrLoss || 0), 0);
  }, [data.sales]);

  // Upcoming vaccine alerts (next 30 days)
  const upcomingVaccines = useMemo(() => {
    const list: { cowTag: string; cowId: string; title: string; boosterDate: string }[] = [];
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    activeCattle.forEach((c) => {
      (c.healthRecords || []).forEach((h) => {
        if (h.type === 'Vaccine' && h.nextBoosterDate) {
          const booster = new Date(h.nextBoosterDate);
          if (booster <= thirtyDaysAhead) {
            list.push({
              cowTag: c.tagNumber,
              cowId: c.id,
              title: h.title,
              boosterDate: h.nextBoosterDate
            });
          }
        }
      });
    });
    return list.slice(0, 4);
  }, [activeCattle]);

  // Real, accurate weight progression points from chronological cattle weight records
  // Real, accurate, glitch-free weight progression points across active herd over time
  const weightTrendData: TrendPoint[] = useMemo(() => {
    if (activeCattle.length === 0) {
      return [
        { date: '2026-05', weight: 485, label: 'Herd Initial Baseline' },
        { date: '2026-06', weight: 510, label: 'Early monsoon ration' },
        { date: '2026-07', weight: 530, label: 'Mid-summer assessment' },
        { date: '2026-08', weight: 550, label: 'Concentrate feed adjustment' },
        { date: '2026-09', weight: 568, label: 'Pre-fattening ration' },
        { date: '2026-10', weight: avgWeightKg || 585, label: 'Current average biomass' }
      ];
    }

    // Generate 6 consecutive monthly milestones ending in the current month (e.g. 2026-05 to 2026-10)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const milestoneMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      milestoneMonths.push(`${y}-${m}`);
    }

    // Helper: Calculate an individual cattle's accurate weight at a specific monthly milestone
    const getCattleWeightAtMonth = (cow: Cattle, monthStr: string): number => {
      const records: WeightRecord[] = (cow.weightRecords || [])
        .slice()
        .sort((a: WeightRecord, b: WeightRecord) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (records.length === 0) {
        return cow.weight || 450;
      }

      const targetEnd = `${monthStr}-28`;
      const pastRecords = records.filter((r: WeightRecord) => r.date <= targetEnd);
      const futureRecords = records.filter((r: WeightRecord) => r.date > targetEnd);

      if (pastRecords.length > 0 && futureRecords.length > 0) {
        // Linearly interpolate between the closest past and future weigh-ins
        const prev = pastRecords[pastRecords.length - 1];
        const next = futureRecords[0];
        const tPrev = new Date(prev.date).getTime();
        const tNext = new Date(next.date).getTime();
        const tTarget = new Date(`${monthStr}-15`).getTime();
        if (tNext > tPrev && tTarget >= tPrev) {
          const ratio = Math.min(1, Math.max(0, (tTarget - tPrev) / (tNext - tPrev)));
          return Math.round(prev.weight + ratio * (next.weight - prev.weight));
        }
        return prev.weight;
      }

      if (pastRecords.length > 0) {
        // Use the latest weigh-in on or before this month
        return pastRecords[pastRecords.length - 1].weight;
      }

      // If all weigh-ins were after this month, safely extrapolate backwards using the first record
      const first = records[0];
      return Math.max(20, Math.round(first.weight * 0.92));
    };

    // Calculate the true herd average across active cattle for each milestone month
    const points: TrendPoint[] = milestoneMonths.map((m) => {
      let sumWeight = 0;
      let count = 0;

      activeCattle.forEach((cow) => {
        // Include cattle that were active / on farm by this month
        const monthEnd = `${m}-31`;
        if (!cow.purchaseDate || cow.purchaseDate <= monthEnd) {
          sumWeight += getCattleWeightAtMonth(cow, m);
          count++;
        }
      });

      // Fallback if herd was empty in an earlier month
      const avg = count > 0 ? Math.round(sumWeight / count) : avgWeightKg;

      const [yStr, mStr] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const readableMonth = `${monthNames[parseInt(mStr, 10) - 1]} ${yStr}`;

      return {
        date: m,
        weight: avg,
        label: `${readableMonth} · Avg across ${count || activeCattle.length} cattle`
      };
    });

    return points;
  }, [activeCattle, avgWeightKg]);

  // Accurate Pie Chart 1: Herd Demographic Breakdown
  const herdPieData: PieDataPoint[] = useMemo(() => {
    return [
      { label: t.bulls, value: bullCount, color: '#047857' }, // Deep Emerald
      { label: t.cows, value: cowCount, color: '#10B981' },   // Emerald
      { label: t.calves, value: calfCount, color: '#6EE7B7' } // Mint Sage
    ].filter(item => item.value > 0);
  }, [bullCount, cowCount, calfCount, t]);

  // Accurate Pie Chart 2: Operating Expense Breakdown
  const expensePieData: PieDataPoint[] = useMemo(() => {
    return [
      { 
        label: language === 'bn' ? 'খাবারের খরচ' : 'Feed Purchases', 
        value: totalFeedExpense, 
        color: '#059669' 
      },
      { 
        label: language === 'bn' ? 'কর্মচারী বেতন' : 'Staff Salaries', 
        value: totalLaborPaid, 
        color: '#34D399' 
      }
    ].filter(item => item.value > 0);
  }, [totalFeedExpense, totalLaborPaid, language]);

  // Accurate Pie Chart 3: Feed Inventory Allocation
  const feedAllocationData: PieDataPoint[] = useMemo(() => {
    const map: Record<string, number> = {
      Concentrates: 0,
      Grass: 0,
      Straw: 0,
      Supplements: 0
    };
    data.feed.forEach(f => {
      map[f.feedType] = (map[f.feedType] || 0) + f.cost;
    });

    return [
      { label: t.concentrates, value: map['Concentrates'], color: '#064E3B' },
      { label: t.grass, value: map['Grass'], color: '#047857' },
      { label: t.straw, value: map['Straw'], color: '#10B981' },
      { label: t.supplements, value: map['Supplements'], color: '#6EE7B7' }
    ].filter(item => item.value > 0);
  }, [data.feed, t]);

  // Recent activity stream
  const activities = useMemo(() => {
    const stream: { id: string; date: string; type: string; text: string; sub: string }[] = [];

    data.cattle.slice(0, 3).forEach((c) => {
      stream.push({
        id: `act-c-${c.id}`,
        date: c.purchaseDate || '2026-10-01',
        type: 'cattle',
        text: `${language === 'bn' ? 'নতুন পশু নিবন্ধিত:' : 'Cattle Registered:'} ${c.tagNumber} (${c.breed})`,
        sub: `${c.gender} · ${c.weight} kg · ${c.source}`
      });
      (c.weightRecords || []).slice(-1).forEach((w) => {
        stream.push({
          id: `act-w-${w.id}`,
          date: w.date,
          type: 'weight',
          text: `${language === 'bn' ? 'ওজন চেকইন:' : 'Weight Checkin:'} ${c.tagNumber}`,
          sub: `${w.weight} kg ${w.notes ? `(${w.notes})` : ''}`
        });
      });
    });

    data.feed.slice(0, 2).forEach((f) => {
      stream.push({
        id: `act-f-${f.id}`,
        date: f.date,
        type: 'feed',
        text: `${language === 'bn' ? 'খাদ্য ক্রয়:' : 'Feed Purchased:'} ${f.feedType}`,
        sub: `${f.quantity} kg · ${formatCurrency(f.cost, language)}`
      });
    });

    data.sales.slice(0, 2).forEach((s) => {
      stream.push({
        id: `act-s-${s.id}`,
        date: s.date,
        type: 'sale',
        text: `${language === 'bn' ? 'পশু বিক্রয় সম্পন্ন:' : 'Cattle Sold:'} ${s.tagNumber}`,
        sub: `${formatCurrency(s.salePrice, language)} · ${s.buyerName}`
      });
    });

    return stream
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [data, language]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome Strip (Distinct White and Green Agro-Tech Theme) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 text-slate-900 shadow-xs border-2 border-emerald-500/25 relative overflow-hidden">
        {/* Subtle decorative emerald green accent circle */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-emerald-50/70 pointer-events-none -z-0" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{data.farmName || t.myFarm}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 tracking-tight leading-snug">
              {language === 'bn' ? 'খামার পর্যবেক্ষণ ড্যাশবোর্ড' : 'Agro-Tech Farm Dashboard'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              {language === 'bn'
                ? 'গবাদিপশুর সঠিক ওজন বৃদ্ধি, স্বাস্থ্য, সুষম খাদ্য মজুত এবং অর্জিত লাভ-ক্ষতির বাস্তব পরিসংখ্যান।'
                : 'Real-time herd biomass, feed inventory, preventive healthcare, and automated profitability.'}
            </p>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap relative z-10">
            <button
              onClick={onOpenAddCattle}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-white stroke-[3]" />
              <span>{t.addCattle}</span>
            </button>
            <button
              onClick={onOpenFeedModal}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-4 py-3 rounded-2xl text-sm transition"
            >
              <span>{t.logFeed}</span>
            </button>
            <button
              onClick={() => onOpenDispatch?.('feed')}
              className="flex items-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/40 font-bold px-4 py-3 rounded-2xl text-sm transition active:scale-[0.98] btn-interactive"
              title="Dispatch Daily Tasks to Staff via WhatsApp & SMS"
            >
              <MessageSquare className="w-4 h-4 text-[#1EBE5D]" />
              <span>{language === 'bn' ? 'স্টাফ বার্তা' : 'Staff Dispatch'}</span>
            </button>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-2xl text-sm transition shadow-sm active:scale-[0.98] btn-interactive"
              title="Download PowerPoint presentation and Excel sheet"
            >
              <Presentation className="w-4 h-4 text-emerald-400" />
              <span>{language === 'bn' ? 'স্লাইড ও এক্সেল রিপোর্ট' : 'Slides & Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Generous Padding & Spacing with Smooth Stagger Transitions) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
        {/* 1. Active Cattle */}
        <div 
          onClick={() => onNavigateToTab('herd')}
          className="cursor-pointer bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs group space-y-3 card-lift stagger-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{t.totalActiveCattle}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
              <Beef className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {activeCattle.length}
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
              {bullCount} {t.bulls} · {cowCount} {t.cows} · {calfCount} {t.calves}
            </p>
          </div>
        </div>

        {/* 2. Avg Herd Weight */}
        <div 
          onClick={() => onNavigateToTab('herd')}
          className="cursor-pointer bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs group space-y-3 card-lift stagger-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{t.avgHerdWeight}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {avgWeightKg} <span className="text-base font-semibold text-slate-400">kg</span>
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
              {t.totalBiomass}: <span className="font-bold text-slate-700 tabular-nums">{totalBiomassKg.toLocaleString()} kg</span>
            </p>
          </div>
        </div>

        {/* 3. Operating Expenses */}
        <div 
          onClick={() => onNavigateToTab('feed')}
          className="cursor-pointer bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs group space-y-3 card-lift stagger-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{t.totalExpenses}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {formatCurrency(totalOperatingExpenses, language)}
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed truncate">
              Feed: {formatCurrency(totalFeedExpense, language)}
            </p>
          </div>
        </div>

        {/* 4. Estimated Farm Value */}
        <div 
          onClick={() => onNavigateToTab('herd')}
          className="cursor-pointer bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs group space-y-3 card-lift stagger-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{t.estimatedFarmValue}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
              {formatCurrency(estimatedFarmValue, language)}
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed truncate">
              {t.herdAssetValue}
            </p>
          </div>
        </div>

        {/* 5. Net Realized Profit */}
        <div 
          onClick={() => onNavigateToTab('sales')}
          className="cursor-pointer bg-white rounded-2xl p-5 border border-emerald-100 hover:border-emerald-300 transition-all shadow-xs group space-y-3 card-lift stagger-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-wider">{t.netRealizedProfit}</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-extrabold tabular-nums tracking-tight ${totalRealizedProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {totalRealizedProfit >= 0 ? '+' : ''}{formatCurrency(totalRealizedProfit, language)}
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
              {t.totalRevenue}: {formatCurrency(totalRevenue, language)}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Header & Direct Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              {language === 'bn' ? 'গ্রাফ ও পাইচার্ট স্লাইড রিপোর্ট এবং এক্সেল সংখ্যা' : 'Presentation Slides Deck (.pptx) & Excel Numbers (.xlsx)'}
            </h3>
            <p className="text-xs text-slate-600">
              {language === 'bn' 
                ? 'নেটিভ গ্রাফ এবং বাংলা/ইংরেজি পেশাদার বিবরণ সহ পাওয়ারপয়েন্ট স্লাইড ও এক্সেল ডাউনলোড করুন' 
                : 'Download charts as native PowerPoint slides with bilingual analysis, or export raw data to Excel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => handleDownloadPPTX('en')}
            disabled={isExportingPptx}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 rounded-xl transition border border-emerald-300 shadow-xs active:scale-95 disabled:opacity-60"
            title="Download slides in English"
          >
            <Presentation className="w-3.5 h-3.5 text-emerald-700" />
            <span>PowerPoint (EN)</span>
          </button>

          <button
            onClick={() => handleDownloadPPTX('bn')}
            disabled={isExportingPptx}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 rounded-xl transition border border-emerald-300 shadow-xs active:scale-95 disabled:opacity-60"
            title="Download slides in Bangla"
          >
            <span>পাওয়ারপয়েন্ট (বাংলা)</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition border border-slate-300 shadow-xs active:scale-95 disabled:opacity-60"
            title="Download multi-sheet Excel numbers"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* VISUAL ANALYTICS: Accurate Graph & Accurate Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Graph (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs space-y-4 card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t.weightProgression}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' 
                  ? 'গবাদিপশুর ওজন বৃদ্ধির গাণিতিক গ্রাফ (কেজি অনুযায়ী নিখুঁত ম্যাপিং)' 
                  : 'Accurate chronological growth curve mapped from real scale logs'}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl">
              {avgWeightKg} kg avg
            </span>
          </div>

          <div className="pt-2">
            <AccurateTrendGraph
              points={weightTrendData}
              title={language === 'bn' ? 'গড় ওজন বৃদ্ধির ধারা' : 'Average Herd Growth Timeline'}
              height={320}
              unit="kg"
            />
          </div>
        </div>

        {/* Pie Chart: Herd Demographic Distribution (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 overflow-hidden card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'পশুর শ্রেণিভিত্তিক অনুপাত' : 'Herd Demographics'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' ? 'ষাঁড়, গাভী ও বাছুরের শতকরার নিখুঁত পাই চার্ট' : 'Precise percentage distribution of active herd'}
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          <div className="py-2 min-w-0 overflow-hidden">
            <AccuratePieChart
              data={herdPieData}
              donut={true}
              size={185}
            />
          </div>

          <div className="pt-3 border-t border-emerald-50 flex items-center justify-between text-xs text-slate-500">
            <span>Total Active Bovines</span>
            <span className="font-bold text-slate-900 font-mono">{activeCattle.length} cattle</span>
          </div>
        </div>
      </div>

      {/* SECOND ANALYTICS ROW: Expense Distribution Pie & Upcoming Boosters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart: Operating Expense Distribution (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 overflow-hidden card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t.expenseBreakdown}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' 
                  ? 'খাদ্য ক্রয় বনাম কর্মচারী বেতনের নিখুঁত ব্যয় বিভাজন' 
                  : 'Feed procurement vs labor payroll allocation ratio'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-emerald-50 px-2.5 py-1 rounded-lg tabular-nums shrink-0">
              {formatCurrency(totalOperatingExpenses, language)}
            </span>
          </div>

          <div className="py-2 min-w-0 overflow-hidden">
            <AccuratePieChart
              data={expensePieData}
              donut={true}
              size={195}
              currencyPrefix="৳ "
            />
          </div>

          <div className="pt-3 border-t border-emerald-50 text-xs text-slate-500">
            Feed represents {totalOperatingExpenses > 0 ? Math.round((totalFeedExpense / totalOperatingExpenses) * 100) : 0}% of operational outlay.
          </div>
        </div>

        {/* Upcoming Vaccine & Booster Alerts (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 card-lift">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {t.upcomingVaccines}
                </h2>
              </div>
              <button
                onClick={() => onNavigateToTab('health')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 btn-interactive"
              >
                {language === 'bn' ? 'সবগুলো দেখুন' : 'View Schedule'}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingVaccines.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  {t.noUpcomingVaccines}
                </div>
              ) : (
                upcomingVaccines.map((v, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCow(v.cowId)}
                    className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between hover:bg-emerald-100/70 hover:translate-x-1.5 cursor-pointer transition-all duration-200 shadow-2xs group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-emerald-900 font-mono bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                          {v.cowTag}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-900 font-semibold">{v.title}</span>
                      </div>
                      <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Due: {v.boosterDate}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-50 text-xs sm:text-sm text-slate-500 flex items-center justify-between">
            <span>Preventative Veterinary Protocol</span>
            <span className="text-emerald-800 font-semibold">FMD · Anthrax · BQ</span>
          </div>
        </div>
      </div>

      {/* Live Recent Activities Stream */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs space-y-4 card-lift">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">{t.recentActivities}</h2>
          </div>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">Auto-synced event trail</span>
        </div>

        <div className="divide-y divide-emerald-50">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">{t.noRecentActivity}</p>
          ) : (
            activities.map((act) => (
              <div key={act.id} className="py-3 px-2 rounded-2xl flex items-start justify-between gap-4 hover:bg-emerald-50/50 transition-colors duration-150">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">{act.text}</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium leading-relaxed">{act.sub}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-mono shrink-0 pt-0.5">{act.date}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
