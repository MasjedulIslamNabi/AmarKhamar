import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { BookOpen, Stethoscope, Wheat, Users, ArrowRight, ArrowLeft, Check, Sparkles, X } from 'lucide-react';

interface OnboardingGuideProps {
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onClose, onNavigateToTab }) => {
  const { t, language } = useFarm();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: t.step1Title,
      desc: t.step1Desc,
      icon: BookOpen,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      tab: "herd"
    },
    {
      title: t.step2Title,
      desc: t.step2Desc,
      icon: Stethoscope,
      color: "text-rose-700 bg-rose-50 border-rose-200",
      tab: "health"
    },
    {
      title: t.step3Title,
      desc: t.step3Desc,
      icon: Wheat,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      tab: "feed"
    },
    {
      title: t.step4Title,
      desc: t.step4Desc,
      icon: Users,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      tab: "sales"
    }
  ];

  const current = steps[currentStep];
  const Icon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleExploreSection = () => {
    onNavigateToTab(current.tab);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs anim-modal-backdrop"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden anim-modal-card">
        {/* Header */}
        <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{language === 'bn' ? 'ব্যবহারবিধি ও পরিচিতি' : 'Onboarding Guide'}</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-emerald-950">{t.onboardingTitle}</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.onboardingSubtitle}</p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 transition-all duration-300 ${
                idx <= currentStep ? 'bg-emerald-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div key={currentStep} className="p-6 anim-view">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${current.color} shrink-0 transition-transform duration-300 hover:scale-105`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{current.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{current.desc}</p>
            </div>
          </div>

          {/* Quick jump action */}
          <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {language === 'bn' ? 'এই মডিউলে সরাসরি যেতে চান?' : 'Want to inspect this section now?'}
            </span>
            <button
              onClick={handleExploreSection}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline underline-offset-2 btn-interactive"
            >
              <span>{language === 'bn' ? 'এখানে যান' : 'Jump there'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition btn-interactive ${
              currentStep === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.prevStep}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 btn-interactive"
            >
              {t.skip}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition btn-interactive"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.getStarted}</span>
                </>
              ) : (
                <>
                  <span>{t.nextStep}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
