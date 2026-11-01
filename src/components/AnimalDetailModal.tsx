import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cattle, HealthType } from '../types/farm';
import { useFarm } from '../context/FarmContext';
import { formatCurrency } from '../i18n/translations';
import { AccurateTrendGraph, TrendPoint } from './charts/AccurateTrendGraph';
import { 
  X, 
  Scale, 
  Stethoscope, 
  Plus, 
  TrendingUp,
  FileText,
  User,
  Calendar
} from 'lucide-react';

interface AnimalDetailModalProps {
  cow: Cattle | null;
  onClose: () => void;
  onOpenSellModal: (cowId: string) => void;
}

export const AnimalDetailModal: React.FC<AnimalDetailModalProps> = ({ cow, onClose, onOpenSellModal }) => {
  const { t, language, addWeightRecord, addHealthRecord } = useFarm();
  const backdropMouseDownRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'weight' | 'health'>('profile');

  // Form states for adding quick weight log
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightNotes, setWeightNotes] = useState('');

  // Form states for adding health/vaccine record
  const [showAddHealth, setShowAddHealth] = useState(false);
  const [healthType, setHealthType] = useState<HealthType>('Vaccine');
  const [healthTitle, setHealthTitle] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [healthDate, setHealthDate] = useState(new Date().toISOString().split('T')[0]);
  const [boosterDate, setBoosterDate] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  if (!cow) return null;

  // Calculate Days on Farm
  const daysOnFarm = (() => {
    if (!cow.purchaseDate) return 0;
    const start = new Date(cow.purchaseDate).getTime();
    const end = new Date().getTime();
    const diff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  })();

  // Calculate Average Daily Gain (ADG)
  const weightRecords = cow.weightRecords || [];
  const sortedWeights = [...weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const adgGramsPerDay = (() => {
    if (sortedWeights.length < 2) return null;
    const first = sortedWeights[0];
    const last = sortedWeights[sortedWeights.length - 1];
    const days = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));
    const gainKg = last.weight - first.weight;
    const gramsPerDay = Math.round((gainKg * 1000) / days);
    return gramsPerDay;
  })();

  // Individual cow trend points
  const cowTrendPoints: TrendPoint[] = sortedWeights.map((w) => ({
    date: w.date,
    weight: w.weight,
    label: w.notes || undefined,
    tagNumber: cow.tagNumber
  }));

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(newWeight);
    if (isNaN(num) || num <= 0) return;
    addWeightRecord(cow.id, {
      date: weightDate,
      weight: num,
      notes: weightNotes
    });
    setNewWeight('');
    setWeightNotes('');
    setShowAddWeight(false);
  };

  const handleSaveHealth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!healthTitle) return;
    addHealthRecord(cow.id, {
      cowId: cow.id,
      type: healthType,
      title: healthTitle,
      date: healthDate,
      medicineName: medicineName || undefined,
      dosage: dosage || undefined,
      nextBoosterDate: boosterDate || undefined,
      administeredBy: administeredBy || undefined,
      notes: healthNotes || undefined
    });
    setHealthTitle('');
    setMedicineName('');
    setDosage('');
    setBoosterDate('');
    setAdministeredBy('');
    setHealthNotes('');
    setShowAddHealth(false);
  };

  return createPortal(
    <div
      onMouseDown={(e) => {
        backdropMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (backdropMouseDownRef.current && e.target === e.currentTarget) {
          onClose();
        }
        backdropMouseDownRef.current = false;
      }}
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-emerald-100 my-auto overflow-hidden flex flex-col max-h-[90vh] anim-modal-card"
      >
        {/* Header (Clean White and Emerald Green Theme) */}
        <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
            <span className="bg-emerald-100 text-emerald-950 font-extrabold px-3 py-1 rounded-md text-xs tracking-wider uppercase font-mono border border-emerald-300">
              Tag: {cow.tagNumber}
            </span>
            <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {cow.breed}
            </span>
            <span className="text-xs text-slate-500 font-medium">· {cow.gender}</span>
            <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${cow.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {cow.status === 'Active' ? t.active : t.sold}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4 mt-4">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                {cow.weight} <span className="text-base font-normal text-slate-400">kg</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                {t.daysOnFarm}: <span className="font-bold text-slate-800 tabular-nums">{daysOnFarm} {language === 'bn' ? 'দিন' : 'days'}</span>
              </div>
            </div>

            {cow.status === 'Active' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSellModal(cow.id);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs px-4 py-2.5 rounded-2xl transition border border-emerald-200 shadow-xs"
              >
                {t.sellCattle}
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-emerald-100 bg-[#FBFDFB] px-6 pt-3 gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {language === 'bn' ? 'সাধারণ তথ্য' : 'General Profile'}
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'weight'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{t.weightHistory} ({sortedWeights.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t.medicalHistory} ({(cow.healthRecords || []).length})</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div key={activeTab} className="p-6 md:p-7 overflow-y-auto space-y-6 anim-view">
          {/* TAB 1: General Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">{t.source}</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block leading-relaxed">{cow.source}</span>
                </div>
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">{t.purchaseDate}</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block font-mono">{cow.purchaseDate || 'N/A'}</span>
                </div>
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">{t.purchasePrice}</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block tabular-nums">
                    {formatCurrency(cow.purchasePrice || 0, language)}
                  </span>
                </div>
              </div>

              {/* ADG Metric Highlight */}
              {adgGramsPerDay !== null && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-emerald-700 text-white rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950">{t.adg}</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">Calculated across {sortedWeights.length} logs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-900 tabular-nums">
                      {adgGramsPerDay > 0 ? `+${adgGramsPerDay}` : adgGramsPerDay} g/day
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {cow.notes && (
                <div className="p-5 bg-[#FBFDFB] rounded-2xl border border-emerald-100 space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>{t.notes}</span>
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{cow.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Weight Log History & ADG Curve */}
          {activeTab === 'weight' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    {language === 'bn' ? 'ওজন বৃদ্ধির সঠিক গ্রাফ' : 'Individual Cattle Growth Graph'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Logged weights mapped over time for {cow.tagNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWeight(!showAddWeight)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{t.logWeight}</span>
                </button>
              </div>

              {/* Accurate SVG Trend Line for THIS cow */}
              {cowTrendPoints.length >= 2 && (
                <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
                  <AccurateTrendGraph
                    points={cowTrendPoints}
                    height={240}
                    unit="kg"
                  />
                </div>
              )}

              {/* Add Weight Form */}
              {showAddWeight && (
                <form onSubmit={handleSaveWeight} className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3.5">
                  <h4 className="text-sm font-bold text-slate-900">{t.logWeight}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.weight}</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        placeholder="e.g. 550"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={weightDate}
                        onChange={(e) => setWeightDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.notes}</label>
                    <input
                      type="text"
                      value={weightNotes}
                      onChange={(e) => setWeightNotes(e.target.value)}
                      placeholder="e.g. Routine scale reading before evening fodder"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddWeight(false)}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition"
                    >
                      {t.save}
                    </button>
                  </div>
                </form>
              )}

              {/* Weight Timeline */}
              <div className="space-y-2.5">
                {sortedWeights.map((w, idx) => {
                  const prev = idx > 0 ? sortedWeights[idx - 1] : null;
                  const diff = prev ? w.weight - prev.weight : 0;
                  return (
                    <div
                      key={w.id}
                      className="p-3.5 rounded-2xl border border-emerald-100 bg-[#FBFDFB] flex items-center justify-between hover:border-emerald-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200/60">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 tabular-nums">{w.weight} kg</span>
                            {diff !== 0 && (
                              <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                ({diff > 0 ? `+${diff}` : diff} kg)
                              </span>
                            )}
                          </div>
                          {w.notes && <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-relaxed">{w.notes}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{w.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Medical & Vaccination Log */}
          {activeTab === 'health' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold uppercase tracking-wider">
                  {language === 'bn' ? 'টিকা ও চিকিৎসার বিবরণ' : 'Vaccine & Health Record History'}
                </span>
                <button
                  onClick={() => setShowAddHealth(!showAddHealth)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl transition"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{t.logHealth}</span>
                </button>
              </div>

              {/* Add Health Record Form */}
              {showAddHealth && (
                <form onSubmit={handleSaveHealth} className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3.5">
                  <h4 className="text-sm font-bold text-slate-900">{t.logHealth}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Type</label>
                      <select
                        value={healthType}
                        onChange={(e) => setHealthType(e.target.value as HealthType)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      >
                        <option value="Vaccine">{t.vaccine}</option>
                        <option value="Treatment">{t.treatment}</option>
                        <option value="Routine Checkup">{t.routineCheckup}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.treatmentTitle}</label>
                      <input
                        type="text"
                        required
                        value={healthTitle}
                        onChange={(e) => setHealthTitle(e.target.value)}
                        placeholder="e.g. FMD Booster Vaccine or Deworming"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Medicine / Product</label>
                      <input
                        type="text"
                        value={medicineName}
                        onChange={(e) => setMedicineName(e.target.value)}
                        placeholder="e.g. Aftovax Bivalent"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.dosage}</label>
                      <input
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g. 3ml SC"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Administration Date</label>
                      <input
                        type="date"
                        required
                        value={healthDate}
                        onChange={(e) => setHealthDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.nextBooster}</label>
                      <input
                        type="date"
                        value={boosterDate}
                        onChange={(e) => setBoosterDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">{t.administeredBy}</label>
                    <input
                      type="text"
                      value={administeredBy}
                      onChange={(e) => setAdministeredBy(e.target.value)}
                      placeholder="e.g. Dr. Rafiqul Islam, DVM"
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddHealth(false)}
                      className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition"
                    >
                      {t.save}
                    </button>
                  </div>
                </form>
              )}

              {/* Health Records List */}
              <div className="space-y-3">
                {(!cow.healthRecords || cow.healthRecords.length === 0) ? (
                  <p className="text-sm text-slate-500 py-6 text-center">No health or vaccination records yet.</p>
                ) : (
                  cow.healthRecords.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-2xl border border-emerald-100 bg-[#FBFDFB] hover:border-emerald-200 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              {h.type}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{h.title}</h4>
                          </div>
                          {(h.medicineName || h.dosage) && (
                            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                              {h.medicineName} {h.dosage ? `· Dosage: ${h.dosage}` : ''}
                            </p>
                          )}
                          {h.administeredBy && (
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">By: {h.administeredBy}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 font-mono block">{h.date}</span>
                          {h.nextBoosterDate && (
                            <span className="text-xs sm:text-sm font-bold text-emerald-800 mt-1 block">
                              Booster: {h.nextBoosterDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
