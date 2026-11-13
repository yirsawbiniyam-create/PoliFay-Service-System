import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  LogIn,
  LogOut,
  AlertCircle,
  Building2,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { Staff, Department, CommissionSettings, AttendanceRecord } from '../types';
import { PoliceIdCard } from './PoliceIdCard';
import { recordMobileStaffAttendance, fetchPoliceIdFromRegistry } from '../services/dbService';
import { soundEffects } from '../utils/audio';
import { toEthiopianTime } from '../utils/ethiopianTime';

interface MobileStaffPortalProps {
  departments: Department[];
  settings: CommissionSettings;
  initialDeptId?: string;
  onClose?: () => void;
  staffList?: Staff[];
}

export const MobileStaffPortal: React.FC<MobileStaffPortalProps> = ({
  departments,
  settings,
  initialDeptId,
  onClose,
}) => {
  // Step 1: Enter ID Number
  // Step 2: Show Front & Back of Police ID Card
  // Step 3: Choose Check-In vs Check-Out
  // Step 4: Success confirmation screen
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [idInput, setIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedAction, setSelectedAction] = useState<'check_in' | 'check_out'>('check_in');
  const [resultRecord, setResultRecord] = useState<AttendanceRecord | null>(null);
  const [punctualityText, setPunctualityText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Department from wall scan
  const targetDept = departments.find((d) => d.id === initialDeptId) || departments[0];

  useEffect(() => {
    soundEffects.unlockAudio();
  }, []);

  // Handle Step 1 -> Step 2 (Isolated lookup: loads ONLY this officer's record)
  const handleVerifyId = async (targetId?: string) => {
    setErrorMsg(null);
    const query = (targetId || idInput).trim();
    if (!query) {
      setErrorMsg('እባክዎ የመታወቂያ ቁጥርዎን ያስገቡ!');
      return;
    }

    setIsVerifying(true);
    try {
      const found = await fetchPoliceIdFromRegistry(query);
      if (!found) {
        soundEffects.playErrorBuzz();
        setErrorMsg(`የፖሊስ መታወቂያ ቁጥር "${idInput}" በሲስተም ውስጥ አልተገኘም! እባክዎ በትክክል መጻፉን ያረጋግጡ።`);
        return;
      }

      soundEffects.playScanBeep();
      setSelectedStaff(found);
      setStep(2);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setErrorMsg('መረጃውን በመፈተሽ ላይ ችግር አጋጥሟል');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Step 3 Action Execution
  const handleExecuteAction = async (action: 'check_in' | 'check_out') => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    setSelectedAction(action);

    try {
      const res = await recordMobileStaffAttendance(
        selectedStaff,
        action,
        targetDept?.id,
        targetDept?.name
      );

      setResultRecord(res.record);
      setPunctualityText(res.punctualityLabel);

      if (action === 'check_in') {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playFarewellChime();
      }

      setStep(4);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setErrorMsg(err.message || 'መረጃውን በመመዝገብ ላይ ችግር አጋጥሟል');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setIdInput('');
    setErrorMsg(null);
    setSelectedStaff(null);
    setResultRecord(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 max-w-xl mx-auto font-sans">
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="w-12 h-12 rounded-full object-cover bg-slate-950 border-2 border-amber-500/50 shrink-0"
          />
          <div>
            <h1 className="text-sm font-extrabold text-amber-400 font-serif leading-tight">
              {settings.commissionName}
            </h1>
            <p className="text-[11px] text-slate-300 font-medium">
              የሰራተኞች የስራ መግቢያና መውጫ ፖርታል
            </p>
          </div>
        </div>

        {targetDept && (
          <div className="hidden xs:flex flex-col items-end text-right">
            <span className="text-[10px] text-slate-400">የተቃኘበት ክፍል</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {targetDept.name} {targetDept.roomNumber ? `(${targetDept.roomNumber})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            className={`h-2 rounded-full transition-all duration-300 ${
              step === num
                ? 'w-10 bg-amber-500'
                : step > num
                ? 'w-4 bg-emerald-500'
                : 'w-4 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* STEP 1: Enter ID Number Directly */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white font-serif">
              የፖሊስ መታወቂያ ቁጥርዎን ያስገቡ
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              በግድግዳው ላይ የተለጠፈውን ኪው አር ኮድ በስልክዎ ስላቃኙ እናመሰግናለን። እባክዎ የመታወቂያ ቁጥርዎን ሞልተው «ቀጣይ» ይበሉ።
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                የመታወቂያ ቁጥር / ባጅ ቁጥር (ID Number)
              </label>
              <input
                type="text"
                autoFocus
                value={idInput}
                onChange={(e) => {
                  setIdInput(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerifyId();
                }}
                placeholder="ለምሳሌ፡ BGR-POL-1600001 ወይም POL-1001"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3.5 text-base font-mono text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isVerifying || !idInput.trim()}
              onClick={() => handleVerifyId()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black py-3.5 rounded-2xl text-base shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>መታወቂያውን እየፈተሸ...</span>
                </>
              ) : (
                <>
                  <span>ቀጣይ (መታወቂያዬን አሳይ)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Show Front & Back of Official Digital Police ID */}
      {step === 2 && selectedStaff && (
        <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
              ✓ የኮሚሽኑ ትክክለኛ የፖሊስ አባል
            </span>
            <h2 className="text-lg font-black text-white font-serif">
              የዲጂታል መታወቂያ ካርድዎ (የፊት እና የኋላ ገጽ)
            </h2>
            <p className="text-xs text-slate-400">
              ካርዱን በመንካት የፊትና የኋላ ገጹን ማገላበጥ ይችላሉ።
            </p>
          </div>

          {/* Interactive Police Digital ID Card */}
          <div className="flex justify-center py-2">
            <div className="w-full max-w-md transform scale-[0.92] sm:scale-100 origin-top">
              <PoliceIdCard
                staff={selectedStaff}
                settings={settings}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setStep(1)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl text-xs sm:text-sm border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ተመለስ</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>ቀጣይ (ምርጫ)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Choose Check-In vs Check-Out */}
      {step === 3 && selectedStaff && (
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black text-white font-serif">
              እባክዎ የሚፈልጉትን ተግባር ይምረጡ
            </h2>
            <p className="text-xs text-slate-300">
              አባል፡ <span className="font-bold text-amber-300">{selectedStaff.rank} {selectedStaff.fullName}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: Check In */}
            <button
              disabled={isSubmitting}
              onClick={() => handleExecuteAction('check_in')}
              className="group bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 hover:from-emerald-900 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-110 transition-transform">
                <LogIn className="w-9 h-9" />
              </div>
              <span className="text-lg font-black text-white group-hover:text-emerald-300">
                ወደ ስራ መግቢያ
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                የጠዋት ወይም የቀኑን የስራ ሰዓት ለመመዝገብና ስራ ለመጀመር ይህንን ይጫኑ
              </p>
            </button>

            {/* OPTION 2: Check Out */}
            <button
              disabled={isSubmitting}
              onClick={() => handleExecuteAction('check_out')}
              className="group bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 hover:from-rose-900 border-2 border-rose-500/50 hover:border-rose-400 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 group-hover:scale-110 transition-transform">
                <LogOut className="w-9 h-9" />
              </div>
              <span className="text-lg font-black text-white group-hover:text-rose-300">
                ስራ ጨርሶ መውጫ
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                የቀኑን ስራ ጨርሰው ሲወጡ ይህንን በመጫን መውጫዎን ይመዝግቡ
              </p>
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ወደ መታወቂያ ካርዱ ተመለስ</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Result Screen */}
      {step === 4 && selectedStaff && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
          {/* Commission Logo */}
          <div className="relative">
            <img
              src={settings.logoUrl}
              alt="Commission Logo"
              className="w-24 h-24 rounded-full object-cover bg-slate-950 border-2 border-amber-400/70 shadow-2xl"
            />
          </div>

          {/* Huge Green Checkmark (በትልቅ ራይት በአረንጓዴ ቀለም) */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-emerald-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-emerald-400 rounded-full p-1.5 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          {/* Messages per user prompt */}
          {selectedAction === 'check_in' ? (
            <div className="space-y-2 max-w-md">
              <h2 className="text-3xl font-black text-emerald-400 font-serif tracking-wide">
                መልካም ስራ!
              </h2>
              <p className="text-sm font-semibold text-white">
                {selectedStaff.rank} {selectedStaff.fullName}
              </p>
              <p className="text-xs text-slate-300">
                የስራ መግቢያዎ በኮሚሽኑ ሲስተም በስኬት ተመዝግቧል። መልካም የስራ ቀን ይሁንልዎ!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-serif leading-snug">
                «መልካም እረፍት ስራዎትን በታማኝነት እና በቅንነት ስላገለገሉ እናመሰግናለን።»
              </h2>
              <p className="text-sm font-semibold text-white">
                {selectedStaff.rank} {selectedStaff.fullName}
              </p>
              <p className="text-xs text-slate-300">
                የስራ መውጫዎ በኮሚሽኑ ሲስተም በስኬት ተመዝግቧል። ሰላማዊ የእረፍት ጊዜ ይሁንልዎ!
              </p>
            </div>
          )}

          {/* Detailed Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-sm space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">የተመዘገበበት ሰዓት:</span>
              <span className="font-bold text-amber-300 font-mono">
                {resultRecord ? (selectedAction === 'check_in' ? resultRecord.checkInTime : resultRecord.checkOutTime) : toEthiopianTime().formatted}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">የስራ ክፍል:</span>
              <span className="text-white font-medium">{selectedStaff.departmentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">የፖሊስ ባጅ:</span>
              <span className="font-mono text-amber-400">{selectedStaff.badgeNumber}</span>
            </div>
            {punctualityText && (
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">የሰዓት አክባሪነት:</span>
                <span className="text-emerald-400 font-bold">{punctualityText}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ሌላ ሰራተኛ ለመመዝገብ ተመለስ</span>
          </button>
        </div>
      )}

      {/* Bottom Footer Motto */}
      <div className="text-center pt-4 border-t border-slate-900 mt-4 text-[10px] text-slate-500">
        <span>{settings.commissionName} • {settings.motto}</span>
      </div>
    </div>
  );
};
