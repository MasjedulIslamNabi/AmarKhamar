import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFarm } from '../context/FarmContext';
import { Breed, Gender, Source } from '../types/farm';
import { Plus, X, Beef, Scale, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AddCattleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_BREEDS: Breed[] = [
  'Brahman',
  'Sahiwal',
  'Holstein Friesian',
  'Mirka',
  'Red Sindhi',
  'Local',
  'Crossbreed'
];

export const AddCattleModal: React.FC<AddCattleModalProps> = ({ isOpen, onClose }) => {
  const { data, t, language, addCattle } = useFarm();
  const backdropMouseDownRef = useRef(false);

  // Form States
  const [tagNumber, setTagNumber] = useState('');
  const [breed, setBreed] = useState<Breed>('Brahman');
  const [gender, setGender] = useState<Gender>('Bull');
  const [weight, setWeight] = useState('');
  const [source, setSource] = useState<Source>('Purchased');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTagNumber('');
      setBreed('Brahman');
      setGender('Bull');
      setWeight('');
      setSource('Purchased');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchasePrice('');
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Duplicate tag warning
  const isDuplicateTag = data.cattle.some(
    (c) => c.status === 'Active' && c.tagNumber.trim().toUpperCase() === tagNumber.trim().toUpperCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagNumber.trim().toUpperCase();
    if (!cleanTag) {
      toast.error(language === 'bn' ? 'দয়া করে ট্যাগ নম্বর লিখুন' : 'Please enter a cattle tag number');
      return;
    }

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      toast.error(language === 'bn' ? 'সঠিক ওজন (কেজি) লিখুন' : 'Please enter a valid weight in kg');
      return;
    }

    if (isDuplicateTag) {
      toast.error(
        language === 'bn' 
          ? `ট্যাগ ${cleanTag} ইতোমধ্যে খামারে নিবন্ধিত রয়েছে` 
          : `Tag ${cleanTag} already exists in active herd`
      );
      return;
    }

    addCattle({
      tagNumber: cleanTag,
      breed,
      gender,
      weight: numericWeight,
      source,
      purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
      purchasePrice: parseFloat(purchasePrice) || 0,
      status: 'Active',
      notes: notes.trim() || undefined
    });

    onClose();
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
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6 backdrop-blur-xs flex min-h-full items-start sm:items-center justify-center anim-modal-backdrop"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
      >
        {/* Header */}
        <div className="bg-white border-b border-emerald-100 p-5 sm:p-6 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Beef className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight leading-snug">
                {t.addCattle}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {language === 'bn'
                  ? 'ডিজিটাল হার্ডবুকে নতুন গবাদিপশু অন্তর্ভুক্তি করুন'
                  : 'Register a new bovine into the digital herd record'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Tag Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>{t.tagNumber} <span className="text-rose-500">*</span></span>
                {isDuplicateTag && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{language === 'bn' ? 'দ্বৈত ট্যাগ' : 'Duplicate'}</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                value={tagNumber}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => setTagNumber(e.target.value)}
                placeholder="e.g. BD-201"
                className={`w-full rounded-2xl border p-3 text-xs font-mono font-bold focus:outline-hidden transition ${
                  isDuplicateTag 
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-600' 
                    : 'border-slate-300 bg-[#FBFDFB] text-slate-900 focus:border-emerald-600'
                }`}
              />
            </div>

            {/* Breed Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.breed} <span className="text-rose-500">*</span>
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value as Breed)}
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                {COMMON_BREEDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.gender} <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="Bull">{t.bulls}</option>
                <option value="Cow">{t.cows}</option>
                <option value="Calf">{t.calves}</option>
              </select>
            </div>

            {/* Current Weight */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.weight} (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="10"
                max="2000"
                required
                value={weight}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 480"
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.source}
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Source)}
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="Purchased">{t.purchased}</option>
                <option value="Born on Farm">{t.bornOnFarm}</option>
              </select>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.purchasePrice} (৳)
              </label>
              <input
                type="number"
                step="500"
                min="0"
                value={purchasePrice}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Purchase / Acquisition Date */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.purchaseDate}
              </label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{t.notes}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
              </span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'bn' ? 'রং, শিংয়ের ধরণ বা বংশবৃত্তান্ত...' : 'Color, horn shape, lineage observations...'}
              className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-hidden leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
