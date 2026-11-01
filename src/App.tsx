/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { FarmLogo } from './components/FarmLogo';
import { DashboardView } from './components/DashboardView';
import { HerdRegistry } from './components/HerdRegistry';
import { AnimalDetailModal } from './components/AnimalDetailModal';
import { SellCattleModal } from './components/SellCattleModal';
import { AddCattleModal } from './components/AddCattleModal';
import { AddFeedModal } from './components/AddFeedModal';
import { HealthAnalytics } from './components/HealthAnalytics';
import { FeedInventory } from './components/FeedInventory';
import { EmployeePayroll } from './components/EmployeePayroll';
import { HerdArchive } from './components/HerdArchive';
import { ReportsBackup } from './components/ReportsBackup';
import { AuthModal } from './components/AuthModal';
import { OnboardingGuide } from './components/OnboardingGuide';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StaffDispatchModal } from './components/StaffDispatchModal';
import { SecurityResetModal } from './components/SecurityResetModal';
import { DispatchTemplateType } from './services/staffDispatchService';
import { Toaster } from 'sonner';

import { 
  LayoutDashboard, 
  Beef, 
  Stethoscope, 
  Wheat, 
  Users, 
  Archive, 
  FileText, 
  Languages, 
  User, 
  HelpCircle, 
  Cloud, 
  CloudOff, 
  Plus, 
  Menu, 
  X,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sun,
  MessageSquare
} from 'lucide-react';

