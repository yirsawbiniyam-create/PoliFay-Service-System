import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Scan,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  Star,
  Sparkles,
  ArrowRight,
  Shield,
  ShieldCheck,
  QrCode,
  Radio,
  Clock,
  ThumbsUp,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Department, Staff, VisitorRecord, CommissionSettings } from '../types';
import {
  processStaffScan,
  processVisitorScan,
  submitVisitorFeedback,
  StaffScanResult,
  VisitorScanResult,
} from '../services/dbService';
import { soundEffects } from '../utils/audio';
import { toEthiopianTime } from '../utils/ethiopianTime';
import { SAMPLE_FAYDA_CITIZENS } from '../data/initialData';

interface ScannerKioskProps {
  departments: Department[];
  staffList: Staff[];
  visitors: VisitorRecord[];
  settings: CommissionSettings;
  selectedDeptId?: string;
  onSelectDept?: (id: string) => void;
}

type KioskView =
  | 'idle_scanning'
  | 'staff_success_modal'
  | 'visitor_entry_success_modal'
  | 'visitor_feedback_screen'
  | 'visitor_feedback_thank_you_modal';

export const ScannerKiosk: React.FC<ScannerKioskProps> = ({
  departments,
  staffList,
  visitors,
  settings,
  selectedDeptId: initialDeptId,
}) => {
  const [activeDeptId, setActiveDeptId] = useState<string>(
    initialDeptId || departments[0]?.id || 'special_office'
  );
  const [viewState, setViewState] = useState<KioskView>('idle_scanning');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Results for modals
  const [staffResult, setStaffResult] = useState<StaffScanResult | null>(null);
  const [visitorResult, setVisitorResult] = useState<VisitorScanResult | null>(null);
  const [activeFeedbackVisitor, setActiveFeedbackVisitor] = useState<VisitorRecord | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedScoreLabel, setSelectedScoreLabel] = useState<string>('');

  // Camera video & canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animFrameId = useRef<number | null>(null);
  const isScanningRef = useRef(false);

  // Time state
  const [ethTime, setEthTime] = useState(toEthiopianTime());
  useEffect(() => {
    const timer = setInterval(() => setEthTime(toEthiopianTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeDepartment =
    departments.find((d) => d.id === activeDeptId) || departments[0] || {
      id: 'general',
      name: 'አጠቃላይ መስተንግዶ',
      code: 'GEN',
      active: true,
      order: 1,
    };

  /**
   * Main Dispatcher: Scans barcode or QR payload
   * Checks if payload is:
   * 1. Staff Police ID (starts with POL or matches badge in staffList)
   * 2. Fayda Digital ID (starts with FIN or FAYDA or json format or general visitor)
   */
  const handleBarcodeScanned = useCallback(
    async (code: string) => {
      if (isProcessing) return;
      const trimmed = code.trim();
      if (!trimmed) return;

      setIsProcessing(true);
      setErrorMessage(null);
      soundEffects.playScanBeep();

      try {
        // 1. Check if it matches a staff member (Police Digital ID)
        const matchedStaff = staffList.find(
          (s) =>
            s.id.toLowerCase() === trimmed.toLowerCase() ||
            s.badgeNumber.toLowerCase() === trimmed.toLowerCase() ||
            trimmed.toUpperCase().includes(s.badgeNumber.toUpperCase())
        );

        if (matchedStaff || trimmed.toUpperCase().startsWith('POL')) {
          const badgeToUse = matchedStaff ? matchedStaff.id : trimmed;
          const res = await processStaffScan(
            badgeToUse,
            staffList,
            activeDepartment.id,
            activeDepartment.name
          );
          setStaffResult(res);
          setViewState('staff_success_modal');
          if (res.action === 'check_in') {
            soundEffects.playSuccessChime();
          } else {
            soundEffects.playFarewellChime();
          }

          // Auto-return to scanner after 3.8 seconds as requested
          setTimeout(() => {
            setViewState('idle_scanning');
            setStaffResult(null);
            setIsProcessing(false);
          }, 3800);
          return;
        }

        // 2. Otherwise it's a Fayda Digital ID visitor (ባለጉዳይ)
        let faydaId = trimmed;
        let visitorName = '';
        let phone = '';
        let purpose = '';

        // Handle possible JSON payload from Fayda QR code
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            faydaId = parsed.fin || parsed.faydaId || parsed.id || trimmed;
            visitorName = parsed.name || parsed.fullName || '';
            phone = parsed.phone || '';
            purpose = parsed.purpose || '';
          } catch {
            // Not json
          }
        }

        // Check if sample preloaded fayda
        const sampleMatch = SAMPLE_FAYDA_CITIZENS.find(
          (c) => c.faydaId.toLowerCase() === faydaId.toLowerCase()
        );
        if (sampleMatch) {
          visitorName = sampleMatch.fullName;
          phone = sampleMatch.phone;
          purpose = sampleMatch.purpose;
        }

        const res = await processVisitorScan(
          {
            faydaId,
            fullName: visitorName || `ባለጉዳይ (${faydaId.slice(-6)})`,
            phone,
            purpose: purpose || 'ጉዳይ ለማስፈጸም የመጣ ባለጉዳይ',
            departmentId: activeDepartment.id,
            departmentName: activeDepartment.name,
          },
          visitors
        );

        if (res.action === 'entry') {
          // Visitor Entry Success Modal
          setVisitorResult(res);
          setViewState('visitor_entry_success_modal');
          soundEffects.playSuccessChime();

          // Auto-return after 3.8s
          setTimeout(() => {
            setViewState('idle_scanning');
            setVisitorResult(null);
            setIsProcessing(false);
          }, 3800);
        } else {
          // Visitor Exit: Open feedback rating screen!
          setActiveFeedbackVisitor(res.visitor);
          setViewState('visitor_feedback_screen');
          soundEffects.playSuccessChime();
          setIsProcessing(false);
        }
      } catch (err: unknown) {
        console.error('Scan processing error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'ስካን ሲደረግ ስህተት አጋጥሟል');
        setIsProcessing(false);
      }
    },
    [isProcessing, staffList, visitors, activeDepartment]
  );

  /**
   * Hardware Barcode Scanner listener (USB / Bluetooth Barcode Guns type into window)
   */
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a standard input form
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = ''; // reset buffer if human typing slowly
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleBarcodeScanned(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBarcodeScanned]);

  /**
   * Camera QR Scanner Loop using jsQR
   */
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        isScanningRef.current = true;
        scanFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera could not be started:', err);
      setCameraError('ካሜራ መክፈት አልተቻለም። ፍቃድ መኖሩን ያረጋግጡ ወይም የኮድ መፈለጊያውን ይጠቀሙ።');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (qrCode && qrCode.data) {
          handleBarcodeScanned(qrCode.data);
          // Pause scanning temporarily
          setTimeout(() => {
            if (isScanningRef.current) {
              animFrameId.current = requestAnimationFrame(scanFrame);
            }
          }, 2000);
          return;
        }
      }
    }
    animFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  /**
   * Visitor Rating Submission
   * 5: እጅግ በጣም ረክቻለሁ
   * 4: በጣም ረክቻለሁ
   * 3: ረክቻለሁ
   * 2: አልረካሁም
   * 1: አልተስተናገድኩም
   */
  const handleSelectRating = async (score: number, label: string) => {
    if (!activeFeedbackVisitor) return;
    setSelectedScore(score);
    setSelectedScoreLabel(label);
    soundEffects.playSuccessChime();

    try {
      await submitVisitorFeedback(activeFeedbackVisitor.id, score, label);
      setViewState('visitor_feedback_thank_you_modal');

      // Auto-return after 4.5 seconds to scanner
      setTimeout(() => {
        setViewState('idle_scanning');
        setActiveFeedbackVisitor(null);
        setSelectedScore(null);
        setSelectedScoreLabel('');
      }, 4500);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      setViewState('idle_scanning');
    }
  };

  return (
    <div className="min-h-[calc(100vh-130px)] bg-slate-950 text-white p-3 sm:p-6 flex flex-col justify-between">
      {/* Top Kiosk Bar: Department Selector & Scanner Status */}
      <div className="max-w-5xl mx-auto w-full mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Department Selection for this door tablet */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                የዚህ ታብሌት / ስካነር የስራ ክፍል
              </span>
              <select
                value={activeDeptId}
                onChange={(e) => setActiveDeptId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-sm sm:text-base rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 outline-none max-w-[280px] sm:max-w-xs truncate"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Touchless Scanner status */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4" />
                <span>{ethTime.formatted}</span>
              </div>
              <span className="text-[11px] text-slate-400">ያለ ንኪኪ ስካነር ዝግጁ ነው</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                  cameraActive
                    ? 'bg-rose-600/90 hover:bg-rose-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>ካሜራ ዝጋ</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>ካሜራ ክፈት</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-2 bg-rose-950/80 border border-rose-600 text-rose-200 px-4 py-2.5 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs bg-rose-900/60 hover:bg-rose-800 px-2 py-1 rounded"
            >
              አጥፋ
            </button>
          </div>
        )}
      </div>

      {/* Main Kiosk Center Container */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center relative">
        {/* VIEW 1: Idle Scanning State */}
        {viewState === 'idle_scanning' && (
          <div className="w-full flex flex-col items-center">
            {/* Live Camera Viewport or Animated Touchless Target */}
            <div className="relative w-full max-w-lg aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden border-2 border-amber-500/50 bg-slate-900/90 shadow-2xl shadow-amber-500/10 flex flex-col items-center justify-center">
              {/* Corner Targets */}
              <div className="absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 border-amber-400 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 border-amber-400 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 border-amber-400 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 border-amber-400 rounded-br-xl pointer-events-none"></div>

              {/* Animated Laser Scanning Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_2.8s_infinite] pointer-events-none z-10 opacity-90"></div>

              {cameraActive ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    autoPlay
                    playsInline
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-3 inset-x-0 text-center">
                    <span className="bg-slate-950/80 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-500/30">
                      የፖሊስ ወይም የፋይዳ መታወቂያዎን በካሜራው ፊት ያሳዩ
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-center mb-3 animate-pulse">
                    <Scan className="w-10 h-10 text-amber-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-amber-300 font-serif mb-1">
                    መታወቂያዎን እዚህ ስካን ያድርጉ
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                    የፖሊስ ዲጂታል መታወቂያዎን የጀርባ ባርኮድ ወይም የፋይዳ ዲጂታል መታወቂያዎን (Fayda QR) በስካነሩ ፊት ያሳዩ
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-4 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-lg transition-transform active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ካሜራውን አብራ</span>
                  </button>
                  {cameraError && (
                    <p className="text-xs text-rose-400 mt-2 max-w-xs">{cameraError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Touchless Barcode input (for USB/Bluetooth scanner or manual typing) */}
            <div className="w-full max-w-lg mt-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualInput.trim()) {
                    handleBarcodeScanned(manualInput.trim());
                    setManualInput('');
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="የፖሊስ ባጅ ቁጥር ወይም የፋይዳ መታወቂያ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-xl shrink-0 transition-colors"
                >
                  ስካን
                </button>
              </form>
            </div>

            {/* Quick Demo Simulator Bar: For instant one-click testing of all scenarios */}
            <div className="w-full max-w-3xl mt-5 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  ፈጣን የሙከራ ስካነር (Quick Test Simulation)
                </span>
                <span className="text-[11px] text-slate-400">
                  ያለ ካሜራ በአንድ ክሊክ ለመሞከር
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Staff Quick Scans */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    የፖሊስ ሰራተኛ ስካን (መግቢያ / መውጫ)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {staffList.slice(0, 4).map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleBarcodeScanned(st.badgeNumber)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                          st.status === 'on_duty'
                            ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{st.rank.split(' ')[0]} {st.fullName.split(' ')[0]}</span>
                        <span className="text-[10px] ml-1 opacity-75">
                          {st.status === 'on_duty' ? '(መውጫ)' : '(መግቢያ)'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visitor Fayda Quick Scans */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    የፋይዳ ዲጂታል ባለጉዳይ ስካን (መግቢያ / መውጫ አስተያየት)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_FAYDA_CITIZENS.map((c) => {
                      const isActive = visitors.some(
                        (v) => v.faydaId === c.faydaId && v.status === 'active'
                      );
                      return (
                        <button
                          key={c.faydaId}
                          onClick={() => handleBarcodeScanned(c.faydaId)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                            isActive
                              ? 'bg-yellow-950/60 border-yellow-600/40 text-yellow-300 hover:bg-yellow-900/60'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span>{c.fullName.split(' ')[0]} {c.fullName.split(' ')[1]}</span>
                          <span className="text-[10px] ml-1 opacity-75">
                            {isActive ? '(መውጫ/አስተያየት)' : '(መግቢያ)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Staff Success Checkmark Modal */}
        {viewState === 'staff_success_modal' && staffResult && (
          <div className="w-full max-w-xl bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/20 animate-in fade-in zoom-in duration-200">
            {/* Big Green Checkmark */}
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-16 h-16" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif mb-1">
              {staffResult.action === 'check_in'
                ? 'ተመዝግበዋል እናመሰግናለን!'
                : 'ተመዝግበዋል፤ መልካም እረፍት!'}
            </h2>
            <p className="text-emerald-400 font-bold text-base mb-4">
              {staffResult.action === 'check_in' ? 'ወደ ስራ ገብተዋል' : 'ከሰዓት በኋላ ስራ ጨርሰው ወጥተዋል'}
            </p>

            {/* Officer Details Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={
                    staffResult.staff.photoUrl ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={staffResult.staff.fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <h4 className="font-extrabold text-lg text-white">
                    {staffResult.staff.fullName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-amber-300 font-semibold">{staffResult.staff.rank}</span>
                    <span>•</span>
                    <span>ባጅ: {staffResult.staff.badgeNumber}</span>
                  </div>
                  <span className="text-xs text-slate-400">{staffResult.staff.departmentName}</span>
                </div>
              </div>

              {/* Department & Commission Verification Badges */}
              <div className="mt-3.5 space-y-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>የኢትዮጵያ ፖሊስ ኮሚሽን ህጋዊ አባልነት ተረጋግጧል</span>
                </div>

                {staffResult.isDepartmentMember ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>የዚህ የስራ ክፍል ({staffResult.doorDepartmentName}) ሰራተኛ መሆንዎ ተረጋግጧል!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold">
                    <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      የኮሚሽኑ አባል (መደበኛ ክፍልዎ፡ {staffResult.staff.departmentName}) • በ{staffResult.doorDepartmentName} በር ስካን ተደርጓል
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block">የተመዘገበበት ሰዓት:</span>
                  <span className="font-bold text-amber-300">{staffResult.ethiopianTime}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">የሰዓት አክባሪነት ደረጃ:</span>
                  <span className="font-bold text-emerald-400">{staffResult.punctualityLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>ወደ ስካነሩ እየተመለሰ ነው...</span>
            </div>
          </div>
        )}

        {/* VIEW 3: Visitor Entry Success Modal */}
        {viewState === 'visitor_entry_success_modal' && visitorResult && (
          <div className="w-full max-w-xl bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/20 animate-in fade-in zoom-in duration-200">
            {/* Big Green Checkmark */}
            <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-16 h-16" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white font-serif mb-1">
              ተመዝግበዋል እናመሰግናለን!
            </h2>
            <p className="text-emerald-400 font-bold text-base mb-4">
              የፋይዳ ዲጂታል መታወቂያዎ በተሳካ ሁኔታ ተመዝግቧል
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-400">የባለጉዳይ መረጃ (ፋይዳ)</span>
                <span className="text-[11px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                  አገልግሎት ላይ
                </span>
              </div>
              <h4 className="font-black text-lg text-white">{visitorResult.visitor.fullName}</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                ፋይዳ መለያ: <span className="font-mono text-amber-300">{visitorResult.visitor.faydaId}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-slate-800 text-xs flex justify-between">
                <div>
                  <span className="text-slate-400 block">የሄዱበት የስራ ክፍል:</span>
                  <span className="font-semibold text-white">{visitorResult.visitor.departmentName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">የመግቢያ ሰዓት:</span>
                  <span className="font-bold text-amber-300">{visitorResult.ethiopianTime}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>ወደ ስካነሩ እየተመለሰ ነው...</span>
            </div>
          </div>
        )}

        {/* VIEW 4: Visitor Departure Rating / Feedback Screen */}
        {viewState === 'visitor_feedback_screen' && activeFeedbackVisitor && (
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>የአገልግሎት እርካታ አስተያየት መስጫ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                በተሰጠዎት አገልግሎት ምን ያህል ረክተዋል?
              </h2>
              <p className="text-sm text-slate-300 mt-1">
                ክቡር <span className="font-bold text-amber-300">{activeFeedbackVisitor.fullName}</span>፣
                በ<span className="font-bold text-amber-300">{activeFeedbackVisitor.departmentName}</span> የነበረዎትን
                አገልግሎት ከዚህ በታች ካሉት ቁጥሮች አንዱን በመንካት ደረጃ ይስጡ፡
              </p>
            </div>

            {/* 5 Rating Buttons as specified:
                5 እጅግ በጣም ረክቻለሁ፤
                4 በጣም ረክቻለሁ ፤
                3 ረክቻለሁ፤
                2 አልረካሁም፤
                1 አልተስተናገድኩም፤ */}
            <div className="space-y-3">
              {[
                {
                  score: 5,
                  label: 'እጅግ በጣም ረክቻለሁ',
                  subtext: 'ጥራት ያለው፣ ቀልጣፋ እና አክብሮት የተሞላበት አገልግሎት',
                  color: 'from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600',
                  badgeColor: 'bg-emerald-500 text-slate-950',
                },
                {
                  score: 4,
                  label: 'በጣም ረክቻለሁ',
                  subtext: 'ጥሩ እና የተሟላ አገልግሎት ተሰጥቶኛል',
                  color: 'from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600',
                  badgeColor: 'bg-blue-400 text-slate-950',
                },
                {
                  score: 3,
                  label: 'ረክቻለሁ',
                  subtext: 'መደበኛ አገልግሎት ተሰጥቶኛል',
                  color: 'from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
                  badgeColor: 'bg-amber-400 text-slate-950',
                },
                {
                  score: 2,
                  label: 'አልረካሁም',
                  subtext: 'መጓተት ወይም እንከን ነበረበት',
                  color: 'from-orange-700 to-orange-800 hover:from-orange-600 hover:to-orange-700',
                  badgeColor: 'bg-orange-400 text-slate-950',
                },
                {
                  score: 1,
                  label: 'አልተስተናገድኩም',
                  subtext: 'ምላሽ አላገኘሁም / ጉዳዬ አልተፈጸመም',
                  color: 'from-rose-800 to-rose-900 hover:from-rose-700 hover:to-rose-800',
                  badgeColor: 'bg-rose-500 text-white',
                },
              ].map((item) => (
                <button
                  key={item.score}
                  onClick={() => handleSelectRating(item.score, item.label)}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-between shadow-lg transition-all transform active:scale-98 border border-white/10 group cursor-pointer`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className={`w-12 h-12 rounded-xl ${item.badgeColor} font-black text-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                    >
                      {item.score}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base sm:text-lg tracking-tight">
                        {item.label}
                      </h4>
                      <p className="text-xs text-white/80">{item.subtext}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/90 font-bold text-sm">
                    <span>ይምረጡ</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setViewState('idle_scanning')}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                አስተያየት ሳልሰጥ እለፍ (Cancel)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 5: Visitor Feedback Thank You Modal with Police Logo & Motto */}
        {viewState === 'visitor_feedback_thank_you_modal' && (
          <div className="w-full max-w-xl bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/20 animate-in fade-in zoom-in duration-200">
            {/* Police Commission Logo */}
            <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-xl mb-4">
              <img
                src={settings.logoUrl}
                alt="Ethiopian Police Logo"
                className="w-full h-full rounded-full object-contain bg-slate-950 p-1.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-amber-300 font-serif mb-2">
              እናመሰግናለን!
            </h2>

            {/* Official Motto: በጀግንነት መጠበቅ በሰብአዊነት ማገልገል */}
            <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 my-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
                የፖሊስ ኮሚሽኑ መሪ ቃል
              </span>
              <p className="text-lg sm:text-xl font-bold text-white italic font-serif">
                «{settings.motto || 'በጀግንነት መጠበቅ በሰብአዊነት ማገልገል'}»
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-300 mb-2">
              <span className="font-semibold">የሰጡት ደረጃ:</span>
              <span className="font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                {selectedScore} - {selectedScoreLabel}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-4">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>ስካነሩ ለቀጣዩ ተገልጋይ እየተዘጋጀ ነው...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Kiosk Footer */}
      <div className="max-w-5xl mx-auto w-full mt-4 text-center text-xs text-slate-400 border-t border-slate-900 pt-3">
        <p>
          የኢትዮጵያ ፖሊስ ኮሚሽን ዲጂታል የመታወቂያ እና የፋይዳ መስተንግዶ ሲስተም • በየስራ ክፍሉ በር ላይ የሚቀመጥ ስካነር
        </p>
      </div>
    </div>
  );
};
