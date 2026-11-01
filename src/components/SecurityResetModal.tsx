import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { getBroadcastLogs } from '../services/whatsappGatewayService';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Timer,
  Flame,
  Database,
  ShieldCheck,
  X
} from 'lucide-react';

interface SecurityResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'wipe' | 'demo';
}

const REQUIRED_PHRASE = 'RESET AMAR KHAMAR';

export const SecurityResetModal: React.FC<SecurityResetModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'wipe'
}) => {
  const { data, language, exportJson, resetToDemo, factoryResetAllData } = useFarm();

  // Current Security Layer (1 to 4)
  const [securityLevel, setSecurityLevel] = useState<1 | 2 | 3 | 4>(1);
  const [resetMode, setResetMode] = useState<'wipe' | 'demo'>(initialMode);

  // Layer 1 State: Impact Acknowledgment Checkboxes
  const [ackDatabaseOverwrite, setAckDatabaseOverwrite] = useState(false);
  const [ackBackupResponsibility, setAckBackupResponsibility] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  // Layer 2 State: Dynamic 6-Digit Security PIN & Math Challenge
  const [generatedPin, setGeneratedPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [mathNumA, setMathNumA] = useState(14);
  const [mathNumB, setMathNumB] = useState(23);
  const [enteredMath, setEnteredMath] = useState('');

  // Layer 3 State: Explicit Phrase & Action Confirmation
  const [typedPhrase, setTypedPhrase] = useState('');
  const [typedSecondary, setTypedSecondary] = useState('');

  // Layer 4 State: 5-Second Safety Cooldown + 2.5-Second Press-and-Hold Vault Trigger
  const [cooldownSeconds, setCooldownSeconds] = useState(5);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdIntervalRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Reset all security challenges whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSecurityLevel(1);
      setResetMode(initialMode);
      setAckDatabaseOverwrite(false);
      setAckBackupResponsibility(false);
      setBackupDownloaded(false);

      // Generate fresh 6-digit PIN & math challenge
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPin(pin);
      setEnteredPin('');
      setMathNumA(Math.floor(12 + Math.random() * 25));
      setMathNumB(Math.floor(11 + Math.random() * 25));
      setEnteredMath('');

      setTypedPhrase('');
      setTypedSecondary('');
      setCooldownSeconds(5);
      setHoldProgress(0);
      setIsHolding(false);
      completedRef.current = false;
    }
  }, [isOpen, initialMode]);

  // Layer 4 Cooldown Timer (5 seconds -> 0)
  useEffect(() => {
    if (!isOpen || securityLevel !== 4) return;
    setCooldownSeconds(5);
    setHoldProgress(0);

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen, securityLevel]);

  // Clean up hold interval on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        window.clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  // Audit counts of current records
  const auditStats = useMemo(() => {
    const cattleCount = data.cattle.length;
    const weightLogsCount = data.cattle.reduce((sum, c) => sum + (c.weightRecords?.length || 0), 0);
    const healthLogsCount = data.cattle.reduce((sum, c) => sum + (c.healthRecords?.length || 0), 0);
    const feedCount = data.feed.length;
    const staffCount = data.employees.length;
    const salesCount = data.sales.length;
    const dispatchCount = getBroadcastLogs().length;

    return {
      cattleCount,
      weightLogsCount,
      healthLogsCount,
      feedCount,
      staffCount,
      salesCount,
      dispatchCount,
      totalRecords:
        cattleCount + weightLogsCount + healthLogsCount + feedCount + staffCount + salesCount + dispatchCount
    };
  }, [data, isOpen]);

  // Validation checks for each layer
  const isLayer1Valid = ackDatabaseOverwrite && ackBackupResponsibility;
  const isLayer2Valid =
    enteredPin.trim() === generatedPin &&
    parseInt(enteredMath.trim(), 10) === mathNumA + mathNumB;

  const expectedSecondary = resetMode === 'wipe' ? 'WIPE ALL' : 'RESTORE DEMO';
  const isLayer3Valid =
    typedPhrase.trim().toUpperCase() === REQUIRED_PHRASE &&
    typedSecondary.trim().toUpperCase() === expectedSecondary;

  // Execute reset safely in an effect once holdProgress reaches 100%
  useEffect(() => {
    if (holdProgress >= 100 && !completedRef.current) {
      completedRef.current = true;
      setIsHolding(false);
      if (holdIntervalRef.current) {
        window.clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
      }
      if (resetMode === 'wipe') {
        factoryResetAllData();
      } else {
        resetToDemo();
      }
      setTimeout(() => {
        onClose();
      }, 200);
    }
  }, [holdProgress, resetMode, factoryResetAllData, resetToDemo, onClose]);

  // Press and Hold logic for Layer 4
  const startHold = () => {
    if (cooldownSeconds > 0 || completedRef.current) return;
    setIsHolding(true);

    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
    }

    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress((prev) => {
        const next = prev + 4;
        return next >= 100 ? 100 : next;
      });
    }, 90);
  };

  const stopHold = () => {
    setIsHolding(false);
    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (!completedRef.current) {
      setHoldProgress(0);
    }
  };

  const handleEmergencyBackup = () => {
    exportJson();
    setBackupDownloaded(true);
    setAckBackupResponsibility(true);
  };

  if (!isOpen) return null;

  const securitySteps = [
    {
      level: 1,
      titleEn: 'Layer 1: Impact Audit',
      titleBn: 'স্তর ১: ডাটা অডিট ও ব্যাকআপ'
    },
    {
      level: 2,
      titleEn: 'Layer 2: Security Token',
      titleBn: 'স্তর ২: পিন ও গাণিতিক যাচাই'
    },
    {
      level: 3,
      titleEn: 'Layer 3: Command Phrase',
      titleBn: 'স্তর ৩: কমান্ড ফ্রেজ নিশ্চিতকরণ'
    },
    {
      level: 4,
      titleEn: 'Layer 4: Vault Execution',
      titleBn: 'স্তর ৪: টাইমার ও হোল্ড লক'
    }
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isHolding) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto anim-modal-backdrop"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-rose-200 overflow-hidden my-auto anim-modal-card">
        {/* Top Security Header */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold">
                  4-Layer Security Protocol
                </span>
                <span className="text-[11px] font-mono text-rose-300 font-semibold">
                  Level {securityLevel} of 4
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
                {language === 'bn'
                  ? 'মাস্টার খামার রিসেট ও ডাটা নিরাপত্তা ভল্ট'
                  : 'Master System Reset & Data Security Vault'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition"
            title="Cancel and exit reset protocol"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Level Security Stepper Bar */}
        <div className="bg-rose-50/70 border-b border-rose-100 px-5 py-3.5">
          <div className="grid grid-cols-4 gap-2">
            {securitySteps.map((step) => {
              const isCompleted = securityLevel > step.level;
              const isCurrent = securityLevel === step.level;
              return (
                <div
                  key={step.level}
                  className={`flex flex-col gap-1.5 p-2 rounded-xl border transition ${
                    isCurrent
                      ? 'bg-white border-rose-400 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : 'bg-white/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-extrabold uppercase ${
                        isCurrent
                          ? 'text-rose-700'
                          : isCompleted
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      LVL 0{step.level}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 truncate">
                    {language === 'bn' ? step.titleBn : step.titleEn}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Body — Renders Active Security Layer */}
        <div className="p-6 space-y-5">
          {/* ==================== LAYER 1: IMPACT AUDIT & BACKUP ==================== */}
          {securityLevel === 1 && (
            <div className="space-y-5">
              {/* Select Reset Mode */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-2.5">
                  {language === 'bn'
                    ? '১. রিসেট মোড নির্বাচন করুন:'
                    : '1. Select Reset Scope & Mode:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResetMode('wipe')}
                    className={`text-left p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                      resetMode === 'wipe'
                        ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-rose-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-900">
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>
                          {language === 'bn'
                            ? 'সম্পূর্ণ ফ্যাক্টরি রিসেট (০ রেকর্ড)'
                            : 'Complete Factory Wipe (0 Slate)'}
                        </span>
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          resetMode === 'wipe' ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                        }`}
                      >
                        {resetMode === 'wipe' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {language === 'bn'
                        ? 'সকল পশু, খাদ্য, বেতন, বিক্রয় এবং হোয়াটসঅ্যাপ লগ সম্পূর্ণ মুছে একদম শূন্য (Empty) খামার তৈরি করবে।'
                        : 'Permanently erases all cattle, feed, staff payroll, sales, and WhatsApp dispatch history to a 100% blank state.'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetMode('demo')}
                    className={`text-left p-4 rounded-2xl border-2 transition flex flex-col justify-between gap-2 ${
                      resetMode === 'demo'
                        ? 'border-amber-600 bg-amber-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-amber-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950">
                        <RefreshCw className="w-4 h-4 text-amber-600" />
                        <span>
                          {language === 'bn'
                            ? 'ডিফল্ট ডেমো রেকর্ডে রিসেট'
                            : 'Restore Default Demo Dataset'}
                        </span>
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          resetMode === 'demo' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                        }`}
                      >
                        {resetMode === 'demo' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {language === 'bn'
                        ? 'আপনার সকল কাস্টম পরিবর্তন মুছে ফেলে অ্যাপটিকে প্রাথমিক ডেমো খামার ডাটায় ফিরিয়ে নেবে।'
                        : 'Overwrites current records and restores the initial 5 sample cattle, feed inventory, and demo staff.'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Live Database Impact Audit */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-rose-600" />
                    <span>
                      {language === 'bn'
                        ? 'যেসকল ডাটা প্রভাবিত হবে (লাইভ অডিট):'
                        : 'Records Affected by Reset (Live Audit):'}
                    </span>
                  </span>
                  <span className="text-xs font-mono font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-lg">
                    {auditStats.totalRecords} Total Entries
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Cattle Herd:</span>
                    <span className="font-mono font-bold text-slate-900">{auditStats.cattleCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Scale & Vet Logs:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {auditStats.weightLogsCount + auditStats.healthLogsCount}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Feed Ledgers:</span>
                    <span className="font-mono font-bold text-slate-900">{auditStats.feedCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Staff & Payroll:</span>
                    <span className="font-mono font-bold text-slate-900">{auditStats.staffCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Sales Archive:</span>
                    <span className="font-mono font-bold text-slate-900">{auditStats.salesCount}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500">Dispatch Logs:</span>
                    <span className="font-mono font-bold text-slate-900">{auditStats.dispatchCount}</span>
                  </div>
                </div>

                {/* Emergency Backup Button */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/80">
                  <span className="text-[11px] text-slate-600 font-medium">
                    {language === 'bn'
                      ? 'রিসেট করার আগে আপনার বর্তমান ডাটার ব্যাকআপ ডাউনলোড করে রাখুন:'
                      : 'Recommended: Save an offline JSON snapshot before resetting:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleEmergencyBackup}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {backupDownloaded
                        ? language === 'bn'
                          ? 'ব্যাকআপ ডাউনলোড হয়েছে ✓'
                          : 'Backup Downloaded ✓'
                        : language === 'bn'
                        ? 'জরুরি ব্যাকআপ ডাউনলোড করুন'
                        : 'Download Emergency Backup (.json)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Mandatory Checkboxes */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={ackDatabaseOverwrite}
                    onChange={(e) => setAckDatabaseOverwrite(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-rose-600 rounded-sm shrink-0"
                  />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    {language === 'bn'
                      ? 'আমি বুঝতে পারছি যে এই পদক্ষেপটি আমার লোকাল স্টোরেজ এবং ক্লাউড ডাটাবেস সম্পূর্ণ ওভাররাইট করবে।'
                      : 'I understand that this operation will permanently overwrite both local storage and cloud-synced farm records.'}
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={ackBackupResponsibility}
                    onChange={(e) => setAckBackupResponsibility(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-rose-600 rounded-sm shrink-0"
                  />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    {language === 'bn'
                      ? 'আমি ইতিমধ্যে ডাটা ব্যাকআপ নিয়েছি অথবা বর্তমান রেকর্ডগুলো মুছে ফেলার পূর্ণ দায়ভার গ্রহণ করছি।'
                      : 'I confirm that I have either downloaded a JSON backup or intentionally wish to discard all current farm data.'}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ==================== LAYER 2: SECURITY TOKEN & MATH CHALLENGE ==================== */}
          {securityLevel === 2 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
                  <p className="font-bold">
                    {language === 'bn'
                      ? 'নিরাপত্তা স্তর ২: ডায়নামিক সিকিউরিটি পিন ও গাণিতিক যাচাইকরণ'
                      : 'Security Layer 2: Dynamic Authorization Token & Human Verification'}
                  </p>
                  <p className="text-amber-800">
                    {language === 'bn'
                      ? 'ভুলবশত রিসেট হওয়া প্রতিরোধ করতে নিচের ৬-সংখ্যার সিকিউরিটি পিন এবং যোগফলটি সঠিকভাবে লিখুন।'
                      : 'To prevent accidental triggers, enter the one-time 6-digit security token and solve the arithmetic verification below.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 6-Digit PIN Challenge */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">One-Time Security PIN:</span>
                    <span className="font-mono text-base font-black tracking-widest text-rose-700 bg-rose-100 px-3 py-1 rounded-xl border border-rose-200 select-all">
                      {generatedPin}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {language === 'bn' ? 'উপরের ৬-সংখ্যার পিনটি লিখুন:' : 'Enter 6-Digit Security PIN:'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      placeholder={generatedPin}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono font-bold tracking-widest focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Arithmetic Challenge */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Math Challenge:</span>
                    <span className="font-mono text-base font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-200">
                      {mathNumA} + {mathNumB} = ?
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {language === 'bn' ? 'সঠিক যোগফল লিখুন:' : 'Calculate & Enter Sum:'}
                    </label>
                    <input
                      type="number"
                      value={enteredMath}
                      onChange={(e) => setEnteredMath(e.target.value)}
                      placeholder="e.g. 37"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono font-bold focus:border-rose-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Verification Status:</span>
                {isLayer2Valid ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PIN & Math Verified — Layer 3 Unlocked</span>
                  </span>
                ) : (
                  <span className="font-semibold text-rose-600">
                    Waiting for exact PIN & sum match...
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ==================== LAYER 3: EXPLICIT COMMAND PHRASE ==================== */}
          {securityLevel === 3 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-950 space-y-1 leading-relaxed">
                  <p className="font-bold">
                    {language === 'bn'
                      ? 'নিরাপত্তা স্তর ৩: কমান্ড ফ্রেজ নিশ্চিতকরণ'
                      : 'Security Layer 3: Explicit Command Phrase Confirmation'}
                  </p>
                  <p className="text-rose-800">
                    {language === 'bn'
                      ? 'চূড়ান্ত ভল্ট আনলক করতে নিচের দুটি বক্সে নির্ধারিত ইংরেজি বাক্যগুলো হুবহু টাইপ করুন।'
                      : 'Type the exact authorization phrases below to arm the final reset vault.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Type <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{REQUIRED_PHRASE}</span>:
                  </label>
                  <input
                    type="text"
                    value={typedPhrase}
                    onChange={(e) => setTypedPhrase(e.target.value)}
                    placeholder={REQUIRED_PHRASE}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider focus:border-rose-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. Type <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{expectedSecondary}</span> to confirm mode:
                  </label>
                  <input
                    type="text"
                    value={typedSecondary}
                    onChange={(e) => setTypedSecondary(e.target.value)}
                    placeholder={expectedSecondary}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider focus:border-rose-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-500">Command Signature Status:</span>
                {isLayer3Valid ? (
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Command Phrases Verified — Final Vault Ready</span>
                  </span>
                ) : (
                  <span className="font-semibold text-rose-600">
                    Both phrases must match exactly
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ==================== LAYER 4: COOLDOWN TIMER & PRESS-AND-HOLD VAULT ==================== */}
          {securityLevel === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-rose-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-rose-300 font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <span>Final Security Gate — Armed</span>
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200">
                    {resetMode === 'wipe' ? 'FACTORY WIPE (0 RECORDS)' : 'DEMO DATASET RESET'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'bn'
                    ? '৫-সেকেন্ডের সেফটি টাইমার শেষ হওয়ার পর নিচের লাল বাটনটি ২.৫ সেকেন্ড চেপে ধরে রাখুন (Press & Hold)। মাঝপথে ছেড়ে দিলে রিসেট বাতিল হয়ে যাবে।'
                    : 'Wait for the 5-second safety lock to expire, then PRESS AND HOLD the red execution button for 2.5 seconds until the bar reaches 100%.'}
                </p>
              </div>

              {/* Cooldown Status + Hold Button */}
              <div className="p-5 rounded-3xl bg-rose-50/70 border-2 border-rose-200 flex flex-col items-center text-center space-y-4">
                {cooldownSeconds > 0 ? (
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm py-2">
                    <Timer className="w-5 h-5 animate-spin text-rose-600" />
                    <span>
                      {language === 'bn'
                        ? `সেফটি লক আনলক হচ্ছে... ${cooldownSeconds} সেকেন্ড অপেক্ষা করুন`
                        : `Safety Cooldown Active — Unlocks in ${cooldownSeconds}s...`}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                    {isHolding
                      ? language === 'bn'
                        ? `ধরে রাখুন... সম্পন্ন হচ্ছে ${holdProgress}%`
                        : `HOLD STEADY — EXECUTING RESET (${holdProgress}%)`
                      : language === 'bn'
                      ? 'ভল্ট আনলক হয়েছে — নিচের বাটনটি চেপে ধরে রাখুন'
                      : 'Vault Unlocked — Press & Hold Button Below for 2.5 Seconds'}
                  </div>
                )}

                {/* Press-and-Hold Button with Fill Progress */}
                <button
                  type="button"
                  disabled={cooldownSeconds > 0}
                  onMouseDown={startHold}
                  onMouseUp={stopHold}
                  onMouseLeave={stopHold}
                  onTouchStart={startHold}
                  onTouchEnd={stopHold}
                  className={`relative w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide overflow-hidden transition select-none ${
                    cooldownSeconds > 0
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-700 hover:bg-rose-800 text-white shadow-lg shadow-rose-700/25 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  {/* Animated Progress Fill Overlay */}
                  <div
                    className="absolute inset-y-0 left-0 bg-rose-500/50 transition-all duration-75 pointer-events-none"
                    style={{ width: `${holdProgress}%` }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {cooldownSeconds > 0
                        ? `Locked (${cooldownSeconds}s)`
                        : isHolding
                        ? `Keep Holding... ${holdProgress}%`
                        : resetMode === 'wipe'
                        ? language === 'bn'
                          ? 'চেপে ধরে রাখুন (২.৫ সেকেন্ড) — সম্পূর্ণ রিসেট'
                          : 'PRESS & HOLD (2.5s) TO WIPE ALL DATA'
                        : language === 'bn'
                        ? 'চেপে ধরে রাখুন (২.৫ সেকেন্ড) — ডেমো রিসেট'
                        : 'PRESS & HOLD (2.5s) TO RESTORE DEMO DATA'}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation Between Security Layers */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            {securityLevel > 1 ? (
              <button
                type="button"
                onClick={() => setSecurityLevel((prev) => Math.max(1, prev - 1) as 1 | 2 | 3 | 4)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'পূর্ববর্তী ধাপ' : 'Previous Layer'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
              </button>
            )}

            {securityLevel < 4 && (
              <button
                type="button"
                disabled={
                  (securityLevel === 1 && !isLayer1Valid) ||
                  (securityLevel === 2 && !isLayer2Valid) ||
                  (securityLevel === 3 && !isLayer3Valid)
                }
                onClick={() => setSecurityLevel((prev) => Math.min(4, prev + 1) as 1 | 2 | 3 | 4)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 transition shadow-xs"
              >
                <span>
                  {language === 'bn'
                    ? `পরবর্তী নিরাপত্তা স্তর (স্তর ${securityLevel + 1})`
                    : `Proceed to Security Layer ${securityLevel + 1}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
