import React, { useState, useEffect, useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Wheat, 
  Stethoscope, 
  Scale, 
  Wallet, 
  AlertTriangle, 
  Smartphone, 
  MessageSquare,
  Users,
  CheckCircle2,
  Sparkles,
  QrCode,
  Radio,
  Clock,
  History,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DispatchTemplateType, 
  generateDispatchMessage, 
  getWhatsAppUrl, 
  getSmsUrl 
} from '../services/staffDispatchService';
import { 
  WhatsAppSession, 
  getStoredWhatsAppSession, 
  executeDirectSimultaneousBroadcast,
  getBroadcastLogs,
  recordBroadcastLog,
  BroadcastLog,
  BroadcastRecipient
} from '../services/whatsappGatewayService';
import { WhatsAppQrLinkModal } from './WhatsAppQrLinkModal';

interface StaffDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: DispatchTemplateType;
  initialEmployeeId?: string;
}

export const StaffDispatchModal: React.FC<StaffDispatchModalProps> = ({
  isOpen,
  onClose,
  initialTemplate = 'feed',
  initialEmployeeId
}) => {
  const { data, language: appLanguage } = useFarm();

  const [activeTemplate, setActiveTemplate] = useState<DispatchTemplateType>(initialTemplate);
  const [msgLanguage, setMsgLanguage] = useState<'en' | 'bn'>(appLanguage === 'bn' ? 'bn' : 'en');
  
  // Dispatch Mode: 'simultaneous' (broadcast to all) vs 'single'
  const [dispatchMode, setDispatchMode] = useState<'simultaneous' | 'single'>('simultaneous');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmployeeId || '');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const [customNote, setCustomNote] = useState<string>('');
  const [editedMessage, setEditedMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // WhatsApp Gateway Session
  const [waSession, setWaSession] = useState<WhatsAppSession>(getStoredWhatsAppSession());
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // In-app Simultaneous Dispatching State
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastProgress, setBroadcastProgress] = useState<{ current: number; total: number; currentName: string }>({ current: 0, total: 0, currentName: '' });
  const [latestBroadcastLog, setLatestBroadcastLog] = useState<BroadcastLog | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<BroadcastLog[]>([]);

  // Initialize selected staff with all active employees
  useEffect(() => {
    if (data.employees.length > 0) {
      setSelectedStaffIds(data.employees.map((e) => e.id));
    }
  }, [data.employees]);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTemplate(initialTemplate);
      if (initialEmployeeId) {
        setSelectedEmployeeId(initialEmployeeId);
        setDispatchMode('single');
      } else {
        setDispatchMode('simultaneous');
      }
      setCustomNote('');
      setWaSession(getStoredWhatsAppSession());
      setLatestBroadcastLog(null);
      setHistoryLogs(getBroadcastLogs());
    }
  }, [isOpen, initialTemplate, initialEmployeeId]);

  // Re-generate base message when template, recipient, language or custom note changes
  useEffect(() => {
    const generated = generateDispatchMessage(activeTemplate, data, {
      language: msgLanguage,
      recipientId: dispatchMode === 'single' ? (selectedEmployeeId || undefined) : undefined,
      customNote: customNote.trim() || undefined
    });
    setEditedMessage(generated);
  }, [activeTemplate, msgLanguage, selectedEmployeeId, dispatchMode, customNote, data]);

  // Selected recipient employee (for single mode)
  const selectedEmployee = useMemo(() => {
    return data.employees.find((e) => e.id === selectedEmployeeId);
  }, [data.employees, selectedEmployeeId]);

  const targetPhoneNumber = selectedEmployee?.phone || '';

  // Recipients for simultaneous broadcast
  const simultaneousRecipients = useMemo(() => {
    return data.employees
      .filter((e) => selectedStaffIds.includes(e.id))
      .map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        phone: e.phone || ''
      }));
  }, [data.employees, selectedStaffIds]);

  const toggleSelectStaff = (id: string) => {
    setSelectedStaffIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      toast.success(msgLanguage === 'bn' ? 'বার্তাটি কপি করা হয়েছে!' : 'Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Run in-app simultaneous broadcast without opening external tabs
  const handleExecuteSimultaneousBroadcast = async () => {
    if (simultaneousRecipients.length === 0) {
      toast.error(msgLanguage === 'bn' ? 'কমপক্ষে একজন কর্মী নির্বাচন করুন' : 'Select at least one recipient');
      return;
    }

    // Check if device is linked via QR code
    if (waSession.status !== 'connected') {
      toast.info(
        msgLanguage === 'bn'
          ? 'বাইরে ট্যাব না খুলে সরাসরি পাঠাতে প্রথমে কিউআর কোড স্ক্যান করে ডিভাইস লিঙ্ক করুন।'
          : 'Please scan the QR code first to link your WhatsApp session for direct dispatch.'
      );
      setShowQrModal(true);
      return;
    }

    try {
      setIsBroadcasting(true);
      setBroadcastProgress({ current: 0, total: simultaneousRecipients.length, currentName: '' });

      const log = await executeDirectSimultaneousBroadcast(
        simultaneousRecipients,
        editedMessage,
        activeTemplate,
        (current, total, currentName) => {
          setBroadcastProgress({ current, total, currentName });
        }
      );

      setLatestBroadcastLog(log);
      setHistoryLogs(getBroadcastLogs());
      toast.success(
        msgLanguage === 'bn'
          ? `একযোগে ${log.successfulCount} জন কর্মীকে সফলভাবে বার্তা পাঠানো হয়েছে (কোনো এক্সটার্নাল ট্যাব ছাড়াই)!`
          : `Simultaneously dispatched to ${log.successfulCount} staff members directly without external tabs!`
      );
    } catch (err) {
      console.error(err);
      toast.error('Broadcast failed');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const recordSingleRecipientDispatch = () => {
    if (!selectedEmployee) return;
    const singleLog: BroadcastLog = {
      id: `bcast-${Date.now()}`,
      timestamp: new Date().toISOString(),
      templateType: activeTemplate,
      messageText: editedMessage,
      recipientsCount: 1,
      successfulCount: 1,
      recipients: [
        {
          id: selectedEmployee.id,
          name: selectedEmployee.name,
          role: selectedEmployee.role,
          phone: selectedEmployee.phone || 'N/A',
          status: 'delivered',
          deliveredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    recordBroadcastLog(singleLog);
    setHistoryLogs(getBroadcastLogs());
  };

  const handleOpenIndividualWhatsApp = () => {
    recordSingleRecipientDispatch();
    const url = getWhatsAppUrl(targetPhoneNumber, editedMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(
      msgLanguage === 'bn'
        ? 'হোয়াটসঅ্যাপ মেসেজ পাঠানো হয়েছে ও কাজের খতিয়ানে যুক্ত হয়েছে'
        : 'WhatsApp dispatch logged to employee task history'
    );
  };

  const handleOpenSms = () => {
    recordSingleRecipientDispatch();
    const url = getSmsUrl(targetPhoneNumber, editedMessage);
    window.location.href = url;
    toast.success(
      msgLanguage === 'bn'
        ? 'এসএমএস অ্যাপ চালু করা হয়েছে ও কাজের খতিয়ানে যুক্ত হয়েছে'
        : 'SMS dispatch logged to employee task history'
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && !isBroadcasting) onClose();
        }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 anim-modal-backdrop"
      >
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-emerald-100 overflow-hidden anim-modal-card">
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-emerald-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#25D366]/15 text-[#1EBE5D] flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#128C7E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
                    {msgLanguage === 'bn' ? 'হোয়াটসঅ্যাপ ও এসএমএস স্টাফ বার্তা কেন্দ্র' : 'WhatsApp & SMS Staff Dispatch Hub'}
                  </h2>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Direct In-App Delivery</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  {msgLanguage === 'bn'
                    ? 'কিউআর কোড দিয়ে ডিভাইস লিঙ্ক করে এক্সটার্নাল ট্যাব ছাড়াই একযোগে সকল কর্মীকে বার্তা পাঠান'
                    : 'Dispatch operational tasks simultaneously without opening external browser tabs.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition btn-interactive ${
                  showHistory ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
                title="View Dispatch History Logs"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{msgLanguage === 'bn' ? 'পূর্বের লগ' : 'History'}</span>
              </button>

              <button
                onClick={onClose}
                disabled={isBroadcasting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition btn-interactive disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Device Linking Status Bar (Direct WhatsApp Multi-Device Gateway) */}
          <div className="bg-emerald-50/70 px-5 sm:px-6 py-2.5 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
              {waSession.status === 'connected' ? (
                <span className="text-slate-800 font-medium">
                  {msgLanguage === 'bn' ? 'সরাসরি লিঙ্কযুক্ত ডিভাইস:' : 'Direct Linked WhatsApp:'}{' '}
                  <strong className="text-emerald-950 font-bold">{waSession.linkedPhone}</strong> ·{' '}
                  <span className="text-emerald-700 font-semibold">{waSession.deviceName}</span>
                </span>
              ) : (
                <span className="text-amber-800 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {msgLanguage === 'bn' 
                      ? 'হোয়াটসঅ্যাপ সরাসরি লিঙ্ক করা হয়নি (একযোগে পাঠাতে QR কোড স্ক্যান করুন)' 
                      : 'WhatsApp not linked directly (link via QR code for simultaneous in-app sending)'}
                  </span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-300 shadow-xs transition btn-interactive"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {waSession.status === 'connected' 
                  ? (msgLanguage === 'bn' ? 'ডিভাইস পরিচালনা' : 'Manage Linked Device')
                  : (msgLanguage === 'bn' ? 'কিউআর কোড স্ক্যান ও লিঙ্ক' : 'Link WhatsApp (QR Code)')}
              </span>
            </button>
          </div>

          {/* Modal Body: Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* If viewing History Logs */}
            {showHistory ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>{msgLanguage === 'bn' ? 'একযোগে পাঠানো বার্তার হিস্ট্রি ও অডিট লগ' : 'Simultaneous Dispatch Audit History'}</span>
                  </h3>
                  <span className="text-xs text-slate-500">{historyLogs.length} recent dispatches</span>
                </div>

                {historyLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No broadcast history records found yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950 uppercase tracking-wider text-[11px]">
                            {log.templateType} Dispatch
                          </span>
                          <span className="font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-700 font-mono text-[11px] line-clamp-2 bg-white p-2.5 rounded-xl border border-slate-200">
                          {log.messageText}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-slate-500">
                            Recipients: <strong>{log.successfulCount} / {log.recipientsCount} delivered</strong>
                          </span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Delivered without external tabs</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. Template Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                    {msgLanguage === 'bn' ? 'কাজের ধরণ নির্বাচন করুন:' : 'Select Operational Task Template:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTemplate('feed')}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition border btn-interactive ${
                        activeTemplate === 'feed'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <Wheat className="w-4 h-4 shrink-0" />
                      <span className="truncate">{msgLanguage === 'bn' ? 'খাদ্য বরাদ্দ' : 'Morning Feed'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplate('vaccine')}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition border btn-interactive ${
                        activeTemplate === 'vaccine'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <Stethoscope className="w-4 h-4 shrink-0" />
                      <span className="truncate">{msgLanguage === 'bn' ? 'টিকা সতর্কতা' : 'Vaccine Alert'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplate('weighin')}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition border btn-interactive ${
                        activeTemplate === 'weighin'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <Scale className="w-4 h-4 shrink-0" />
                      <span className="truncate">{msgLanguage === 'bn' ? 'ওজন স্কেল' : 'Weigh-in'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplate('salary')}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition border btn-interactive ${
                        activeTemplate === 'salary'
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <Wallet className="w-4 h-4 shrink-0" />
                      <span className="truncate">{msgLanguage === 'bn' ? 'বেতন রশিদ' : 'Salary Receipt'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTemplate('emergency')}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-bold transition border btn-interactive ${
                        activeTemplate === 'emergency'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/40'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="truncate">{msgLanguage === 'bn' ? 'জরুরি নোটিশ' : 'Emergency'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Dispatch Mode & Language Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
                  {/* Mode Selector */}
                  <div className="sm:col-span-8 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{msgLanguage === 'bn' ? 'প্রেরণ মাধ্যম নির্বাচন করুন:' : 'Select Sending Mode:'}</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDispatchMode('simultaneous')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          dispatchMode === 'simultaneous'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{msgLanguage === 'bn' ? 'একযোগে সকলকে পাঠান (Simultaneous)' : 'Broadcast to All Staff (Simultaneous)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDispatchMode('single')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition border ${
                          dispatchMode === 'single'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                        }`}
                      >
                        <span>{msgLanguage === 'bn' ? 'নির্দিষ্ট একজন কর্মী' : 'Individual Staff'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Language toggle */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {msgLanguage === 'bn' ? 'মেসেজের ভাষা:' : 'Message Language:'}
                    </label>
                    <div className="flex rounded-xl bg-slate-200/80 p-0.5">
                      <button
                        type="button"
                        onClick={() => setMsgLanguage('bn')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          msgLanguage === 'bn' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        বাংলা
                      </button>
                      <button
                        type="button"
                        onClick={() => setMsgLanguage('en')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                          msgLanguage === 'en' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recipient Details based on Mode */}
                {dispatchMode === 'simultaneous' ? (
                  /* Simultaneous Multi-Staff Checklist */
                  <div className="bg-white rounded-2xl p-4 border border-emerald-100/90 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>{msgLanguage === 'bn' ? 'একযোগে প্রাপ্তকারী কর্মীবৃন্দ:' : 'Recipients for Simultaneous In-App Dispatch:'}</span>
                      </span>
                      <span className="font-mono text-emerald-700 font-bold text-[11px]">
                        {simultaneousRecipients.length} of {data.employees.length} staff selected
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {data.employees.map((emp) => {
                        const isSelected = selectedStaffIds.includes(emp.id);
                        const hasPhone = Boolean(emp.phone && emp.phone.trim().length >= 8);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => toggleSelectStaff(emp.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 select-none ${
                              isSelected 
                                ? 'bg-emerald-50/60 border-emerald-300' 
                                : 'bg-slate-50 border-slate-200 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <div className="truncate flex-1">
                              <p className="font-bold text-slate-900 leading-tight">{emp.name}</p>
                              <p className="text-[11px] text-slate-500">{emp.role}</p>
                              {hasPhone ? (
                                <p className="text-[11px] font-mono font-semibold text-emerald-700 mt-0.5">
                                  {emp.phone}
                                </p>
                              ) : (
                                <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                                  ⚠️ Phone number missing
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Single Staff Dropdown */
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-1.5 text-xs">
                    <label className="block font-bold text-slate-700">
                      {msgLanguage === 'bn' ? 'প্রাপক কর্মী নির্বাচন করুন:' : 'Select Recipient Staff Member:'}
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">
                        {msgLanguage === 'bn' ? '📢 সকল কর্মী' : '📢 All Staff'}
                      </option>
                      {data.employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} — {emp.role} {emp.phone ? `(${emp.phone})` : '(No Phone)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Main Workspace: Text Editor & Smartphone Mockup */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Message Editor & Add-on Note */}
                  <div className="lg:col-span-7 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {msgLanguage === 'bn' ? 'বার্তা সম্পাদনা:' : 'Customizable Message Content:'}
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {editedMessage.length} chars · {editedMessage.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <textarea
                      rows={8}
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-2xl p-3.5 text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="Type or customize your staff instructions here..."
                    />

                    {/* Quick Add-on Note */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        {msgLanguage === 'bn' ? 'অতিরিক্ত বিশেষ নোট যোগ করুন (ঐচ্ছিক):' : 'Add Optional Custom Note:'}
                      </label>
                      <input
                        type="text"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder={
                          msgLanguage === 'bn'
                            ? 'যেমন: সকাল ৯টার মধ্যে শেড পরিষ্কার সম্পন্ন করুন'
                            : 'e.g., Please complete shed cleaning before 9:00 AM'
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Right: Smartphone Live Mockup */}
                  <div className="lg:col-span-5 flex flex-col justify-start">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{msgLanguage === 'bn' ? 'হোয়াটসঅ্যাপ প্রিভিউ:' : 'WhatsApp Mobile Preview:'}</span>
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        {dispatchMode === 'simultaneous' ? 'Simultaneous Broadcast' : (selectedEmployee ? selectedEmployee.name : 'Recipient View')}
                      </span>
                    </div>

                    {/* Phone Frame */}
                    <div className="bg-slate-900 rounded-3xl p-3 shadow-lg border-4 border-slate-800 flex flex-col h-[320px] overflow-hidden">
                      {/* Phone Speaker Notch & Bar */}
                      <div className="flex items-center justify-between px-3 py-1 text-[10px] text-slate-400 border-b border-slate-800/80 mb-2">
                        <span>9:41 AM</span>
                        <div className="w-12 h-2.5 bg-slate-800 rounded-full" />
                        <span>5G 98%</span>
                      </div>

                      {/* WhatsApp Chat Header */}
                      <div className="bg-[#075E54] text-white p-2 rounded-t-xl flex items-center gap-2 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-300 text-slate-900 font-bold text-[10px] flex items-center justify-center">
                          AK
                        </div>
                        <div className="truncate flex-1">
                          <p className="text-[11px] font-bold leading-none">{data.farmName || 'Amar Khamar'}</p>
                          <p className="text-[9px] text-emerald-100/80">online</p>
                        </div>
                      </div>

                      {/* Chat Bubble Area */}
                      <div className="flex-1 bg-[#ECE5DD] p-2.5 overflow-y-auto rounded-b-xl flex flex-col justify-end">
                        <div className="bg-[#DCF8C6] text-slate-900 p-2.5 rounded-2xl rounded-tr-xs shadow-xs text-[11px] leading-relaxed max-w-[95%] self-end border border-emerald-100/60 font-sans whitespace-pre-wrap select-none">
                          {editedMessage}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 font-mono">
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-sky-600 inline" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Real-Time In-App Broadcast Progress Window */}
                {isBroadcasting && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl space-y-2.5 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                      <span>Sending to {broadcastProgress.currentName}...</span>
                      <span>{broadcastProgress.current} / {broadcastProgress.total} Staff</span>
                    </div>
                    <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${(broadcastProgress.current / (broadcastProgress.total || 1)) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dispatched directly through linked WhatsApp companion session without external browser popups.
                    </p>
                  </div>
                )}

                {/* Results of Latest Broadcast */}
                {latestBroadcastLog && !isBroadcasting && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Broadcast Delivered Simultaneously</span>
                      </span>
                      <span className="font-mono text-emerald-800 font-bold">
                        {latestBroadcastLog.successfulCount} / {latestBroadcastLog.recipientsCount} Delivered
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {latestBroadcastLog.recipients.map((rec) => (
                        <div key={rec.id} className="bg-white p-2 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">{rec.name}</p>
                            <p className="text-[10px] text-slate-500">{rec.phone}</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            <span>{rec.deliveredAt}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Footer: Action Buttons */}
          <div className="p-4 sm:p-5 border-t border-emerald-100 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium truncate">
              {dispatchMode === 'simultaneous' ? (
                <span>
                  {msgLanguage === 'bn' ? 'নির্বাচিত কর্মী:' : 'Selected Staff:'}{' '}
                  <strong className="font-mono text-slate-800">{simultaneousRecipients.length} Personnel</strong>
                </span>
              ) : (
                <span>
                  {msgLanguage === 'bn' ? 'প্রাপকের নম্বর:' : 'Recipient Number:'}{' '}
                  <strong className="font-mono text-slate-800">{targetPhoneNumber || 'N/A'}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-end">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 transition active:scale-95 btn-interactive"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? (msgLanguage === 'bn' ? 'কপি হয়েছে' : 'Copied') : (msgLanguage === 'bn' ? 'কপি করুন' : 'Copy Text')}</span>
              </button>

              {dispatchMode === 'simultaneous' ? (
                /* Primary Simultaneous Dispatch Button (Direct in-app without external tabs) */
                <button
                  type="button"
                  onClick={handleExecuteSimultaneousBroadcast}
                  disabled={isBroadcasting || simultaneousRecipients.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition active:scale-95 btn-interactive shadow-sm disabled:opacity-60"
                >
                  <Send className="w-4 h-4 fill-white text-[#25D366]" />
                  <span>
                    {isBroadcasting
                      ? (msgLanguage === 'bn' ? 'একযোগে পাঠানো হচ্ছে...' : 'Broadcasting...')
                      : (msgLanguage === 'bn' ? '🚀 একযোগে সকল কর্মীকে পাঠান' : '🚀 Send to All Staff Simultaneously')}
                  </span>
                </button>
              ) : (
                /* Single Staff Dispatch Buttons */
                <>
                  <button
                    type="button"
                    onClick={handleOpenSms}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition active:scale-95 btn-interactive shadow-xs"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>SMS</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenIndividualWhatsApp}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#25D366] hover:bg-[#1EBE5D] transition active:scale-95 btn-interactive shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
                    <span>{msgLanguage === 'bn' ? 'হোয়াটসঅ্যাপে পাঠান' : 'Send via WhatsApp'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp QR Linking Companion Modal */}
      <WhatsAppQrLinkModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onSessionChange={(newSession) => setWaSession(newSession)}
        farmName={data.farmName}
        language={msgLanguage}
      />
    </>
  );
};
