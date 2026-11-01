import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Wifi, 
  Battery, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  WhatsAppSession, 
  generateWhatsAppQrCode, 
  pairWhatsAppDevice, 
  disconnectWhatsAppDevice, 
  getStoredWhatsAppSession 
} from '../services/whatsappGatewayService';

interface WhatsAppQrLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionChange: (session: WhatsAppSession) => void;
  farmName?: string;
  language: 'en' | 'bn';
}

export const WhatsAppQrLinkModal: React.FC<WhatsAppQrLinkModalProps> = ({
  isOpen,
  onClose,
  onSessionChange,
  farmName = 'Amar Khamar',
  language
}) => {
  const isBn = language === 'bn';
  const [session, setSession] = useState<WhatsAppSession>(getStoredWhatsAppSession());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [inputPhone, setInputPhone] = useState<string>('+880 1711-234567');

  const refreshQr = async () => {
    setIsRefreshing(true);
    try {
      const { qrDataUrl: newUrl } = await generateWhatsAppQrCode(farmName);
      setQrDataUrl(newUrl);
      setCountdown(30);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate QR code');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const current = getStoredWhatsAppSession();
      setSession(current);
      if (current.status !== 'connected') {
        refreshQr();
      }
    }
  }, [isOpen]);

  // QR refresh timer
  useEffect(() => {
    if (!isOpen || session.status === 'connected') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshQr();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, session.status]);

  const handlePairDevice = () => {
    const newSession = pairWhatsAppDevice(inputPhone.trim() || '+880 1711-234567', farmName);
    setSession(newSession);
    onSessionChange(newSession);
    toast.success(
      isBn 
        ? 'হোয়াটসঅ্যাপ সফলভাবে সংযুক্ত হয়েছে! এখন সরাসরি একযোগে বার্তা পাঠাতে পারবেন।' 
        : 'WhatsApp linked successfully! You can now dispatch messages directly to staff.'
    );
  };

  const handleDisconnect = () => {
    disconnectWhatsAppDevice();
    const newSession: WhatsAppSession = { status: 'disconnected' };
    setSession(newSession);
    onSessionChange(newSession);
    refreshQr();
    toast.info(isBn ? 'হোয়াটসঅ্যাপ সংযোগ বিচ্ছিন্ন করা হয়েছে' : 'WhatsApp device disconnected');
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 anim-modal-backdrop"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden anim-modal-card">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-emerald-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-[#128C7E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {isBn ? 'হোয়াটসঅ্যাপ সরাসরি লিঙ্ক (QR কোড)' : 'Link WhatsApp Directly (QR Code)'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn 
                  ? 'বাইরে ট্যাব না খুলে সরাসরি একযোগে কর্মীদের বার্তা পাঠানোর ব্যবস্থা' 
                  : 'Dispatch messages to staff simultaneously without opening external tabs.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {session.status === 'connected' ? (
            /* Connected State */
            <div className="space-y-5 text-center py-2">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/40 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <span>{isBn ? 'সক্রিয়ভাবে সংযুক্ত (Connected)' : 'Active Companion Session'}</span>
                </span>
                <h3 className="text-lg font-black text-slate-900">{session.linkedPhone}</h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">{session.deviceName}</p>
              </div>

              {/* Status details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-3 gap-2 text-xs text-slate-600">
                <div className="flex flex-col items-center gap-1">
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Signal</span>
                  <span className="text-[11px] text-emerald-700 font-bold">Excellent</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-slate-200">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Battery</span>
                  <span className="text-[11px] text-emerald-700 font-bold">{session.batteryLevel}%</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Security</span>
                  <span className="text-[11px] text-emerald-700 font-bold">End-to-End</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition shadow-xs btn-interactive"
                >
                  {isBn ? 'বার্তা পাঠানো শুরু করুন' : 'Start Dispatching Messages'}
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition btn-interactive flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সংযোগ বিচ্ছিন্ন করুন' : 'Disconnect'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Disconnected / Pairing State */
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 text-xs text-slate-700 space-y-2 leading-relaxed">
                <div className="font-bold text-emerald-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>{isBn ? 'ফোনে যেভাবে সংযোগ করবেন:' : 'How to Link from WhatsApp on Your Phone:'}</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1 text-[11px]">
                  <li>{isBn ? 'আপনার ফোনে WhatsApp চালু করুন।' : 'Open WhatsApp on your mobile phone.'}</li>
                  <li>{isBn ? 'Settings (আইফোন) বা মেনু ⋮ (অ্যান্ড্রয়েড) চাপুন।' : 'Tap Menu ⋮ (Android) or Settings (iPhone).'}</li>
                  <li>{isBn ? 'Linked Devices সিলেক্ট করে Link a Device চাপুন।' : 'Tap Linked Devices and select Link a Device.'}</li>
                  <li>{isBn ? 'নিচের QR কোডে আপনার ফোনের ক্যামেরা তাক করুন।' : 'Point your camera at this QR code to scan.'}</li>
                </ol>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-white border-2 border-emerald-500/30 rounded-3xl shadow-md relative group">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="WhatsApp Web Linking QR Code" 
                      className="w-56 h-56 rounded-2xl object-contain select-none" 
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                  )}

                  {/* WhatsApp Logo badge in center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md border-2 border-[#25D366] flex items-center justify-center pointer-events-none">
                    <span className="text-[#25D366] font-black text-sm">WA</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={refreshQr}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 hover:text-emerald-700 transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>{isBn ? `কোড রিফ্রেশ হবে ${countdown}s` : `Code refreshes in ${countdown}s`}</span>
                  </button>
                </div>
              </div>

              {/* Simulated / Direct Scan Pair Trigger */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">
                    {isBn ? 'খামারের প্রেরক মোবাইল নম্বর:' : 'Farm WhatsApp Dispatch Number:'}
                  </label>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">BD Mobile</span>
                </div>
                <input
                  type="text"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(e.target.value)}
                  placeholder="+880 1711-234567"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  type="button"
                  onClick={handlePairDevice}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition shadow-sm active:scale-[0.98] btn-interactive"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{isBn ? 'কিউআর কোড স্ক্যান সম্পন্ন ও লিঙ্ক করুন' : 'Confirm QR Scan & Link Device Directly'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