function FarmApp() {
  const { data, t, language, setLanguage, syncStatus } = useFarm();
  const { user, isGuest } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);
  const [sellingCowId, setSellingCowId] = useState<string | null>(null);
  const [showAddCattleModal, setShowAddCattleModal] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showThemeHelp, setShowThemeHelp] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStaffDispatch, setShowStaffDispatch] = useState(false);
  const [showSecurityReset, setShowSecurityReset] = useState(false);
  const [dispatchTemplate, setDispatchTemplate] = useState<DispatchTemplateType>('feed');
  const [dispatchEmployeeId, setDispatchEmployeeId] = useState<string | undefined>(undefined);

  const handleOpenDispatch = (template: DispatchTemplateType = 'feed', employeeId?: string) => {
    setDispatchTemplate(template);
    setDispatchEmployeeId(employeeId);
    setShowStaffDispatch(true);
  };

  const selectedCow = data.cattle.find((c) => c.id === selectedCowId) || null;

  // Active cattle count
  const activeCount = data.cattle.filter((c) => c.status === 'Active').length;
  // Upcoming booster count
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  const upcomingBoosters = data.cattle
    .filter(c => c.status === 'Active')
    .flatMap(c => c.healthRecords || [])
    .filter(h => h.type === 'Vaccine' && h.nextBoosterDate && new Date(h.nextBoosterDate) <= thirtyDays).length;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'herd', label: t.herdRegistry, icon: Beef, badge: activeCount },
    { id: 'health', label: t.healthAnalytics, icon: Stethoscope, badge: upcomingBoosters > 0 ? `${upcomingBoosters}` : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
    { id: 'feed', label: t.feedInventory, icon: Wheat },
    { id: 'payroll', label: t.payroll, icon: Users },
    { id: 'sales', label: t.archive, icon: Archive },
    { id: 'reports', label: t.reports, icon: FileText },
  ];

  // Close modals on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCowId(null);
        setSellingCowId(null);
        setShowAddCattleModal(false);
        setShowFeedModal(false);
        setShowAuthModal(false);
        setShowOnboarding(false);
        setShowThemeHelp(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased ${language === 'bn' ? 'lang-bn' : ''}`}>
      {/* ----------------- DESKTOP SIDEBAR (md+) ----------------- */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 sticky top-0 h-screen z-30 transition-all duration-300">
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FarmLogo size={40} />
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
                {t.appName}
              </h1>
              <p className="text-xs text-emerald-800 font-bold leading-tight mt-0.5">
                {language === 'bn' ? 'স্মার্ট এগ্রো-টেক' : 'Agro-Tech Manager'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 btn-interactive ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 translate-x-1'
                    : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-950 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-emerald-700'}`} />
                  <span className="leading-relaxed">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums transition-all ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick Staff Dispatch & 4-Layer Security Reset Triggers */}
          <div className="pt-2 space-y-1.5">
            <button
              onClick={() => handleOpenDispatch('feed')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-bold text-xs transition border border-[#25D366]/40 btn-interactive"
              title="Dispatch Daily Tasks to Farm Staff via WhatsApp & SMS"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#1EBE5D]" />
                <span>{language === 'bn' ? 'স্টাফ বার্তা কেন্দ্র' : 'Staff Dispatch'}</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#25D366] text-white">
                WA/SMS
              </span>
            </button>

            <button
              onClick={() => setShowSecurityReset(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-rose-50/70 hover:bg-rose-100 text-rose-800 font-bold text-xs transition border border-rose-200/80 btn-interactive"
              title="Open 4-Layer Security Master Reset Vault"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{language === 'bn' ? 'সম্পূর্ণ রিসেট (৪-স্তর)' : 'Reset All Data'}</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-600 text-white">
                4-LOCK
              </span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-emerald-50 space-y-3 bg-white">
          {/* PWA Install */}
          <PWAInstallButton variant="sidebar" />

          {/* Sync & Connectivity Status */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-600">
            <div className="flex items-center gap-1.5">
              {syncStatus === 'synced' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-medium">{t.synced}</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="text-amber-600 font-medium">{t.syncing}</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.guestMode}</span>
                </>
              )}
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Help & Tour"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Indicator & Dark Reader Helper */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
            <div className="flex items-center gap-1.5 font-medium text-emerald-900">
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-300" />
              <span>{language === 'bn' ? 'সাদা ও সবুজ থিম' : 'White & Green'}</span>
            </div>
            <button
              onClick={() => setShowThemeHelp(true)}
              className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold underline"
              title="Theme settings"
            >
              {language === 'bn' ? 'সাহায্য' : 'Help'}
            </button>
          </div>

          {/* Language Switcher & User Account */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            {/* 1-Click Language Switcher */}
            <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md transition ${
                  language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2.5 py-1 rounded-md transition ${
                  language === 'bn' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* User Profile / Login */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="max-w-[70px] truncate">
                {user ? (user.displayName || user.email?.split('@')[0] || 'User') : t.signIn}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MOBILE TOP APP HEADER (<md) ----------------- */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FarmLogo size={34} />
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">{t.appName}</h1>
            <span className="text-xs text-emerald-700 font-semibold">{t.myFarm}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Helper Button */}
          <button
            onClick={() => setShowThemeHelp(true)}
            className="p-1.5 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            title="Theme Settings"
          >
            <Sun className="w-4 h-4 fill-amber-300" />
          </button>

          {/* Mobile Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700"
          >
            {language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {/* Quick Add Cattle */}
          <button
            onClick={() => {
              handleTabChange('herd');
              setShowAddCattleModal(true);
            }}
            className="p-1.5 rounded-lg bg-emerald-600 text-white"
            title={t.addCattle}
          >
            <Plus className="w-4.5 h-4.5" />
          </button>

          {/* User Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <User className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* ----------------- MAIN VIEWPORT CONTENT ----------------- */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <div key={activeTab} className="anim-view">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToTab={handleTabChange}
              onOpenAddCattle={() => setShowAddCattleModal(true)}
              onOpenFeedModal={() => setShowFeedModal(true)}
              onOpenSaleModal={(cowId) => setSellingCowId(cowId || null)}
              onSelectCow={(cowId) => setSelectedCowId(cowId)}
              onOpenDispatch={handleOpenDispatch}
            />
          )}

          {activeTab === 'herd' && (
            <HerdRegistry
              onSelectCow={(cowId) => setSelectedCowId(cowId)}
              onOpenSellModal={(cowId) => setSellingCowId(cowId)}
              isOpenAddModal={showAddCattleModal}
              onCloseAddModal={() => setShowAddCattleModal(false)}
              onOpenAddModal={() => setShowAddCattleModal(true)}
            />
          )}

          {activeTab === 'health' && (
            <HealthAnalytics onSelectCow={(cowId) => setSelectedCowId(cowId)} />
          )}

          {activeTab === 'feed' && (
            <FeedInventory
              isOpenAddModal={showFeedModal}
              onCloseAddModal={() => setShowFeedModal(false)}
              onOpenAddModal={() => setShowFeedModal(true)}
            />
          )}

          {activeTab === 'payroll' && (
            <EmployeePayroll onOpenDispatch={handleOpenDispatch} />
          )}

          {activeTab === 'sales' && (
            <HerdArchive onSelectCow={(cowId) => setSelectedCowId(cowId)} />
          )}

          {activeTab === 'reports' && <ReportsBackup />}
        </div>
      </main>

      {/* ----------------- MOBILE BOTTOM NAVIGATION BAR (<md) ----------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] min-h-[44px] justify-center transition-all duration-200 btn-interactive relative ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-xs font-medium mt-0.5">{t.dashboard}</span>
          {activeTab === 'dashboard' && (
            <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-emerald-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('herd')}
          className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] min-h-[44px] justify-center transition-all duration-200 btn-interactive relative ${
            activeTab === 'herd' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Beef className={`w-5 h-5 transition-transform ${activeTab === 'herd' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-xs font-medium mt-0.5">{t.herdRegistry.split(' ')[0]}</span>
          {activeCount > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white anim-live-pulse" />
          )}
          {activeTab === 'herd' && (
            <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-emerald-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('health')}
          className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] min-h-[44px] justify-center transition-all duration-200 btn-interactive relative ${
            activeTab === 'health' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className={`w-5 h-5 transition-transform ${activeTab === 'health' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-xs font-medium mt-0.5">{language === 'bn' ? 'চিকিৎসা' : 'Health'}</span>
          {upcomingBoosters > 0 && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white anim-live-pulse" />
          )}
          {activeTab === 'health' && (
            <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-emerald-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => handleTabChange('feed')}
          className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] min-h-[44px] justify-center transition-all duration-200 btn-interactive relative ${
            activeTab === 'feed' ? 'text-emerald-700 font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wheat className={`w-5 h-5 transition-transform ${activeTab === 'feed' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-xs font-medium mt-0.5">{t.feedInventory.split(' ')[0]}</span>
          {activeTab === 'feed' && (
            <span className="absolute bottom-0 w-3 h-0.5 rounded-full bg-emerald-600 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center py-1.5 px-2 min-w-[56px] min-h-[44px] justify-center transition-all duration-200 btn-interactive ${
            mobileMenuOpen ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-medium mt-0.5">{language === 'bn' ? 'মেনু' : 'Menu'}</span>
        </button>
      </div>

      {/* Mobile "More Menu" Drawer / Bottom Sheet */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FarmLogo size={28} />
                <span className="text-base font-bold text-slate-900">{t.appName}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => handleTabChange('payroll')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4.5 h-4.5 text-blue-600" />
                  <span>{t.payroll}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleTabChange('sales')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Archive className="w-4.5 h-4.5 text-amber-600" />
                  <span>{t.archive}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleTabChange('reports')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t.reports}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenDispatch('feed');
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-sm font-bold text-[#128C7E] border border-[#25D366]/30"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4.5 h-4.5 text-[#1EBE5D]" />
                  <span>{language === 'bn' ? 'স্টাফ বার্তা কেন্দ্র (WhatsApp/SMS)' : 'Staff Dispatch (WhatsApp/SMS)'}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#25D366] text-white">WA</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowOnboarding(true);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-4.5 h-4.5 text-emerald-600" />
                  <span>{language === 'bn' ? 'ব্যবহারবিধি গাইড' : 'Onboarding Guide'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <PWAInstallButton variant="compact" />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAuthModal(true);
                }}
                className="text-xs font-semibold text-emerald-700 py-2 px-3 rounded-lg hover:bg-emerald-50"
              >
                {user ? (user.displayName || user.email) : t.signIn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      <AnimalDetailModal
        cow={selectedCow}
        onClose={() => setSelectedCowId(null)}
        onOpenSellModal={(cowId) => setSellingCowId(cowId)}
      />

      <SellCattleModal
        cowId={sellingCowId}
        onClose={() => setSellingCowId(null)}
      />

      <AddCattleModal
        isOpen={showAddCattleModal}
        onClose={() => setShowAddCattleModal(false)}
      />

      <AddFeedModal
        isOpen={showFeedModal}
        onClose={() => setShowFeedModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <StaffDispatchModal
        isOpen={showStaffDispatch}
        onClose={() => setShowStaffDispatch(false)}
        initialTemplate={dispatchTemplate}
        initialEmployeeId={dispatchEmployeeId}
      />

      <SecurityResetModal
        isOpen={showSecurityReset}
        onClose={() => setShowSecurityReset(false)}
        initialMode="wipe"
      />

      {showOnboarding && (
        <OnboardingGuide
          onClose={() => setShowOnboarding(false)}
          onNavigateToTab={handleTabChange}
        />
      )}

      {/* Pure White & Emerald Theme Helper Modal */}
      {showThemeHelp && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowThemeHelp(false);
          }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 anim-modal-backdrop"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 anim-modal-card">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500 fill-amber-300" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'bn' ? 'সাদা ও সবুজ থিম নির্দেশিকা' : 'Pure White & Emerald Theme Guide'}
                </h3>
              </div>
              <button 
                onClick={() => setShowThemeHelp(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 btn-interactive"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="py-4 space-y-3.5 text-xs text-slate-700 leading-relaxed">
              <p>
                {language === 'bn' 
                  ? 'আমার খামার অ্যাপ্লিকেশনটি একটি বিশুদ্ধ সাদা ব্যাকগ্রাউন্ড ও সবুজ অ্যাকসেন্টে (White & Emerald) তৈরি করা হয়েছে যাতে রোদ কিংবা আলোতে পরিষ্কার দেখা যায়।' 
                  : 'Amar Khamar is built strictly in a crisp White background and Emerald Green agro-tech theme for maximum contrast and readability.'}
              </p>

              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>⚠️</span>
                  <span>{language === 'bn' ? 'স্ক্রিন কি এখনও ডার্ক বা কালো দেখাচ্ছে?' : 'Is your screen still rendering dark?'}</span>
                </p>
                <p>
                  {language === 'bn'
                    ? 'আপনার ব্রাউজারে "Dark Reader" এক্সটেনশন অথবা ব্রাউজারের অটো ডার্ক মোড চালু থাকলে তা ওয়েবসাইটটির সাদা ব্যাকগ্রাউন্ড পরিবর্তন করে কালো বানিয়ে দেয়। Dark Reader বন্ধ করতে কীবোর্ডে Alt + Shift + D চাপুন অথবা ব্রাউজার এক্সটেনশন থেকে Dark Reader বন্ধ করুন।'
                    : 'Your browser has a "Dark Reader" extension or Auto Dark Mode active, which forces white web pages to invert into dark colors. To see the true white theme, toggle off Dark Reader for this tab (shortcut: Alt + Shift + D).'}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-xs font-medium">
                ✅ {language === 'bn' ? 'আমরা ব্রাউজারের জন্য color-scheme: only light এবং darkreader-lock কোড সক্রিয় করেছি।' : 'color-scheme: only light and darkreader-lock headers are actively enforced.'}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowThemeHelp(false)}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition btn-interactive"
              >
                {language === 'bn' ? 'ঠিক আছে, বুঝেছি' : 'Got it, Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Toast Notification Provider */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FarmProvider>
        <FarmApp />
      </FarmProvider>
    </AuthProvider>
  );
}
