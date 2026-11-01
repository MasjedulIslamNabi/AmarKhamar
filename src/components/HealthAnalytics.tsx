import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFarm } from '../context/FarmContext';
import { HealthRecord, HealthType } from '../types/farm';
import { AccuratePieChart, PieDataPoint } from './charts/AccuratePieChart';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Clock, 
  ShieldCheck,
  AlertCircle,
  PieChart as PieChartIcon
} from 'lucide-react';

interface HealthAnalyticsProps {
  onSelectCow: (cowId: string) => void;
}

export const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({ onSelectCow }) => {
  const { data, t, language, addHealthRecord } = useFarm();
  const backdropMouseDownRef = useRef(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Modal form states
  const [targetCowId, setTargetCowId] = useState('');
  const [formType, setFormType] = useState<HealthType>('Vaccine');
  const [formTitle, setFormTitle] = useState('');
  const [formMedicine, setFormMedicine] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formBoosterDate, setFormBoosterDate] = useState('');
  const [formAdminBy, setFormAdminBy] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Collect all health records farm-wide
  const allRecords = useMemo(() => {
    const list: (HealthRecord & { cowTag: string; cowBreed: string })[] = [];
    data.cattle.forEach((c) => {
      (c.healthRecords || []).forEach((h) => {
        list.push({
          ...h,
          cowTag: c.tagNumber,
          cowBreed: c.breed
        });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.cattle]);

  // Upcoming vaccine schedule
  const upcomingBoosters = useMemo(() => {
    const now = new Date();
    return allRecords.filter((r) => {
      if (r.type !== 'Vaccine' || !r.nextBoosterDate) return false;
      const bDate = new Date(r.nextBoosterDate);
      return bDate >= now;
    }).sort((a, b) => new Date(a.nextBoosterDate!).getTime() - new Date(b.nextBoosterDate!).getTime());
  }, [allRecords]);

  // Accurate Pie Chart: Health Intervention Distribution
  const healthPieData: PieDataPoint[] = useMemo(() => {
    const vCount = allRecords.filter(r => r.type === 'Vaccine').length;
    const tCount = allRecords.filter(r => r.type === 'Treatment').length;
    const rCount = allRecords.filter(r => r.type === 'Routine Checkup').length;

    return [
      { label: t.vaccine, value: vCount, color: '#047857' },
      { label: t.treatment, value: tCount, color: '#10B981' },
      { label: t.routineCheckup, value: rCount, color: '#6EE7B7' }
    ].filter(p => p.value > 0);
  }, [allRecords, t]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      const matchesType = selectedType === 'all' || r.type === selectedType;
      const matchesQuery = 
        r.cowTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.medicineName && r.medicineName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.administeredBy && r.administeredBy.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesQuery;
    });
  }, [allRecords, selectedType, searchQuery]);

  const handleCreateHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCowId || !formTitle.trim()) return;

    addHealthRecord(targetCowId, {
      cowId: targetCowId,
      type: formType,
      title: formTitle.trim(),
      date: formDate,
      medicineName: formMedicine.trim() || undefined,
      dosage: formDosage.trim() || undefined,
      nextBoosterDate: formBoosterDate || undefined,
      administeredBy: formAdminBy.trim() || undefined,
      notes: formNotes.trim() || undefined
    });

    setFormTitle('');
    setFormMedicine('');
    setFormDosage('');
    setFormBoosterDate('');
    setFormAdminBy('');
    setFormNotes('');
    setShowLogModal(false);
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.healthAnalytics}</h1>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
            {language === 'bn'
              ? 'টিকা, চিকিৎসা ও রোগ প্রতিরোধ সূচি'
              : 'Preventative vaccine schedule, treatments, and booster alerts'}
          </p>
        </div>

        <button
          onClick={() => {
            if (data.cattle.length > 0 && !targetCowId) {
              setTargetCowId(data.cattle[0].id);
            }
            setShowLogModal(true);
          }}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t.logHealth}</span>
        </button>
      </div>

      {/* Two-Column Analytics: Upcoming Boosters & Health Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Booster Schedule Ribbon (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 card-lift">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{t.upcomingVaccines}</h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl tabular-nums">
                {upcomingBoosters.length} pending
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {upcomingBoosters.length === 0 ? (
                <div className="col-span-full py-6 text-center text-xs text-slate-500 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  {t.noUpcomingVaccines}
                </div>
              ) : (
                upcomingBoosters.map((b, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectCow(b.cowId)}
                    className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl hover:bg-emerald-100/60 cursor-pointer transition-all duration-300 hover:translate-x-1 hover:shadow-xs flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-emerald-950 font-mono bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {b.cowTag}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{b.cowBreed}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">{b.title}</h4>
                    </div>
                    <div className="pt-2 border-t border-emerald-200/50 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Booster Due:</span>
                      <span className="font-bold text-emerald-800 font-mono">{b.nextBoosterDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-50 text-xs sm:text-sm text-slate-500 flex items-center justify-between">
            <span>DLS Protocol Compliance</span>
            <span className="text-emerald-800 font-semibold">FMD · Anthrax · BQ</span>
          </div>
        </div>

        {/* Health Intervention Distribution Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 overflow-hidden card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'চিকিৎসা ও টিকার অনুপাত' : 'Intervention Mix'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' ? 'টিকা বনাম চিকিৎসার সঠিক শতাংশ' : 'Proportion of vaccines vs routine treatments'}
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>

          <div className="py-2 min-w-0 overflow-hidden">
            <AccuratePieChart
              data={healthPieData}
              donut={true}
              size={180}
            />
          </div>

          <div className="pt-3 border-t border-emerald-50 text-xs sm:text-sm text-slate-500">
            Total {allRecords.length} veterinary interventions logged.
          </div>
        </div>
      </div>

      {/* Filter and Log Table */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-xs overflow-hidden card-lift">
        <div className="p-5 border-b border-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-emerald-600/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tag, title, or vet..."
              className="w-full rounded-2xl border border-emerald-100 bg-[#FBFDFB] pl-11 pr-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {['all', 'Vaccine', 'Treatment', 'Routine Checkup'].map((tp) => (
              <button
                key={tp}
                onClick={() => setSelectedType(tp)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition btn-interactive ${
                  selectedType === tp
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50/70 text-slate-600 hover:bg-emerald-100'
                }`}
              >
                {tp === 'all' ? 'All' : tp}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 border-b border-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                <th className="py-3.5 px-5">Date</th>
                <th className="py-3.5 px-5">{t.tagNumber}</th>
                <th className="py-3.5 px-5">Type</th>
                <th className="py-3.5 px-5">{t.treatmentTitle}</th>
                <th className="py-3.5 px-5">{t.dosage}</th>
                <th className="py-3.5 px-5">{t.administeredBy}</th>
                <th className="py-3.5 px-5">{t.nextBooster}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 text-sm leading-relaxed">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-slate-400">
                    No medical or vaccination records match the criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="table-row-hover">
                    <td className="py-4 px-5 text-slate-500 font-mono text-xs">{r.date}</td>
                    <td className="py-4 px-5 font-bold text-slate-900 font-mono">
                      <button
                        onClick={() => onSelectCow(r.cowId)}
                        className="text-emerald-700 hover:underline btn-interactive font-bold"
                      >
                        {r.cowTag}
                      </button>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        r.type === 'Vaccine' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900">{r.title}</td>
                    <td className="py-4 px-5 text-slate-600">
                      {r.medicineName ? `${r.medicineName} (${r.dosage || ''})` : r.dosage || '-'}
                    </td>
                    <td className="py-4 px-5 text-slate-500">{r.administeredBy || '-'}</td>
                    <td className="py-4 px-5 text-emerald-800 font-mono font-bold">
                      {r.nextBoosterDate || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Health Modal */}
      {showLogModal && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={(e) => {
            backdropMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (backdropMouseDownRef.current && e.target === e.currentTarget) {
              setShowLogModal(false);
            }
            backdropMouseDownRef.current = false;
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
        >
          <div 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
          >
            <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">{t.logHealth}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Record vaccine dose or medical treatment</p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHealth} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Cattle <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={targetCowId}
                  onChange={(e) => setTargetCowId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Choose Cattle --</option>
                  {data.cattle.filter(c => c.status === 'Active').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tagNumber} - {c.breed} ({c.gender}, {c.weight}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as HealthType)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="Vaccine">{t.vaccine}</option>
                    <option value="Treatment">{t.treatment}</option>
                    <option value="Routine Checkup">{t.routineCheckup}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.treatmentTitle} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. FMD Bivalent / Anthrax"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Medicine Name</label>
                  <input
                    type="text"
                    value={formMedicine}
                    onChange={(e) => setFormMedicine(e.target.value)}
                    placeholder="e.g. Aftovax"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.dosage}</label>
                  <input
                    type="text"
                    value={formDosage}
                    onChange={(e) => setFormDosage(e.target.value)}
                    placeholder="e.g. 3ml SC"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.nextBooster}</label>
                  <input
                    type="date"
                    value={formBoosterDate}
                    onChange={(e) => setFormBoosterDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.administeredBy}</label>
                <input
                  type="text"
                  value={formAdminBy}
                  onChange={(e) => setFormAdminBy(e.target.value)}
                  placeholder="e.g. Dr. Rafiqul Islam, DVM"
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.notes}</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Observations, reaction checks..."
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl btn-interactive"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs btn-interactive"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
