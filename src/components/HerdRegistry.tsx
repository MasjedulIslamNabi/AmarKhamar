import React, { useState, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { Breed, Cattle, Gender, Source } from '../types/farm';
import { formatCurrency } from '../i18n/translations';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Trash2, 
  Eye, 
  DollarSign, 
  Beef,
  Scale
} from 'lucide-react';

interface HerdRegistryProps {
  onSelectCow: (cowId: string) => void;
  onOpenSellModal: (cowId: string) => void;
  isOpenAddModal?: boolean;
  onCloseAddModal?: () => void;
  onOpenAddModal: () => void;
}

const COMMON_BREEDS: Breed[] = [
  "Brahman",
  "Sahiwal",
  "Holstein Friesian",
  "Mirka",
  "Red Sindhi",
  "Local",
  "Crossbreed"
];

export const HerdRegistry: React.FC<HerdRegistryProps> = ({
  onSelectCow,
  onOpenSellModal,
  onOpenAddModal
}) => {
  const { data, t, language, deleteCattle } = useFarm();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreed, setSelectedBreed] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Active cattle only
  const activeCattle = useMemo(() => {
    return data.cattle.filter((c) => c.status === 'Active');
  }, [data.cattle]);

  // Filtered cattle
  const filteredCattle = useMemo(() => {
    return activeCattle.filter((c) => {
      const matchesSearch = c.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesBreed = selectedBreed === 'all' || c.breed === selectedBreed;
      const matchesGender = selectedGender === 'all' || c.gender === selectedGender;
      const matchesSource = selectedSource === 'all' || c.source === selectedSource;

      return matchesSearch && matchesBreed && matchesGender && matchesSource;
    });
  }, [activeCattle, searchQuery, selectedBreed, selectedGender, selectedSource]);

  const handleDeleteWithConfirm = (id: string, tag: string) => {
    if (window.confirm(language === 'bn' ? `আপনি কি নিশ্চিতভাবে ${tag} মুছে ফেলতে চান?` : `Are you sure you want to delete cattle ${tag}?`)) {
      deleteCattle(id);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls in White & Green Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.herdRegistry}</h1>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
            {language === 'bn' 
              ? `খামারে বর্তমান সক্রিয় গবাদিপশু: ${activeCattle.length} টি (নিবন্ধিত হার্ডবুক)` 
              : `Active livestock registered in digital herdbook: ${activeCattle.length} cattle`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-2xl bg-emerald-50/70 p-1 border border-emerald-100">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'table' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition ${
                viewMode === 'grid' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid cards view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.addCattle}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4.5 h-4.5 text-emerald-600/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-emerald-100 bg-[#FBFDFB] pl-11 pr-4 py-2.5 text-sm text-slate-800 focus:border-emerald-600 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 leading-relaxed"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="rounded-2xl border border-emerald-100 bg-[#FBFDFB] px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="all">{t.allBreeds}</option>
              {COMMON_BREEDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="rounded-2xl border border-emerald-100 bg-[#FBFDFB] px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="all">{t.allGenders}</option>
              <option value="Bull">{t.bulls}</option>
              <option value="Cow">{t.cows}</option>
              <option value="Calf">{t.calves}</option>
            </select>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="rounded-2xl border border-emerald-100 bg-[#FBFDFB] px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="all">{t.allSources}</option>
              <option value="Purchased">{t.purchased}</option>
              <option value="Born on Farm">{t.bornOnFarm}</option>
            </select>

            {(searchQuery || selectedBreed !== 'all' || selectedGender !== 'all' || selectedSource !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBreed('all');
                  setSelectedGender('all');
                  setSelectedSource('all');
                }}
                className="text-xs sm:text-sm text-rose-600 hover:text-rose-700 font-bold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid with View Transition */}
      <div key={viewMode} className="anim-view">
        {filteredCattle.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-emerald-100 shadow-xs">
            <Beef className="w-12 h-12 mx-auto text-emerald-200 stroke-1" />
            <h3 className="text-base font-bold text-slate-900 mt-4 leading-snug">{t.emptyCattleTitle}</h3>
            <p className="text-xs md:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">{t.emptyCattleDesc}</p>
            <button
              onClick={onOpenAddModal}
              className="mt-5 inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-sm transition shadow-xs btn-interactive"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.addCattle}</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-3xl border border-emerald-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/60 border-b border-emerald-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                    <th className="py-4 px-5">{t.tagNumber}</th>
                    <th className="py-4 px-5">{t.breed}</th>
                    <th className="py-4 px-5">{t.gender}</th>
                    <th className="py-4 px-5">{t.weight}</th>
                    <th className="py-4 px-5">{t.source}</th>
                    <th className="py-4 px-5">{t.purchasePrice}</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 text-sm leading-relaxed">
                  {filteredCattle.map((c) => (
                    <tr key={c.id} className="table-row-hover group">
                      <td className="py-4 px-5 font-bold text-slate-900 font-mono">
                        <button
                          onClick={() => onSelectCow(c.id)}
                          className="text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1.5"
                        >
                          <span className="bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80 font-bold group-hover:border-emerald-300 transition-colors">{c.tagNumber}</span>
                        </button>
                      </td>
                      <td className="py-4 px-5 text-slate-800 font-bold">{c.breed}</td>
                      <td className="py-4 px-5 text-slate-600 font-medium">{c.gender}</td>
                      <td className="py-4 px-5 font-bold text-slate-900 tabular-nums">
                        {c.weight} kg
                      </td>
                      <td className="py-4 px-5 text-slate-600 font-medium">{c.source}</td>
                      <td className="py-4 px-5 text-slate-900 tabular-nums font-bold">
                        {formatCurrency(c.purchasePrice || 0, language)}
                      </td>
                      <td className="py-4 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onSelectCow(c.id)}
                          title="View profile & medical history"
                          className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-100/60 transition btn-interactive"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => onOpenSellModal(c.id)}
                          title={t.sellCattle}
                          className="p-2 rounded-xl text-emerald-800 hover:bg-emerald-100/60 transition btn-interactive"
                        >
                          <DollarSign className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithConfirm(c.id, c.tagNumber)}
                          title={t.delete}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition btn-interactive"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCattle.map((c, idx) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 card-lift"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs sm:text-sm font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        {c.tagNumber}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2.5 leading-snug">{c.breed}</h3>
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">{c.gender}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl">
                      <span className="text-xs text-slate-500 font-semibold block">{t.weight}</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums block mt-1">{c.weight} kg</span>
                    </div>
                    <div className="p-3 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl">
                      <span className="text-xs text-slate-500 font-semibold block">{t.purchasePrice}</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 tabular-nums block mt-1">
                        {formatCurrency(c.purchasePrice || 0, language)}
                      </span>
                    </div>
                  </div>

                  {c.notes && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">{c.notes}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-emerald-50 flex items-center justify-between">
                  <button
                    onClick={() => onSelectCow(c.id)}
                    className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 btn-interactive"
                  >
                    <span>{language === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenSellModal(c.id)}
                      className="px-3 py-1.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-xs sm:text-sm font-bold transition btn-interactive"
                    >
                      {t.sellCattle}
                    </button>
                    <button
                      onClick={() => handleDeleteWithConfirm(c.id, c.tagNumber)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition btn-interactive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
