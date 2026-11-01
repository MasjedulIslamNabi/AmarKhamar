import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const PWAInstallButton: React.FC<{ variant?: 'sidebar' | 'header' | 'compact' }> = ({ variant = 'sidebar' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useFarm();

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          title={t.installApp}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t.installApp}</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition active:scale-[0.98]"
      >
        <Download className="w-4 h-4" />
        <span>{t.installApp}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition ${variant === 'sidebar' ? 'w-full justify-center' : ''}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.installApp}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-emerald-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> button (box with arrow) in Safari.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> (হোম স্ক্রিনে যোগ করুন).<br />
                3. Enjoy instant offline access anytime!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
