import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFarm } from '../context/FarmContext';
import { FeedType } from '../types/farm';
import { Plus, X, Wheat, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface AddFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddFeedModal: React.FC<AddFeedModalProps> = ({ isOpen, onClose }) => {
  const { t, language, addFeedEntry } = useFarm();
  const backdropMouseDownRef = useRef(false);

  const [feedType, setFeedType] = useState<FeedType>('Concentrates');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFeedType('Concentrates');
      setQuantity('');
      setCost('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericQty = parseFloat(quantity);
    const numericCost = parseFloat(cost);

    if (isNaN(numericQty) || numericQty <= 0) {
      toast.error(language === 'bn' ? 'সঠিক পরিমাণ (কেজি) লিখুন' : 'Please enter valid quantity in kg');
      return;
    }

    if (isNaN(numericCost) || numericCost < 0) {
      toast.error(language === 'bn' ? 'সঠিক মোট খরচ লিখুন' : 'Please enter valid total cost');
      return;
    }

    addFeedEntry({
      feedType,
      quantity: numericQty,
      cost: numericCost,
      date: date || new Date().toISOString().split('T')[0],
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
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
      >
        {/* Header */}
        <div className="bg-white border-b border-emerald-100 p-5 sm:p-6 text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 tracking-tight leading-snug">
                {t.logFeed}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {language === 'bn'
                  ? 'ঘাস, খড় ও দানাদার খাদ্য ক্রয়ের হিসাব লিপিবদ্ধ করুন'
                  : 'Record straw, green fodder, or concentrate purchase'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t.feedType} <span className="text-rose-500">*</span>
            </label>
            <select
              value={feedType}
              onChange={(e) => setFeedType(e.target.value as FeedType)}
              className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="Concentrates">{t.concentrates}</option>
              <option value="Grass">{t.grass}</option>
              <option value="Straw">{t.straw}</option>
              <option value="Supplements">{t.supplements}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.quantityKg} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={quantity}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.totalCost} (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={cost}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g. 18500"
                className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === 'bn' ? 'তারিখ' : 'Date'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>{t.notes}</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {language === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
              </span>
            </label>
            <input
              type="text"
              autoComplete="off"
              value={notes}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'bn' ? 'সরবরাহকারীর নাম, আর্দ্রতা বা গুণমান...' : 'Supplier name, moisture remarks, truck slip...'}
              className="w-full rounded-2xl border border-slate-300 bg-[#FBFDFB] p-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

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
