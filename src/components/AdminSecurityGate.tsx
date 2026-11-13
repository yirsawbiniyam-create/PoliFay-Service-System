import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Smartphone,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { CommissionSettings } from '../types';
import { soundEffects } from '../utils/audio';

interface AdminSecurityGateProps {
  settings: CommissionSettings;
  onAuthenticated: () => void;
  onNavigateToStaffPortal: () => void;
  onNavigateToVisitorPortal: () => void;
}

export const AdminSecurityGate: React.FC<AdminSecurityGateProps> = ({
  settings,
  onAuthenticated,
  onNavigateToStaffPortal,
  onNavigateToVisitorPortal,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const expectedPin = settings.adminPin || '1992';

  const handleVerifyPin = (pinToTest?: string) => {
    if (lockoutSeconds > 0) return;
    setErrorMsg(null);

    const val = (pinToTest || pinInput).trim();
    if (!val) {
      setErrorMsg('እባክዎ የአስተዳዳሪ የይለፍ ቃል (PIN) ያስገቡ!');
      return;
    }

    if (val === expectedPin) {
      soundEffects.playSuccessChime();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('bgr_police_admin_auth', 'true');
      }
      onAuthenticated();
    } else {
      soundEffects.playErrorBuzz();
      const nextFailed = failedAttempts + 1;
      setFailedAttempts(nextFailed);
      setPinInput('');

      if (nextFailed >= 4) {
        setLockoutSeconds(30);
        setErrorMsg('ተደጋጋሚ የተሳሳተ ሙከራ! ደህንነትን ለመጠበቅ ለ30 ሰከንድ ታግዷል!');
      } else {
        setErrorMsg(`የተሳሳተ ፒን! የቀረዎት ሙከራ፡ ${4 - nextFailed}`);
      }
    }
  };

  const handleKeyPress = (num: string) => {
    if (lockoutSeconds > 0) return;
    if (pinInput.length < 8) {
      const updated = pinInput + num;
      setPinInput(updated);
      if (updated.length === expectedPin.length) {
        handleVerifyPin(updated);
      }
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds > 0) return;
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Security Card */}
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Ethiopian Flag colored accent bar */}
        <div className="h-2 w-full flex rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-emerald-600"></div>
          <div className="h-full w-1/3 bg-yellow-400"></div>
          <div className="h-full w-1/3 bg-rose-600"></div>
        </div>

        {/* Crest & Header */}
        <div className="text-center space-y-2">
          <div className="relative mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 to-amber-200 shadow-xl shadow-amber-500/20">
            <img
              src={settings.logoUrl}
              alt="Police Crest"
              className="w-full h-full rounded-full object-cover bg-slate-950"
            />
            <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full border-2 border-slate-900 shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-serif tracking-tight">
            {settings.commissionName}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>የአስተዳዳሪ (Admin) ጥብቅ የደህንነት ማረጋገጫ</span>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>ጥብቅ የደህንነት ማስጠንቀቂያ (Security Lockdown)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            በግድግዳ ላይ የተለጠፉትን ስካን ያደረጉ ሰራተኞችና ባለጉዳዮች ወደዚህ የአድሚን ገጽ እንዳይገቡና የሌላን መረጃ እንዳያዩ ታግደዋል። ይህ ገጽ ለተፈቀደላቸው የስራ ኃላፊዎች ብቻ ነው።
          </p>
        </div>

        {/* PIN Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyPin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 text-center">
              የአስተዳዳሪ ሚስጥር ፒን (Admin PIN)
            </label>
            <div className="relative flex items-center">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoFocus
                disabled={lockoutSeconds > 0}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="****"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-amber-500 rounded-2xl py-3 px-4 text-center text-xl font-mono tracking-widest text-white outline-none transition-colors shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                title={showPin ? 'ደብቅ' : 'አሳይ'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-1">
              (ይፋዊ የመጀመሪያ የአድሚን ፒን፡ {expectedPin})
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 text-center font-bold animate-in fade-in duration-150">
              {errorMsg}
            </div>
          )}

          {lockoutSeconds > 0 && (
            <div className="text-center font-mono text-xs font-bold text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/30">
              እባክዎ ይጠብቁ፡ {lockoutSeconds} ሰከንድ...
            </div>
          )}

          {/* On-screen Numeric Keypad for Touch / Mobile */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
              <button
                key={key}
                type="button"
                disabled={lockoutSeconds > 0}
                onClick={() => {
                  if (key === 'C') {
                    setPinInput('');
                    setErrorMsg(null);
                  } else if (key === '⌫') {
                    handleBackspace();
                  } else {
                    handleKeyPress(key);
                  }
                }}
                className={`py-3 rounded-xl text-base font-bold font-mono transition-all cursor-pointer ${
                  key === 'C'
                    ? 'bg-rose-950/50 text-rose-300 hover:bg-rose-900 border border-rose-800/40'
                    : key === '⌫'
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-slate-800/80 text-white hover:bg-slate-700 border border-slate-700/60 active:scale-95'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={lockoutSeconds > 0 || !pinInput}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>ወደ አድሚን ዳሽቦርድ ግባ</span>
          </button>
        </form>

        {/* Quick Diversion for Regular Citizens and Staff */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block text-center">
            አድሚን ካልሆኑ ወደ ሞባይል ስካነር ፖርታልዎ ይሂዱ፡
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onNavigateToStaffPortal}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>የሰራተኛ መግቢያ/መውጫ</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToVisitorPortal}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>የባለጉዳይ መስተንግዶ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
