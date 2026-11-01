import React, { useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import { formatCurrency } from '../i18n/translations';
import { 
  Printer, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Database, 
  RefreshCw, 
  Presentation,
  FileCheck,
  Languages,
  Sparkles,
  PieChart as PieIcon,
  LineChart as LineIcon,
  ShieldAlert,
  Trash2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { exportExcelReport, exportPowerPointReport } from '../services/reportExportService';
import { SecurityResetModal } from './SecurityResetModal';

export const ReportsBackup: React.FC = () => {
  const { data, t, language, exportJson, restoreJson } = useFarm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExportingPptxEn, setIsExportingPptxEn] = React.useState(false);
  const [isExportingPptxBn, setIsExportingPptxBn] = React.useState(false);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [showResetModal, setShowResetModal] = React.useState(false);
  const [resetModalMode, setResetModalMode] = React.useState<'wipe' | 'demo'>('wipe');

  // Financial aggregates
  const totalSalesRevenue = data.sales.reduce((sum, s) => sum + (s.salePrice || 0), 0);
  const totalCattlePurchase = data.cattle.reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
  const totalFeedExpense = data.feed.reduce((sum, f) => sum + (f.cost || 0), 0);
  const totalPayrollPaid = data.employees.reduce((empSum, emp) => {
    return empSum + emp.payments.filter(p => p.status === 'Paid').reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);
  const totalRealizedProfit = data.sales.reduce((sum, s) => sum + (s.profitOrLoss || 0), 0);

  const handleDownloadExcel = () => {
    try {
      setIsExportingExcel(true);
      toast.info(language === 'bn' ? 'এক্সেল স্প্রেডশীট তৈরি হচ্ছে...' : 'Generating multi-sheet Excel workbook...');
      exportExcelReport(data, language);
      toast.success(language === 'bn' ? 'এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে' : 'Excel workbook downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel report');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadPowerPoint = async (lang: 'en' | 'bn') => {
    try {
      if (lang === 'bn') setIsExportingPptxBn(true);
      else setIsExportingPptxEn(true);

      toast.info(lang === 'bn' ? 'বাংলা পাওয়ারপয়েন্ট স্লাইড ডেক তৈরি হচ্ছে...' : 'Generating executive PowerPoint presentation deck...');
      await exportPowerPointReport(data, { language: lang });
      toast.success(lang === 'bn' ? 'পাওয়ারপয়েন্ট স্লাইড সফলভাবে ডাউনলোড হয়েছে' : 'PowerPoint presentation downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PowerPoint presentation');
    } finally {
      setIsExportingPptxEn(false);
      setIsExportingPptxBn(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCensusCSV = () => {
    const headers = ['Tag Number', 'Breed', 'Gender', 'Current Weight (kg)', 'Source', 'Purchase Date', 'Purchase Price (BDT)', 'Status', 'Weight Logs Count', 'Medical Records Count'];
    const rows = data.cattle.map((c) => [
      c.tagNumber,
      c.breed,
      c.gender,
      c.weight,
      c.source,
      c.purchaseDate || '',
      c.purchasePrice || 0,
      c.status,
      (c.weightRecords || []).length,
      (c.healthRecords || []).length
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amar_khamar_herd_census_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Herd census CSV downloaded');
  };

  const handleExportFinancialCSV = () => {
    const headers = ['Metric', 'Amount (BDT)', 'Notes'];
    const rows = [
      ['Total Sales Revenue', totalSalesRevenue, `${data.sales.length} animals sold`],
      ['Total Cattle Acquisition Cost', totalCattlePurchase, `${data.cattle.length} animals acquired`],
      ['Feed & Nutrition Expenses', totalFeedExpense, `${data.feed.length} feed entries`],
      ['Labor & Staff Payroll Disbursed', totalPayrollPaid, `${data.employees.length} employees`],
      ['Net Realized Cattle Profit', totalRealizedProfit, 'Sales Price minus Purchase Price']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amar_khamar_financial_pnl_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Financial P&L CSV downloaded');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        restoreJson(parsed);
      } catch {
        toast.error(t.invalidFile);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs print:hidden card-lift">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.reports}</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
            {language === 'bn' 
              ? 'মুদ্রণযোগ্য খামার বিবরণী, CSV এক্সপোর্ট এবং অফলাইন ডাটা ব্যাকআপ' 
              : 'Print-ready summaries, CSV ledger downloads, and offline JSON backup & restore.'}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printReport}</span>
        </button>
      </div>

      {/* Executive PowerPoint & Excel Reports Showcase (Print Hidden) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
        {/* 1. PowerPoint Presentation Card */}
        <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-emerald-500/20 shadow-xs relative overflow-hidden card-lift space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-bl-full pointer-events-none -z-0" />
          
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                    {language === 'bn' ? 'পাওয়ারপয়েন্ট স্লাইড প্রেজেন্টেশন (.pptx)' : 'PowerPoint Slide Deck (.pptx)'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {language === 'bn' ? 'নেটিভ চার্ট এবং পেশাদার বিশ্লেষণ সহ পূর্ণাঙ্গ প্রেজেন্টেশন' : '16:9 Widescreen · Native Vector Charts · Bilingual'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Multi-Slide</span>
            </span>
          </div>

          <p className="relative z-10 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {language === 'bn' 
              ? 'খামারের গড় ওজন বৃদ্ধির টাইমলাইন এবং পশুপালের জাত বিন্যাসের পাইচার্ট সহ একাধিক স্লাইড তৈরি হবে। প্রতিটি গ্রাফের বিস্তারিত ও পেশাদার ব্যাখ্যা বাংলা ও ইংরেজি উভয় ভাষায় উপলব্ধ।'
              : 'Generates an executive presentation deck containing native PowerPoint line and doughnut charts, financial P&L breakdown, and professional agricultural analysis in your chosen language.'}
          </p>

          {/* Slide Deck Index Preview */}
          <div className="relative z-10 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'প্রেজেন্টেশনে অন্তর্ভুক্ত স্লাইডসমূহ:' : 'Included Presentation Slides & Charts:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Slide 1: Farm Executive Accreditation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Slide 2: Financial Statement & KPIs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <LineIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Slide 3: Growth Timeline (Native Line Graph + ADG Analysis)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PieIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-800">Slide 4: Herd Demographics (Native Doughnut + Breed Review)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PieIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Slide 5: Feed & OpEx Allocation Chart</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Slide 6: Healthcare & Strategic Outlook</span>
              </div>
            </div>
          </div>

          {/* Download Action Buttons: English & Bangla */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              onClick={() => handleDownloadPowerPoint('en')}
              disabled={isExportingPptxEn}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-3 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive disabled:opacity-60"
            >
              <Presentation className="w-4 h-4" />
              <span>{isExportingPptxEn ? 'Generating...' : 'Download English PPTX'}</span>
            </button>

            <button
              onClick={() => handleDownloadPowerPoint('bn')}
              disabled={isExportingPptxBn}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold px-4 py-3 rounded-2xl text-xs transition border border-emerald-300 active:scale-[0.98] btn-interactive disabled:opacity-60"
            >
              <Languages className="w-4 h-4 text-emerald-700" />
              <span>{isExportingPptxBn ? 'তৈরি হচ্ছে...' : 'বাংলা সংস্করণ PPTX'}</span>
            </button>
          </div>
        </div>

        {/* 2. Excel Numbers Workbook Card */}
        <div className="bg-white rounded-3xl p-6 md:p-7 border border-emerald-200/80 shadow-xs relative overflow-hidden card-lift space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full pointer-events-none -z-0" />
          
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                  {language === 'bn' ? 'খাতভিত্তিক ব্যয়ের পূর্ণাঙ্গ এক্সেল রিপোর্ট (.xlsx)' : 'Category Spending & Numbers Workbook (.xlsx)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {language === 'bn' ? 'পাওয়ারপয়েন্ট স্লাইডের নিখুঁত গাণিতিক প্রতিফলন · ৭টি সুবিন্যস্ত শীট' : 'Pure Clean Numbers · Mirror of PowerPoint Deck in 7 Sheets'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <span>7 Sheets</span>
            </span>
          </div>

          <p className="relative z-10 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {language === 'bn'
              ? 'ব্যবহারকারী কোন খাতে কত টাকা ব্যয় করছেন তার সুনির্দিষ্ট পরিসংখ্যান—পাওয়ারপয়েন্ট স্লাইড ও চার্টসমূহের নিখুঁত গাণিতিক বিবরণী খুব স্পষ্টভাবে প্রতিটি শীটে উপস্থাপন করা হয়েছে।'
              : 'Detailed breakdown of exactly how much you are spending in each category (Feed rations, Staff wages, Cattle CapEx, Healthcare)—cleanly mirroring every PowerPoint slide into pure, verifiable numbers.'}
          </p>

          {/* Sheets Index Preview */}
          <div className="relative z-10 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'bn' ? 'ওয়ার্কবুকে অন্তর্ভুক্ত গাণিতিক শীটসমূহ:' : 'Included Numerical Spending Sheets:'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">1.</span>
                <span className="font-semibold text-slate-900">Category Spending Audit (How much spent in which category)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">2.</span>
                <span>Feed Nutrition Spending (Slide 5 in Numbers)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">3.</span>
                <span>Labor Payroll Spending (Disbursements by role)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">4.</span>
                <span>Herd Weight Growth Numbers (Slide 3 in Numbers)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">5.</span>
                <span>Demographics & Valuation (Slide 4 in Numbers)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">6.</span>
                <span>Healthcare & Vaccine Schedule (Slide 6 in Numbers)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-800">7.</span>
                <span>Livestock Sales Returns & ROI Audit</span>
              </div>
            </div>
          </div>

          {/* Download Action Button */}
          <div className="relative z-10 pt-1">
            <button
              onClick={handleDownloadExcel}
              disabled={isExportingExcel}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isExportingExcel ? 'Generating Workbook...' : (language === 'bn' ? 'খাতভিত্তিক ব্যয়ের এক্সেল ফাইল ডাউনলোড করুন (.xlsx)' : 'Download Clean Category Spending Workbook (.xlsx)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Farm Census & Executive Summary */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-emerald-100 shadow-xs space-y-6 card-lift">
        <div className="border-b border-emerald-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-slate-900">{data.farmName || t.myFarm}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Generated: {new Date().toLocaleDateString()} · Status: Official Farm Report
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl">
            Verified Herd Register
          </span>
        </div>

        {/* Financial Profit & Loss Statement Grid */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">
            Financial Profit & Loss Statement (P&L)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 card-lift stagger-1">
              <span className="text-xs font-semibold text-slate-500 block">Livestock Sales Revenue</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums block mt-1">
                {formatCurrency(totalSalesRevenue, language)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{data.sales.length} transactions</span>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 card-lift stagger-2">
              <span className="text-xs font-semibold text-slate-500 block">Feed & Nutrition Cost</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums block mt-1">
                {formatCurrency(totalFeedExpense, language)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{data.feed.length} purchase logs</span>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 card-lift stagger-3">
              <span className="text-xs font-semibold text-slate-500 block">Staff Payroll Disbursed</span>
              <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums block mt-1">
                {formatCurrency(totalPayrollPaid, language)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">{data.employees.length} personnel</span>
            </div>

            <div className={`p-4 rounded-2xl border card-lift stagger-4 ${
              totalRealizedProfit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
            }`}>
              <span className="text-xs font-semibold text-slate-700 block">{t.netRealizedProfit}</span>
              <span className={`text-base sm:text-lg font-black tabular-nums block mt-1 ${
                totalRealizedProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {totalRealizedProfit >= 0 ? '+' : ''}{formatCurrency(totalRealizedProfit, language)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">From sold herd records</span>
            </div>
          </div>
        </div>

        {/* Herd Census Summary */}
        <div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 mb-3">
            Active Herd Census Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-emerald-50/50 border-b border-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                  <th className="py-2.5 px-3">Tag</th>
                  <th className="py-2.5 px-3">Breed</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Weight (kg)</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Purchase Date</th>
                  <th className="py-2.5 px-3">Acquisition Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {data.cattle.map((c) => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{c.tagNumber}</td>
                    <td className="py-2 px-3 text-slate-700">{c.breed}</td>
                    <td className="py-2 px-3 text-slate-600">{c.gender}</td>
                    <td className="py-2 px-3 font-bold tabular-nums text-slate-900">{c.weight} kg</td>
                    <td className="py-2 px-3 text-slate-500">{c.source}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{c.purchaseDate || 'N/A'}</td>
                    <td className="py-2 px-3 tabular-nums font-semibold text-slate-800">
                      {formatCurrency(c.purchasePrice || 0, language)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CSV & Backup Operations Bar (Hidden during print) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {/* CSV Exports */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs card-lift">
          <div className="flex items-center gap-2 mb-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Export CSV Spreadsheets</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Download standard comma-separated tabular files compatible with Microsoft Excel, Google Sheets, or custom farm accounting tools.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleExportCensusCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 btn-interactive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Full Herd Census (CSV)</span>
            </button>

            <button
              onClick={handleExportFinancialCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 btn-interactive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Financial P&L Statement (CSV)</span>
            </button>
          </div>
        </div>

        {/* JSON Backup & Cloud Restore */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs card-lift">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">JSON Snapshot Backup & Restore</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Maintain local data independence. Export complete JSON snapshots of your farm to safeguard against offline device loss.
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportJson}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 btn-interactive"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.backupJson}</span>
            </button>

            <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer btn-interactive">
              <Upload className="w-3.5 h-3.5" />
              <span>{t.restoreJson}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4-Layer Security Master Reset Danger Zone (Hidden during print) */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border-2 border-rose-200/90 shadow-xs print:hidden card-lift">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'bn'
                    ? 'মাস্টার খামার রিসেট ভল্ট (৪-স্তরের নিরাপত্তা সুরক্ষা)'
                    : 'Master System Reset Vault (4-Level Security Protection)'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                  <Lock className="w-3 h-3 text-rose-600" />
                  <span>4 Security Gates</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                {language === 'bn'
                  ? 'সম্পূর্ণ খামার ডাটা মুছে ফেলতে (০ রেকর্ড) অথবা ডিফল্ট ডেমো ডাটায় ফিরে যেতে ৪টি নিরাপত্তা ধাপ (১. ডাটা অডিট ও ব্যাকআপ, ২. ৬-সংখ্যার পিন ও যোগফল, ৩. কমান্ড ফ্রেজ টাইপিং, ৪. ৫-সেকেন্ড টাইমার ও ২.৫-সেকেন্ড প্রেস-অ্যান্ড-হোল্ড) অতিক্রম করতে হবে।'
                  : 'Protected by 4 independent verification layers: (1) Live Data Impact Audit & Backup Safeguard, (2) Dynamic 6-Digit PIN & Math Challenge, (3) Explicit Command Phrase Signature, and (4) 5-Second Cooldown Lock + 2.5s Press-and-Hold Execution.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setResetModalMode('demo');
                setShowResetModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition btn-interactive"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              <span>{language === 'bn' ? 'ডেমো ডাটায় রিসেট' : 'Reset to Demo Data'}</span>
            </button>

            <button
              onClick={() => {
                setResetModalMode('wipe');
                setShowResetModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-xs btn-interactive"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'সম্পূর্ণ খামার রিসেট (৪-স্তর নিরাপত্তা)' : 'Reset Everything (4-Level Security)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4-Level Security Reset Modal */}
      <SecurityResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        initialMode={resetModalMode}
      />
    </div>
  );
};
