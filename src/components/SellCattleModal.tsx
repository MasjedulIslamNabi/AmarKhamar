import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFarm } from '../context/FarmContext';
import { Cattle } from '../types/farm';
import { formatCurrency } from '../i18n/translations';
import { X, DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface SellCattleModalProps {
  cowId: string | null;
  onClose: () => void;
}

export const SellCattleModal: React.FC<SellCattleModalProps> = ({ cowId, onClose }) => {
  const { data, t, language, sellCattle } = useFarm();
  const backdropMouseDownRef = useRef(false);
  const cow = data.cattle.find((c) => c.id === cowId);

  const [salePrice, setSalePrice] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!cow) return null;

  const numericSalePrice = parseFloat(salePrice) || 0;
  const purchasePrice = cow.purchasePrice || 0;
  const netProfitOrLoss = numericSalePrice > 0 ? numericSalePrice - purchasePrice : 0;

  const handleConfirmSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericSalePrice <= 0 || !buyerName.trim()) return;

    sellCattle(cow.id, {
      salePrice: numericSalePrice,
      buyerName: buyerName.trim(),
      buyerContact: buyerContact.trim() || undefined,
      date: saleDate,
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
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
      >
        {/* Header */}
        <div className="bg-white border-b border-emerald-100 p-5 text-slate-900 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">{t.sellPromptTitle}</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Tag: <span className="font-mono text-emerald-900 font-bold">{cow.tagNumber}</span> ({cow.breed})</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmSale} className="p-5 space-y-4">
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
            {t.sellWarning}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">{t.purchasePrice}</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums mt-0.5 block">
                {formatCurrency(purchasePrice, language)}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">{t.weight}</span>
              <span className="text-sm font-bold text-slate-900 tabular-nums mt-0.5 block">
                {cow.weight} kg
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
              {t.salePrice} (৳) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="e.g. 195000"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold tabular-nums focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Real-time Profit/Loss Preview */}
          {numericSalePrice > 0 && (
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              netProfitOrLoss >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2">
                {netProfitOrLoss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                )}
                <span className="text-xs font-semibold">{t.profitOrLoss}:</span>
              </div>
              <span className="text-sm font-black tabular-nums">
                {netProfitOrLoss >= 0 ? `+${formatCurrency(netProfitOrLoss, language)}` : formatCurrency(netProfitOrLoss, language)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t.buyerName} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Haji Nurul Islam"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t.buyerContact}</label>
              <input
                type="tel"
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t.saleDate}</label>
            <input
              type="date"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{t.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Qurbani buyer, payment settled in cash"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl btn-interactive"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs flex items-center gap-1.5 btn-interactive"
            >
              <span>{t.confirm}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
