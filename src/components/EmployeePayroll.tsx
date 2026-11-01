import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFarm } from '../context/FarmContext';
import { Employee } from '../types/farm';
import { formatCurrency } from '../i18n/translations';
import { AccuratePieChart, PieDataPoint } from './charts/AccuratePieChart';
import { Users, Plus, CheckCircle2, Clock, DollarSign, PieChart as PieChartIcon, MessageSquare, Pencil, BarChart3, Send } from 'lucide-react';
import { DispatchTemplateType } from '../services/staffDispatchService';
import { getBroadcastLogs, BroadcastLog } from '../services/whatsappGatewayService';
import { toast } from 'sonner';

const COMMON_ROLES_EN = [
  'Senior Herdsman',
  'Farm Supervisor',
  'Milker & Caretaker',
  'Feed & Fodder Handler',
  'Veterinary Assistant'
];

const COMMON_ROLES_BN = [
  'প্রধান রাখাল',
  'খামার তত্ত্বাবধায়ক',
  'দুগ্ধ দোহনকারী',
  'খাদ্য ও ঘাস ব্যবস্থাপক',
  'পশুচিকিৎসা সহকারী'
];

interface EmployeePayrollProps {
  onOpenDispatch?: (template?: DispatchTemplateType, employeeId?: string) => void;
}

