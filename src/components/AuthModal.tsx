import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { FarmLogo } from './FarmLogo';
import { Eye, EyeOff, Lock, Mail, X, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, isGuest, signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest, signOutUser } = useAuth();
  const { t, language } = useFarm();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isRegister) {
        await signUpWithEmail(email, password);
        toast.success(language === 'bn' ? 'অ্যাকাউন্ট তৈরি সফল হয়েছে!' : 'Account registered successfully!');
      } else {
        await signInWithEmail(email, password);
        toast.success(language === 'bn' ? 'স্বাগতম!' : 'Welcome back!');
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success(language === 'bn' ? 'গুগল দিয়ে সাইন ইন সফল!' : 'Signed in with Google!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    toast.info(language === 'bn' ? 'গেস্ট মোড শুরু হয়েছে' : 'Continuing in Guest mode');
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs anim-modal-backdrop"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-emerald-100 overflow-hidden anim-modal-card">
        {/* Header */}
        <div className="bg-white border-b border-emerald-100 p-6 text-slate-900 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-3">
            <FarmLogo size={48} className="ring-4 ring-emerald-500/20" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-emerald-950">{t.appName}</h2>
          <p className="text-xs text-emerald-700 font-medium mt-1 leading-relaxed">{t.appSubtitle}</p>
        </div>

        {/* User is already signed in view */}
        {user ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'bn' ? 'লগইন সচল আছে' : 'Currently Signed In'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono break-all">{user.email || user.displayName || user.uid}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => onClose()}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                {language === 'bn' ? 'অ্যাপে ফিরে যান' : 'Back to Farm'}
              </button>
              <button
                onClick={async () => {
                  await signOutUser();
                  toast.info(language === 'bn' ? 'লগআউট সম্পন্ন' : 'Signed out');
                  onClose();
                }}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                {t.signOut}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.signIn}
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Register'}
              </button>
            </div>

            {/* Google Sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition active:scale-[0.99] btn-interactive"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{language === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs text-slate-400">
                <span className="bg-white px-2">{language === 'bn' ? 'অথবা ইমেইল দিয়ে' : 'or with email'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@amarkhamar.com"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-10 py-2 text-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition active:scale-[0.99] flex items-center justify-center gap-1.5 btn-interactive"
              >
                <span>{isRegister ? (language === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Create Account') : t.signIn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Guest Access Alternative */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleGuest}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 btn-interactive"
              >
                <span>{language === 'bn' ? 'লগইন ছাড়া ডেমো দেখতে ক্লিক করুন' : 'Explore as Demo / Guest Mode'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
