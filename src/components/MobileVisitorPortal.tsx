import React, { useState, useEffect, useRef } from 'react';
import {
  HeartHandshake,
  MessageSquareHeart,
  Camera,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  Shield,
  Star,
  Upload,
  Sparkles,
  RotateCcw,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { Department, CommissionSettings, VisitorRecord } from '../types';
import {
  recordMobileVisitorEntry,
  submitVisitorFeedback,
  lookupVisitorByPhone,
  matchEthiopianPhones,
} from '../services/dbService';
import { compressImageFile } from '../utils/imageCompressor';
import { soundEffects } from '../utils/audio';

interface MobileVisitorPortalProps {
  departments: Department[];
  settings: CommissionSettings;
  visitors?: VisitorRecord[];
  initialDeptId?: string;
  onClose?: () => void;
}

export const MobileVisitorPortal: React.FC<MobileVisitorPortalProps> = ({
  departments,
  settings,
  visitors = [],
  initialDeptId,
  onClose,
}) => {
  // Mode: null (initial choice), 'service' (አገልግሎት ፈልጌ), 'feedback' (አስተያየት ለመስጠት)
  const [mode, setMode] = useState<null | 'service' | 'feedback'>(null);

  // Service flow steps: 1 (Name & Phone) -> 2 (Front & Back ID photos) -> 3 (Thank you screen)
  const [serviceStep, setServiceStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(
    initialDeptId || departments[0]?.id || 'special_office'
  );
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [createdVisitor, setCreatedVisitor] = useState<VisitorRecord | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Feedback flow
  const [feedbackStep, setFeedbackStep] = useState<1 | 2 | 3>(1); // 1: Lookup, 2: Rating, 3: Completed
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [targetVisitor, setTargetVisitor] = useState<VisitorRecord | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedScoreLabel, setSelectedScoreLabel] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isDirectFeedback, setIsDirectFeedback] = useState(false);
  const [directName, setDirectName] = useState('');
  const [directDeptId, setDirectDeptId] = useState(initialDeptId || departments[0]?.id || 'special_office');

  const frontFileRef = useRef<HTMLInputElement>(null);
  const backFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    soundEffects.unlockAudio();
    // Pre-populate feedback phone if cached in this browser session
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('bgr_last_visitor_record');
        if (cached) {
          const parsed = JSON.parse(cached) as VisitorRecord;
          if (parsed && parsed.phone) {
            setFeedbackPhone(parsed.phone);
          }
        }
      } catch {}
    }
  }, []);

  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  // Helper for image upload with automatic canvas compression (< 60KB per photo)
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingPhoto(true);
      try {
        const compressed = await compressImageFile(file, 750, 750, 0.68);
        setter(compressed);
      } catch {
        // Fallback to standard reader
        const reader = new FileReader();
        reader.onloadend = () => {
          setter(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressingPhoto(false);
      }
    }
  };

  // Reusable check for returning citizen: auto-fills existing name and photos
  const handlePhoneBlurOrChange = async (newPhone: string) => {
    setPhone(newPhone);
    const digits = newPhone.replace(/[^0-9]/g, '');
    if (digits.length >= 9) {
      try {
        const pastRecord = await lookupVisitorByPhone(newPhone);
        if (pastRecord) {
          if (!fullName.trim() || fullName === pastRecord.fullName) {
            setFullName(pastRecord.fullName);
            setAutoFilledNotice(`የቀድሞ መረጃ ተገኝቷል፡ «${pastRecord.fullName}» (ስምዎ በራስ-ሰር ተሞልቷል)`);
          }
          if (!frontPhoto && pastRecord.idCardFrontPhoto) {
            setFrontPhoto(pastRecord.idCardFrontPhoto);
          }
          if (!backPhoto && pastRecord.idCardBackPhoto) {
            setBackPhoto(pastRecord.idCardBackPhoto);
          }
        }
      } catch {}
    }
  };

  // SERVICE: Step 1 -> Step 2
  const handleValidateNameAndPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError(null);

    const trimmedName = fullName.trim();
    const parts = trimmedName.split(/\s+/).filter(Boolean);

    if (parts.length < 3) {
      setServiceError('እባክዎ ሙሉ ስምዎን ከአያት ጋር (ቢያንስ 3 ቃላት) ያስገቡ። ለምሳሌ፡ አበበ ከበደ ታደሰ');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 9) {
      setServiceError('እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለምሳሌ፡ 0911223344)');
      return;
    }

    soundEffects.playScanBeep();
    setServiceStep(2);
  };

  // SERVICE: Submit entry
  const handleSubmitService = async () => {
    setServiceError(null);
    try {
      const visitor = await recordMobileVisitorEntry({
        fullName: fullName.trim(),
        phone: phone.trim(),
        departmentId: currentDept.id,
        departmentName: currentDept.name,
        purpose: purpose.trim() || 'የጉዳይ መስተንግዶ',
        idCardFrontPhoto: frontPhoto || undefined,
        idCardBackPhoto: backPhoto || undefined,
      });

      setCreatedVisitor(visitor);
      soundEffects.playSuccessChime();
      setServiceStep(3);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setServiceError(err.message || 'መረጃውን በመመዝገብ ላይ ችግር አጋጥሟል');
    }
  };

  const [isLookingUp, setIsLookingUp] = useState(false);

  // FEEDBACK: Look up active or recent visitor
  const handleLookupVisitor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedbackError(null);

    const q = feedbackPhone.trim();
    if (!q) {
      setFeedbackError('እባክዎ የስልክ ቁጥርዎን ያስገቡ!');
      return;
    }

    setIsLookingUp(true);
    try {
      // 1. Check if matching the visitor registered in this active session
      if (createdVisitor && matchEthiopianPhones(createdVisitor.phone, q)) {
        soundEffects.playScanBeep();
        setTargetVisitor(createdVisitor);
        setFeedbackStep(2);
        return;
      }

      // 2. Query database and local session cache securely
      const found = await lookupVisitorByPhone(q);
      if (!found) {
        soundEffects.playErrorBuzz();
        setFeedbackError(
          `በስልክ ቁጥር "${feedbackPhone}" የተመዘገበ የባለጉዳይ መስተንግዶ ፋይል አልተገኘም። እባክዎ አስቀድመው መመዝገብዎን ያረጋግጡ ወይም በቀጥታ አዲስ አስተያየት ይስጡ።`
        );
        return;
      }

      soundEffects.playScanBeep();
      setTargetVisitor(found);
      setFeedbackStep(2);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedbackError('መረጃውን በመፈተሽ ላይ ችግር አጋጥሟል');
    } finally {
      setIsLookingUp(false);
    }
  };

  // FEEDBACK: Ratings predefined by user specification
  const SATISFACTION_LEVELS = [
    {
      score: 5,
      label: 'እጅግ በጣም ረክቻለሁ',
      sub: 'አገልግሎቱ ፈጣን፣ ፍትሃዊና እንከን የለሽ ነበር',
      color: 'from-emerald-500 to-emerald-600',
      border: 'border-emerald-500/50',
      icon: '⭐⭐⭐⭐⭐',
    },
    {
      score: 4,
      label: 'በጣም ረክቻለሁ',
      sub: 'ጥሩ መስተንግዶ እና ፈጣን ምላሽ አግኝቻለሁ',
      color: 'from-teal-500 to-teal-600',
      border: 'border-teal-500/50',
      icon: '⭐⭐⭐⭐',
    },
    {
      score: 3,
      label: 'ረክቻለሁ',
      sub: 'አጥጋቢ መስተንግዶ ተሰጥቶኛል',
      color: 'from-amber-500 to-amber-600',
      border: 'border-amber-500/50',
      icon: '⭐⭐⭐',
    },
    {
      score: 2,
      label: 'አልረካሁም',
      sub: 'መስተንግዶው መዘግየት ወይም ክፍተት ነበረው',
      color: 'from-orange-500 to-orange-600',
      border: 'border-orange-500/50',
      icon: '⭐⭐',
    },
    {
      score: 1,
      label: 'አልተስተናገድኩም',
      sub: 'ተገቢውን አገልግሎት ሳላገኝ ተመልሻለሁ',
      color: 'from-rose-600 to-rose-700',
      border: 'border-rose-500/50',
      icon: '⭐',
    },
  ];

  const handleSelectRating = async (score: number, label: string) => {
    if (!targetVisitor) return;
    setSelectedScore(score);
    setSelectedScoreLabel(label);

    try {
      await submitVisitorFeedback(targetVisitor.id, score, label);
      soundEffects.playSuccessChime();
      setFeedbackStep(3);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedbackError(err.message || 'አስተያየቱን በማስገባት ላይ ችግር አጋጥሟል');
    }
  };

  const handleResetAll = () => {
    setMode(null);
    setServiceStep(1);
    setFeedbackStep(1);
    setFullName('');
    setPhone('');
    setPurpose('');
    setFrontPhoto(null);
    setBackPhoto(null);
    setServiceError(null);
    setFeedbackError(null);
    setCreatedVisitor(null);
    setTargetVisitor(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 max-w-xl mx-auto font-sans">
      {/* Top Mobile Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-full object-contain bg-slate-950 p-1 border border-amber-500/40"
          />
          <div>
            <h1 className="text-sm font-extrabold text-amber-400 font-serif leading-tight">
              {settings.commissionName}
            </h1>
            <p className="text-[11px] text-slate-300 font-medium">
              የባለጉዳዮች ዲጂታል መስተንግዶ እና አስተያየት ፖርታል
            </p>
          </div>
        </div>

        {currentDept && (
          <div className="hidden xs:flex flex-col items-end text-right">
            <span className="text-[10px] text-slate-400">የስራ ክፍል</span>
            <span className="text-xs font-bold text-amber-300 font-mono">
              {currentDept.name} {currentDept.roomNumber ? `(${currentDept.roomNumber})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* INITIAL SCREEN: 2 Choices (አገልግሎት ፈልጌ vs አስተያየት ለመስጠት) */}
      {mode === null && (
        <div className="flex-1 flex flex-col justify-center space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              እንኳን ደህና መጡ!
            </span>
            <h2 className="text-2xl font-black text-white font-serif">
              ምን ዓይነት አገልግሎት ይፈልጋሉ?
            </h2>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              በግድግዳው ላይ የተለጠፈውን ኪው አር ኮድ በስልክዎ ስላቃኙ እናመሰግናለን። እባክዎ ከታች ካሉት አንዱን ይምረጡ፡
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* OPTION 1: አገልግሎት ፈልጌ */}
            <button
              onClick={() => {
                soundEffects.playScanBeep();
                setMode('service');
                setServiceStep(1);
              }}
              className="group bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 hover:from-amber-500/20 border-2 border-amber-500/40 hover:border-amber-400 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-9 h-9" />
              </div>
              <span className="text-lg font-black text-white group-hover:text-amber-300">
                አገልግሎት ፈልጌ
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                አዲስ ጉዳይ ይዘው ከመጡ ስምዎን፣ ስልክዎንና መታወቂያዎን አስገብተው ይመዝገቡ
              </p>
            </button>

            {/* OPTION 2: አስተያየት ለመስጠት */}
            <button
              onClick={() => {
                soundEffects.playScanBeep();
                setMode('feedback');
                setFeedbackStep(1);
              }}
              className="group bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 hover:from-emerald-500/20 border-2 border-emerald-500/40 hover:border-emerald-400 rounded-3xl p-6 flex flex-col items-center text-center space-y-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 group-hover:scale-110 transition-transform">
                <MessageSquareHeart className="w-9 h-9" />
              </div>
              <span className="text-lg font-black text-white group-hover:text-emerald-300">
                አስተያየት ለመስጠት
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                የመጡበትን ጉዳይ ጨርሰው ሲወጡ ስለተሰጠዎት አገልግሎት ደረጃ ይስጡ
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ================= FLOW A: አገልግሎት ፈልጌ ================= */}

      {/* STEP A1: Full name with Grandfather and Phone */}
      {mode === 'service' && serviceStep === 1 && (
        <div className="flex-1 flex flex-col justify-center space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-white font-serif">
              የባለጉዳይ መረጃ መመዝገቢያ
            </h2>
            <p className="text-xs text-slate-300">
              ደረጃ 1 ከ 2፡ ሙሉ ስምዎንና ስልክ ቁጥርዎን ያስገቡ
            </p>
          </div>

          <form onSubmit={handleValidateNameAndPhone} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>ስም እስከ አያት (ቢያንስ 3 ቃላት) *</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ለምሳሌ፡ አበበ ከበደ ታደሰ"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>ስልክ ቁጥር *</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">ቀደም ሲል የተመዘገቡ ከሆነ ስምዎ ይመጣል</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneBlurOrChange(e.target.value)}
                onBlur={() => handlePhoneBlurOrChange(phone)}
                placeholder="0911223344"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {autoFilledNotice && (
              <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-3 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{autoFilledNotice}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                የመጡበት የስራ ክፍል
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-sm text-white rounded-2xl px-4 py-3 outline-none"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                የጉዳዩ ዓይነት / ዓላማ (አማራጭ)
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ለምሳሌ፡ የጣት አሻራ ምርመራ / የፍቃድ እድሳት"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {serviceError && (
              <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{serviceError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ተመለስ</span>
              </button>

              <button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>ኔክስት (Next)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP A2: Photo of ID Front & Back */}
      {mode === 'service' && serviceStep === 2 && (
        <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-white font-serif">
              የመታወቂያ ፎቶ ማንሻ / ማስገቢያ
            </h2>
            <p className="text-xs text-slate-300">
              ደረጃ 2 ከ 2፡ የመታወቂያዎን የፊትና የኋላ ገጽ በስልክዎ ካሜራ አንስተው ወይም ከጋለሪ ያስገቡ
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front ID Photo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
                <span className="text-xs font-bold text-amber-300">
                  1. የመታወቂያው የፊት ገጽ ፎቶ
                </span>

                {frontPhoto ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-emerald-500/60 shadow">
                    <img
                      src={frontPhoto}
                      alt="ID Front"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFrontPhoto(null)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-rose-900 text-white rounded-full p-1 text-[10px]"
                    >
                      ቀይር
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => frontFileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer bg-slate-900/50"
                  >
                    <Camera className="w-7 h-7 text-amber-400" />
                    <span className="text-xs font-semibold">ካሜራ ይክፈቱ / ፎቶ አንሱ</span>
                    <span className="text-[10px] text-slate-500">የፊት ገጽ</span>
                  </button>
                )}

                <input
                  ref={frontFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, setFrontPhoto)}
                />
              </div>

              {/* Back ID Photo Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
                <span className="text-xs font-bold text-amber-300">
                  2. የመታወቂያው የኋላ ገጽ ፎቶ
                </span>

                {backPhoto ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-emerald-500/60 shadow">
                    <img
                      src={backPhoto}
                      alt="ID Back"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBackPhoto(null)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-rose-900 text-white rounded-full p-1 text-[10px]"
                    >
                      ቀይር
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => backFileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-amber-400 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer bg-slate-900/50"
                  >
                    <Camera className="w-7 h-7 text-amber-400" />
                    <span className="text-xs font-semibold">ካሜራ ይክፈቱ / ፎቶ አንሱ</span>
                    <span className="text-[10px] text-slate-500">የኋላ ገጽ</span>
                  </button>
                )}

                <input
                  ref={backFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, setBackPhoto)}
                />
              </div>
            </div>

            {/* Note on optional photos */}
            <div className="text-[11px] text-slate-400 text-center">
              ፎቶ ማንሳት ካልቻሉ በቀጥታ «መስተንግዶውን ጨርስ» በማለት መቀጠል ይችላሉ።
            </div>

            {serviceError && (
              <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{serviceError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setServiceStep(1)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ተመለስ</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitService}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>መስተንግዶውን ጨርስ</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP A3: Service Thank You Screen (Per User Prompt) */}
      {mode === 'service' && serviceStep === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="relative">
            <img
              src={settings.logoUrl}
              alt="Commission Logo"
              className="w-20 h-20 rounded-full object-contain bg-slate-950 p-2 border-2 border-amber-400/60 shadow-2xl"
            />
          </div>

          {/* Huge Green Checkmark */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-emerald-400" />
            </div>
          </div>

          {/* Exact User Prompt Message */}
          <div className="space-y-3 max-w-md">
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-serif leading-snug">
              «እኛን መርጠዉ ስለመጡ እናመሰግናለን! እባክዎትን የመጡበትን ጉዳይ እንደጨረሱ ስለአገልግሎታችን አስተያየትዎን እንፈልጋለን።»
            </h2>
            <p className="text-sm font-semibold text-white">
              ባለጉዳይ፡ {fullName}
            </p>
            <p className="text-xs text-slate-300">
              ክፍል፡ <span className="text-amber-300 font-bold">{currentDept.name}</span>
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-sm space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">የመስተንግዶ መለያ:</span>
              <span className="font-mono text-amber-400 font-bold">{createdVisitor?.faydaId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">የገባበት ሰዓት:</span>
              <span className="font-mono text-emerald-400">{createdVisitor?.checkInTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ስልክ:</span>
              <span className="text-white font-mono">{phone}</span>
            </div>
          </div>

          {/* Quick shortcut to immediately rate if visitor just finished */}
          <button
            type="button"
            onClick={() => {
              if (createdVisitor) {
                setTargetVisitor(createdVisitor);
                setMode('feedback');
                setFeedbackStep(2);
              }
            }}
            className="w-full max-w-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <MessageSquareHeart className="w-5 h-5" />
            <span>ጉዳይዎ እንዳበቃ በቀጥታ ደረጃ ይስጡ (አስተያየት)</span>
          </button>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ወደ መጀመሪያ ገጽ ተመለስ</span>
          </button>
        </div>
      )}

      {/* ================= FLOW B: አስተያየት ለመስጠት ================= */}

      {/* STEP B1: Phone Lookup */}
      {mode === 'feedback' && feedbackStep === 1 && (
        <div className="flex-1 flex flex-col justify-center space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-white font-serif">
              ስለአገልግሎታችን አስተያየት ይስጡ
            </h2>
            <p className="text-xs text-slate-300">
              ጉዳይዎን ጨርሰው ሲወጡ የስልክ ቁጥርዎን በማስገባት የተሰጠዎትን አገልግሎት ይገምግሙ
            </p>
          </div>

          <form onSubmit={handleLookupVisitor} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>ሲገቡ የተመዘገቡበት ስልክ ቁጥር *</span>
              </label>
              <input
                type="tel"
                required
                autoFocus
                value={feedbackPhone}
                onChange={(e) => {
                  setFeedbackPhone(e.target.value);
                  setFeedbackError(null);
                }}
                placeholder="ለምሳሌ፡ 0911223344"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-2xl px-4 py-3.5 text-base font-mono text-white placeholder-slate-500 outline-none transition-all shadow-inner"
              />
            </div>

            {feedbackError && (
              <div className="bg-rose-950/60 border border-rose-600/50 rounded-2xl p-4 space-y-3 text-xs text-rose-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{feedbackError}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-rose-800/40">
                  <button
                    type="button"
                    onClick={() => {
                      setPhone(feedbackPhone);
                      setMode('service');
                      setServiceStep(1);
                    }}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>አዲስ መስተንግዶ ይመዝገቡ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectFeedback(true);
                      const directV: VisitorRecord = {
                        id: `vis-direct-${Date.now()}`,
                        faydaId: `VIS-${feedbackPhone.replace(/[^0-9]/g, '').slice(-6) || 'DIRECT'}`,
                        fullName: 'ክቡር ባለጉዳይ',
                        phone: feedbackPhone.trim(),
                        departmentId: selectedDeptId,
                        departmentName: currentDept.name,
                        purpose: 'ፈጣን የአስተያየት መስጫ',
                        checkInTime: 'ቀጥታ',
                        date: new Date().toISOString().split('T')[0],
                        status: 'active',
                      };
                      setTargetVisitor(directV);
                      setFeedbackStep(2);
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ቀጥታ ደረጃ ይስጡ</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ተመለስ</span>
              </button>

              <button
                type="submit"
                disabled={isLookingUp || !feedbackPhone.trim()}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black py-3 rounded-xl text-xs sm:text-sm shadow-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLookingUp ? (
                  <span>እየፈተሸ...</span>
                ) : (
                  <>
                    <span>ቀጣይ</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP B2: 5 Satisfaction Rating Levels */}
      {mode === 'feedback' && feedbackStep === 2 && targetVisitor && (
        <div className="flex-1 flex flex-col justify-center space-y-4 animate-in fade-in duration-200">
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {targetVisitor.departmentName}
            </span>
            <h2 className="text-xl font-black text-white font-serif">
              በተሰጠዎት አገልግሎት ምን ያህል ረክተዋል?
            </h2>
            <p className="text-xs text-slate-300">
              ባለጉዳይ፡ <span className="font-bold text-amber-300">{targetVisitor.fullName}</span>
            </p>
          </div>

          {/* Stored Visitor Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">የባለጉዳይ መለያ:</span>
              <span className="font-mono text-amber-300 font-bold">{targetVisitor.faydaId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ስልክ ቁጥር:</span>
              <span className="font-mono text-white">{targetVisitor.phone || feedbackPhone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">የመግቢያ ሰዓት:</span>
              <span className="font-mono text-emerald-400">{targetVisitor.checkInTime || 'ዛሬ'}</span>
            </div>
            {targetVisitor.rating && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-amber-400">
                <span className="text-slate-400">ቀደም ሲል የተሰጠ ደረጃ:</span>
                <span className="font-bold">{targetVisitor.rating}/5 ({targetVisitor.ratingText})</span>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {SATISFACTION_LEVELS.map((lvl) => (
              <button
                key={lvl.score}
                onClick={() => handleSelectRating(lvl.score, lvl.label)}
                className={`w-full bg-slate-900 hover:bg-slate-800/90 border-2 ${lvl.border} rounded-2xl p-3.5 flex items-center justify-between text-left transition-all hover:scale-[1.01] active:scale-98 cursor-pointer shadow-lg`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">
                      {lvl.score}. {lvl.label}
                    </span>
                    <span className="text-xs">{lvl.icon}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {lvl.sub}
                  </p>
                </div>

                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${lvl.color} flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow`}>
                  {lvl.score}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => setFeedbackStep(1)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ስልክ ቁጥር ለመቀየር ተመለስ</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP B3: Completed Feedback */}
      {mode === 'feedback' && feedbackStep === 3 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="relative">
            <img
              src={settings.logoUrl}
              alt="Commission Logo"
              className="w-20 h-20 rounded-full object-contain bg-slate-950 p-2 border-2 border-amber-400/60 shadow-2xl"
            />
          </div>

          {/* Huge Green Checkmark */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-emerald-400" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-emerald-400 rounded-full p-1.5 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl font-black text-emerald-400 font-serif">
              ስለሰጡን አስተያየት እናመሰግናለን!
            </h2>
            <p className="text-sm font-semibold text-white">
              የተሰጠው ደረጃ፡ <span className="text-amber-300 font-bold">{selectedScoreLabel} ({selectedScore}/5)</span>
            </p>
            <p className="text-xs text-slate-300">
              የሰጡን አስተያየት የፖሊስ ኮሚሽኑን የስራ ክፍሎች አፈጻጸም ለመመዘንና አገልግሎቱን ይበልጥ ለማሻሻል ያግዘናል።
            </p>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full text-xs text-slate-400 italic">
            «{settings.motto}»
          </div>

          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ወደ መጀመሪያ ገጽ ተመለስ</span>
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