export const EmployeePayroll: React.FC<EmployeePayrollProps> = ({ onOpenDispatch }) => {
  const { data, t, language, addEmployee, updateEmployee, recordPayment } = useFarm();

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const backdropMouseDownRef = useRef(false);

  // Live Staff Dispatch History logs for Task Completion Chart
  const [dispatchLogs, setDispatchLogs] = useState<BroadcastLog[]>(() => getBroadcastLogs());

  useEffect(() => {
    const refreshLogs = () => {
      setDispatchLogs(getBroadcastLogs());
    };
    window.addEventListener('amar-khamar-dispatch-updated', refreshLogs);
    return () => window.removeEventListener('amar-khamar-dispatch-updated', refreshLogs);
  }, []);

  // Add Staff form
  const [staffName, setStaffName] = useState('');
  const [role, setRole] = useState('Senior Herdsman');
  const [baseSalary, setBaseSalary] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [phone, setPhone] = useState('');

  // Edit Staff form
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSalary, setEditSalary] = useState('');

  // Record Payment form
  const [payMonth, setPayMonth] = useState('2026-10');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payStatus, setPayStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [payNotes, setPayNotes] = useState('');

  // Payroll calculations
  const totalMonthlyCommitment = useMemo(() => {
    return data.employees
      .filter((e) => e.status === 'Active')
      .reduce((sum, e) => sum + (e.baseSalary || 0), 0);
  }, [data.employees]);

  const totalPaidThisMonth = useMemo(() => {
    return data.employees.reduce((sum, e) => {
      const monthPaid = e.payments
        .filter((p) => p.month === '2026-10' && p.status === 'Paid')
        .reduce((pSum, p) => pSum + p.amount, 0);
      return sum + monthPaid;
    }, 0);
  }, [data.employees]);

  const totalPendingPayroll = useMemo(() => {
    return data.employees.reduce((sum, e) => {
      const pending = e.payments
        .filter((p) => p.status === 'Pending')
        .reduce((pSum, p) => pSum + p.amount, 0);
      return sum + pending;
    }, 0);
  }, [data.employees]);

  // Accurate Pie Chart for Payroll Allocation per Staff
  const payrollPieData: PieDataPoint[] = useMemo(() => {
    const shades = ['#047857', '#10B981', '#34D399', '#064E3B', '#6EE7B7'];
    return data.employees.map((emp, idx) => ({
      label: emp.name,
      value: emp.baseSalary,
      color: shades[idx % shades.length],
      subLabel: emp.role
    }));
  }, [data.employees]);

  // Compute Completed Tasks per Employee from Staff Dispatch History
  const employeeTaskChartData = useMemo(() => {
    const barColors = ['#047857', '#10B981', '#059669', '#34D399', '#065F46'];
    const items = data.employees.map((emp, idx) => {
      let completedCount = 0;
      const byCategory: Record<string, number> = {
        feed: 0,
        vaccine: 0,
        weigh: 0,
        salary: 0,
        emergency: 0
      };

      (dispatchLogs || []).forEach((log) => {
        if (!log || !Array.isArray(log.recipients)) return;
        const matchedRecipient = log.recipients.find((r) => {
          if (!r) return false;
          if (r.id && emp.id && r.id === emp.id) return true;
          if (r.name && emp.name && typeof r.name === 'string' && typeof emp.name === 'string') {
            return r.name.trim().toLowerCase() === emp.name.trim().toLowerCase();
          }
          return false;
        });

        if (matchedRecipient && matchedRecipient.status === 'delivered') {
          completedCount += 1;
          const cat = log.templateType || 'feed';
          byCategory[cat] = (byCategory[cat] || 0) + 1;
        }
      });

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role || 'Staff',
        completedCount,
        byCategory,
        color: barColors[idx % barColors.length]
      };
    });

    const maxTasks = Math.max(...items.map((i) => i.completedCount), 1);
    const totalTasksCompleted = items.reduce((sum, i) => sum + i.completedCount, 0);

    return {
      items,
      maxTasks,
      totalTasksCompleted
    };
  }, [data.employees, dispatchLogs]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) {
      toast.error(language === 'bn' ? 'দয়া করে কর্মচারীর নাম লিখুন' : 'Please enter the staff name');
      return;
    }

    if (!phone.trim()) {
      toast.error(
        language === 'bn'
          ? 'দয়া করে কর্মীর মোবাইল নম্বর দিন (হোয়াটসঅ্যাপ ও এসএমএস এর মাধ্যমে সরাসরি বার্তা পাঠানোর জন্য প্রয়োজন)'
          : 'Please enter the employee mobile phone number for automated WhatsApp & SMS dispatch'
      );
      return;
    }

    addEmployee({
      name: staffName.trim(),
      role: role.trim() || (language === 'bn' ? 'খামার সহকারী' : 'Farm Herdsman'),
      baseSalary: parseFloat(baseSalary) || 15000,
      joinDate,
      phone: phone.trim(),
      status: 'Active'
    });

    setStaffName('');
    setBaseSalary('');
    setPhone('');
    setRole(language === 'bn' ? 'প্রধান রাখাল' : 'Senior Herdsman');
    setShowAddStaffModal(false);
  };

  const openEditStaff = (emp: Employee) => {
    setEditingEmp(emp);
    setEditName(emp.name);
    setEditRole(emp.role);
    setEditPhone(emp.phone || '');
    setEditSalary(emp.baseSalary.toString());
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    updateEmployee(editingEmp.id, {
      name: editName.trim(),
      role: editRole.trim(),
      phone: editPhone.trim() || undefined,
      baseSalary: parseFloat(editSalary) || editingEmp.baseSalary
    });
    setEditingEmp(null);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !payAmount) return;

    recordPayment(selectedEmpId, {
      month: payMonth,
      amount: parseFloat(payAmount) || 0,
      paymentDate: payDate,
      status: payStatus,
      notes: payNotes.trim() || undefined
    });

    setPayAmount('');
    setPayNotes('');
    setShowPayModal(false);
  };

  const openPayForStaff = (emp: Employee) => {
    setSelectedEmpId(emp.id);
    setPayAmount(emp.baseSalary.toString());
    setShowPayModal(true);
  };

  const categoryLabels: Record<string, { en: string; bn: string }> = {
    feed: { en: 'Feed', bn: 'খাদ্য' },
    vaccine: { en: 'Vaccine', bn: 'টিকা' },
    weigh: { en: 'Weigh-in', bn: 'ওজন' },
    salary: { en: 'Payroll', bn: 'বেতন' },
    emergency: { en: 'Alert', bn: 'জরুরি' }
  };

  return (
    <div className="space-y-7 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">{t.payroll}</h1>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
            {language === 'bn'
              ? 'খামার কর্মচারী ডিরেক্টরি এবং মাসিক বেতন ও মজুরি খতিয়ান'
              : 'Staff directory, role assignments, and monthly salary disbursement records'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onOpenDispatch?.('salary')}
            className="flex items-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] border border-[#25D366]/40 font-bold px-4 py-2.5 rounded-2xl text-xs transition active:scale-[0.98] btn-interactive"
            title="Open WhatsApp & SMS Staff Dispatch Hub"
          >
            <MessageSquare className="w-4 h-4 text-[#1EBE5D]" />
            <span>{language === 'bn' ? 'স্টাফ বার্তা (WhatsApp)' : 'Staff Dispatch (WhatsApp)'}</span>
          </button>

          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-xs active:scale-[0.98] btn-interactive"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.addStaff}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in White & Green Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Payroll Budget</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {formatCurrency(totalMonthlyCommitment, language)}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{data.employees.length} active personnel</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t.totalPaidThisMonth}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-700 tabular-nums">
              {formatCurrency(totalPaidThisMonth, language)}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Disbursed for current month</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-3 card-lift stagger-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">{t.pendingSalaries}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-900 tabular-nums">
              {formatCurrency(totalPendingPayroll, language)}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Pending disbursement</p>
          </div>
        </div>
      </div>

      {/* ANALYTICS ROW: Employee Task Completion Chart (7 Cols) & Salary Allocation Pie Chart (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employee Task Completion Chart from Staff Dispatch History (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-5 overflow-hidden card-lift">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-50">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-700 shrink-0" />
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {language === 'bn'
                    ? 'কর্মীদের সম্পন্নকৃত কাজের চার্ট (ডিসপ্যাচ খতিয়ান)'
                    : 'Staff Task Completion Chart'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn'
                  ? 'স্টাফ ডিসপ্যাচ হিস্ট্রি অনুযায়ী কোন কর্মী কতটি কাজ সম্পন্ন করেছেন তার চিত্র'
                  : 'Visual breakdown of completed tasks per employee based on staff dispatch history'}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs font-extrabold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl tabular-nums">
                {employeeTaskChartData.totalTasksCompleted}{' '}
                {language === 'bn' ? 'টি কাজ সম্পন্ন' : 'Tasks Completed'}
              </span>
            </div>
          </div>

          {/* Horizontal Bar Chart Rows */}
          <div className="space-y-4 py-1">
            {employeeTaskChartData.items.map((item) => {
              const barWidthPercent =
                employeeTaskChartData.maxTasks > 0
                  ? Math.max(8, Math.round((item.completedCount / employeeTaskChartData.maxTasks) * 100))
                  : 8;
              const sharePercent =
                employeeTaskChartData.totalTasksCompleted > 0
                  ? Math.round((item.completedCount / employeeTaskChartData.totalTasksCompleted) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-emerald-100/80 hover:border-emerald-300 hover:bg-emerald-50/30 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md truncate">
                          {item.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {item.completedCount}{' '}
                        <span className="text-xs font-semibold text-slate-500">
                          {language === 'bn' ? 'টি কাজ' : item.completedCount === 1 ? 'task' : 'tasks'}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded-md border border-emerald-300/60 tabular-nums">
                        {sharePercent}%
                      </span>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-3 bg-emerald-100/70 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${item.completedCount === 0 ? 3 : barWidthPercent}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>

                  {/* Task Breakdown by Dispatch Template Type & Quick Dispatch Action */}
                  <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Object.entries(item.byCategory)
                        .filter(([, count]) => count > 0)
                        .map(([cat, count]) => (
                          <span
                            key={cat}
                            className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg tabular-nums"
                          >
                            {language === 'bn' ? categoryLabels[cat]?.bn || cat : categoryLabels[cat]?.en || cat}: {count}
                          </span>
                        ))}
                      {item.completedCount === 0 && (
                        <span className="text-[11px] text-slate-400">
                          {language === 'bn' ? 'এখনও কোনো ডিসপ্যাচ রেকর্ড নেই' : 'No dispatched tasks logged yet'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onOpenDispatch?.('feed', item.id)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-emerald-100/70 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>{language === 'bn' ? 'কাজ পাঠান' : 'Dispatch Task'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-emerald-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              {language === 'bn'
                ? `মোট ${dispatchLogs.length} টি ডিসপ্যাচ লগ থেকে সংকলিত`
                : `Aggregated from ${dispatchLogs.length} staff dispatch logs`}
            </span>
            <button
              onClick={() => onOpenDispatch?.('feed')}
              className="font-bold text-emerald-800 hover:underline"
            >
              {language === 'bn' ? 'নতুন ব্রডকাস্ট পাঠান →' : 'New Broadcast Dispatch →'}
            </button>
          </div>
        </div>

        {/* Accurate Pie Chart: Payroll Budget Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 md:p-7 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 overflow-hidden card-lift">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {language === 'bn' ? 'বেতন বরাদ্দ ও বণ্টন পাই চার্ট' : 'Monthly Salary Allocation Chart'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {language === 'bn' ? 'প্রতি কর্মচারীর মাসিক বেতনের নিখুঁত শতকরা ভাগ' : 'Accurate individual salary weight in monthly budget'}
              </p>
            </div>
            <PieChartIcon className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>

          <div className="py-2 min-w-0 overflow-hidden">
            <AccuratePieChart
              data={payrollPieData}
              donut={true}
              size={180}
              currencyPrefix="৳ "
            />
          </div>

          <div className="pt-3 border-t border-emerald-50 flex items-center justify-between text-xs text-slate-500">
            <span>Total Monthly Payroll</span>
            <span className="font-bold text-slate-900 font-mono">{formatCurrency(totalMonthlyCommitment, language)}</span>
          </div>
        </div>
      </div>

      {/* Staff Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.employees.map((emp, idx) => {
          const recentPayments = emp.payments.slice(0, 3);
          const staggerClass = `stagger-${(idx % 6) + 1}`;
          return (
            <div
              key={emp.id}
              className={`bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 card-lift ${staggerClass}`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">{emp.name}</h3>
                    <p className="text-sm text-emerald-800 font-bold mt-1">{emp.role}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {emp.status}
                    </span>
                    <button
                      onClick={() => openEditStaff(emp)}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title={language === 'bn' ? 'তথ্য ও ফোন নম্বর এডিট করুন' : 'Edit Staff / Phone Number'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-emerald-50">
                    <span className="text-slate-500">{t.baseSalary}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{formatCurrency(emp.baseSalary, language)}/mo</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-emerald-50">
                    <span className="text-slate-500">{t.joinDate}</span>
                    <span className="font-mono text-slate-700">{emp.joinDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-emerald-50">
                    <span className="text-slate-500">{t.phone}</span>
                    {emp.phone ? (
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" title="WhatsApp Ready" />
                        <span className="font-mono font-bold text-slate-800">{emp.phone}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => openEditStaff(emp)}
                        className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md hover:bg-amber-100 transition"
                      >
                        + Add Mobile Number
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Payment Logs */}
                <div className="mt-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Recent Salary Logs
                  </span>
                  <div className="space-y-2">
                    {recentPayments.length === 0 ? (
                      <span className="text-sm text-slate-400">No payment logs recorded</span>
                    ) : (
                      recentPayments.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between text-sm p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100/60 transition-colors hover:bg-emerald-50"
                        >
                          <span className="font-mono text-slate-600">{p.month}</span>
                          <span className="font-bold tabular-nums text-slate-900">{formatCurrency(p.amount, language)}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            p.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-50 flex items-center gap-2">
                <button
                  onClick={() => openPayForStaff(emp)}
                  className="flex-1 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold py-2.5 text-xs transition flex items-center justify-center gap-1.5 border border-emerald-200 btn-interactive"
                >
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>{t.recordPayment}</span>
                </button>

                <button
                  onClick={() => onOpenDispatch?.('salary', emp.id)}
                  className="rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold py-2.5 px-3 text-xs transition flex items-center justify-center gap-1.5 border border-[#25D366]/40 btn-interactive shrink-0"
                  title={language === 'bn' ? 'হোয়াটসঅ্যাপে বেতন রশিদ পাঠান' : 'Send WhatsApp Salary Receipt'}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#1EBE5D]" />
                  <span>{language === 'bn' ? 'রশিদ পাঠান' : 'Receipt'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={(e) => {
            backdropMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (backdropMouseDownRef.current && e.target === e.currentTarget) {
              setShowAddStaffModal(false);
            }
            backdropMouseDownRef.current = false;
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
          >
            <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">{t.addStaff}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Register new farm personnel</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.staffName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Mokbul Mia"
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t.role} <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {language === 'bn' ? 'পদবী নির্বাচন করুন বা লিখুন' : 'Select or type custom role'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={role}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: প্রধান রাখাল / দুগ্ধ দোহনকারী' : 'e.g. Senior Herdsman / Milker / Supervisor'}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />

                {/* Quick Select Role Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {(language === 'bn' ? COMMON_ROLES_BN : COMMON_ROLES_EN).map((presetRole) => (
                    <button
                      key={presetRole}
                      type="button"
                      onClick={() => setRole(presetRole)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        role === presetRole
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {presetRole}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.baseSalary} (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    placeholder="e.g. 18000"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.joinDate}</label>
                  <input
                    type="date"
                    required
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t.phone} <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-emerald-700 font-bold">Required for WhatsApp Dispatch</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                  <div className="absolute right-3 top-3 text-[10px] font-bold text-[#1EBE5D] bg-[#25D366]/15 px-2 py-0.5 rounded-md pointer-events-none">
                    WhatsApp
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {language === 'bn' ? 'হোয়াটসঅ্যাপ ও এসএমএস এর মাধ্যমে সরাসরি কাজের নির্দেশিকা পাঠাতে কর্মীর ফোন নম্বর আবশ্যক।' : 'Phone number is required so you can dispatch feeding, healthcare, and salary messages directly to their phone.'}
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl btn-interactive"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs btn-interactive"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Record Payment Modal */}
      {showPayModal && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={(e) => {
            backdropMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (backdropMouseDownRef.current && e.target === e.currentTarget) {
              setShowPayModal(false);
            }
            backdropMouseDownRef.current = false;
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
          >
            <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">{t.recordPayment}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Staff: <span className="font-bold text-emerald-900">{data.employees.find(e => e.id === selectedEmpId)?.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.paymentMonth}</label>
                  <input
                    type="month"
                    required
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs font-bold tabular-nums focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.paymentDate}</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status</label>
                  <select
                    value={payStatus}
                    onChange={(e) => setPayStatus(e.target.value as 'Paid' | 'Pending')}
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="Paid">{t.statusPaid}</option>
                    <option value="Pending">{t.statusPending}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.notes}</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Cash disbursed with performance bonus"
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl btn-interactive"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs btn-interactive"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Staff & Phone Number Modal */}
      {editingEmp && typeof document !== 'undefined' && createPortal(
        <div
          onMouseDown={(e) => {
            backdropMouseDownRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            if (backdropMouseDownRef.current && e.target === e.currentTarget) {
              setEditingEmp(null);
            }
            backdropMouseDownRef.current = false;
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto anim-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden my-auto anim-modal-card"
          >
            <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  {language === 'bn' ? 'কর্মীর তথ্য ও ফোন নম্বর সম্পাদনা' : 'Edit Staff & Mobile Number'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Update contact details for WhatsApp simultaneous dispatch
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.staffName} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t.role} <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {language === 'bn' ? 'পদবী নির্বাচন করুন বা লিখুন' : 'Select or type custom role'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={editRole}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />

                {/* Quick Select Role Chips */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {(language === 'bn' ? COMMON_ROLES_BN : COMMON_ROLES_EN).map((presetRole) => (
                    <button
                      key={presetRole}
                      type="button"
                      onClick={() => setEditRole(presetRole)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        editRole === presetRole
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold shadow-2xs'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {presetRole}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t.phone} <span className="text-rose-500">*</span></span>
                  <span className="text-[11px] text-emerald-700 font-bold">WhatsApp Ready</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+880 1711-000000"
                    className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                  <div className="absolute right-3 top-3 text-[10px] font-bold text-[#1EBE5D] bg-[#25D366]/15 px-2 py-0.5 rounded-md pointer-events-none">
                    WhatsApp
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t.baseSalary} (৳)
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl btn-interactive"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition shadow-xs btn-interactive"
                >
                  {language === 'bn' ? 'আপডেট করুন' : 'Update Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
