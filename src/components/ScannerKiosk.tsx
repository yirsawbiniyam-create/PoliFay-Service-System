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
  Clock,
  RefreshCw,
  Volume2,
  Zap,
  Fingerprint,
  Smartphone,
  MapPin,
  Phone,
  User,
  Check,
  Sliders,
} from 'lucide-react';
import { Department, Staff, VisitorRecord, CommissionSettings } from '../types';
import {
  processStaffScan,
  processVisitorScan,
  submitVisitorFeedback,
  StaffScanResult,
  VisitorScanResult,
} from '../services/dbService';
import { PoliceIdCard } from './PoliceIdCard';
import { PoliceIdSystemModal } from './PoliceIdSystemModal';
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

  // Card detection flash and audio notice states
  const [isCardDetected, setIsCardDetected] = useState(false);
  const [audioNotice, setAudioNotice] = useState(false);

  // Camera settings: Front ('user') vs Rear ('environment') and available device list
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Touchscreen Sensor state
  const [isTouchSensingActive, setIsTouchSensingActive] = useState(false);
  const [touchSensorFeedback, setTouchSensorFeedback] = useState<string | null>(null);

  // Hidden Police ID System Modal state
  const [isPoliceSystemModalOpen, setIsPoliceSystemModalOpen] = useState(false);

  // Results for modals
  const [staffResult, setStaffResult] = useState<StaffScanResult | null>(null);
  const [visitorResult, setVisitorResult] = useState<VisitorScanResult | null>(null);
  const [activeFeedbackVisitor, setActiveFeedbackVisitor] = useState<VisitorRecord | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [selectedScoreLabel, setSelectedScoreLabel] = useState<string>('');

  // Auto-dismiss countdown timer
  const [countdown, setCountdown] = useState<number>(5);
  const countdownIntervalRef = useRef<any>(null);

  // Camera video, canvas & media stream
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const animFrameId = useRef<number | null>(null);
  const isScanningRef = useRef(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScanTimestampRef = useRef<number>(0);

  // Native BarcodeDetector instance if supported in browser
  const barcodeDetectorRef = useRef<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BD = (window as any).BarcodeDetector;
        barcodeDetectorRef.current = new BD({
          formats: [
            'qr_code',
            'code_128',
            'code_39',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'pdf417',
            'data_matrix',
          ],
        });
      } catch (e) {
        console.warn('BarcodeDetector initialization fallback:', e);
      }
    }
  }, []);

  // Enumerate cameras
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setVideoDevices(videoInputs);
        })
        .catch((err) => {
          console.warn('Could not enumerate media devices:', err);
        });
    }
  }, []);

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

      // Throttle exact duplicate scans within 2.5 seconds
      const now = Date.now();
      if (
        trimmed === lastScannedCodeRef.current &&
        now - lastScanTimestampRef.current < 2500
      ) {
        return;
      }
      lastScannedCodeRef.current = trimmed;
      lastScanTimestampRef.current = now;

      // Trigger detection sound and visual neon-green indicator
      soundEffects.unlockAudio();
      soundEffects.playScanBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 60, 40]);
        } catch {}
      }
      setIsCardDetected(true);
      setTimeout(() => setIsCardDetected(false), 600);

      setIsProcessing(true);
      setErrorMessage(null);

      try {
        // 1. Check if it matches a staff member (Police Digital ID from Benishangul-Gumuz ID System)
        const matchedStaff = staffList.find(
          (s) =>
            s.id.toLowerCase() === trimmed.toLowerCase() ||
            (s.idNumber && s.idNumber.toLowerCase() === trimmed.toLowerCase()) ||
            s.badgeNumber.toLowerCase() === trimmed.toLowerCase() ||
            trimmed.toUpperCase().includes(s.badgeNumber.toUpperCase()) ||
            (s.idNumber && trimmed.toUpperCase().includes(s.idNumber.toUpperCase()))
        );

        const isPoliceId =
          matchedStaff ||
          trimmed.toUpperCase().startsWith('POL') ||
          trimmed.toUpperCase().startsWith('BGR-POL') ||
          trimmed.toUpperCase().includes('BGR-POL') ||
          trimmed.includes('/verify/');

        if (isPoliceId) {
          let badgeToUse = matchedStaff ? (matchedStaff.idNumber || matchedStaff.id) : trimmed;
          if (badgeToUse.includes('/verify/')) {
            const parts = badgeToUse.split('/verify/');
            if (parts[1]) badgeToUse = parts[1].split('?')[0].split('#')[0].trim();
          }

          const res = await processStaffScan(
            badgeToUse,
            staffList,
            activeDepartment.id,
            activeDepartment.name
          );
          setStaffResult(res);
          setViewState('staff_success_modal');
          setCountdown(6);

          if (res.action === 'check_in') {
            soundEffects.playSuccessChime();
          } else {
            soundEffects.playFarewellChime();
          }

          // Countdown timer for smooth UX
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownIntervalRef.current);
                setViewState('idle_scanning');
                setStaffResult(null);
                setIsProcessing(false);
                return 6;
              }
              return prev - 1;
            });
          }, 1000);
          return;
        }

        // 2. Otherwise it's a Fayda Digital ID visitor (ባለጉዳይ)
        let faydaId = trimmed;
        let visitorName = '';
        let englishName = '';
        let phone = '';
        let purpose = '';
        let photoUrl = '';
        let gender = '';
        let address = '';
        let nationalId = '';

        // Handle possible JSON payload from Fayda QR code
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          try {
            const parsed = JSON.parse(trimmed);
            faydaId =
              parsed.fin ||
              parsed.faydaId ||
              parsed.id ||
              parsed.nationalId ||
              parsed.FAN ||
              trimmed;
            visitorName =
              parsed.name ||
              parsed.fullName ||
              parsed.amharicName ||
              (parsed.firstName ? `${parsed.firstName} ${parsed.lastName || ''}`.trim() : '');
            englishName = parsed.englishName || parsed.enName || '';
            phone = parsed.phone || parsed.phoneNumber || parsed.mobile || '';
            purpose = parsed.purpose || '';
            photoUrl = parsed.photoUrl || parsed.photo || parsed.image || '';
            gender = parsed.gender || parsed.sex || '';
            address = parsed.address || parsed.city || '';
            nationalId = parsed.nationalId || parsed.fan || parsed.uin || '';
          } catch {
            // Not JSON
          }
        } else if (trimmed.includes('fayda.et') || trimmed.includes('id.gov.et')) {
          // If it's a Fayda verification URL, extract ID or FIN
          try {
            const urlObj = new URL(trimmed);
            const finParam =
              urlObj.searchParams.get('fin') ||
              urlObj.searchParams.get('id') ||
              urlObj.searchParams.get('fan') ||
              urlObj.searchParams.get('uin');
            if (finParam) {
              faydaId = finParam;
            }
          } catch {
            // URL parse error fallback
          }
        }

        // Check if sample preloaded fayda
        const sampleMatch = SAMPLE_FAYDA_CITIZENS.find(
          (c) =>
            c.faydaId.toLowerCase() === faydaId.toLowerCase() ||
            (c.nationalId && c.nationalId === faydaId)
        );
        if (sampleMatch) {
          visitorName = sampleMatch.fullName;
          englishName = sampleMatch.englishName || '';
          phone = sampleMatch.phone;
          purpose = sampleMatch.purpose;
          photoUrl = sampleMatch.photoUrl;
          gender = sampleMatch.gender;
          address = sampleMatch.address;
          nationalId = sampleMatch.nationalId;
        } else {
          // Fallback photo and details for scanned external citizen IDs
          if (!photoUrl) {
            photoUrl =
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';
          }
          if (!gender) gender = 'ተገልጋይ / ዜጋ (Citizen)';
          if (!address) address = 'ቤኒሻንጉል ጉሙዝ ክልል';
          if (!nationalId) nationalId = faydaId.replace(/\D/g, '').padEnd(12, '8').substring(0, 12);
        }

        const res = await processVisitorScan(
          {
            faydaId,
            fullName:
              visitorName ||
              (faydaId.length <= 25 ? `ባለጉዳይ (${faydaId})` : `ባለጉዳይ (${faydaId.substring(0, 16)}...)`),
            phone,
            photoUrl,
            gender,
            address,
            nationalId,
            purpose: purpose || 'ጉዳይ ለማስፈጸም የመጣ ባለጉዳይ',
            departmentId: activeDepartment.id,
            departmentName: activeDepartment.name,
          },
          visitors
        );

        if (res.action === 'entry') {
          // Visitor Entry Success Modal with full Photo and details!
          setVisitorResult(res);
          setViewState('visitor_entry_success_modal');
          soundEffects.playSuccessChime();
          setCountdown(5);

          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownIntervalRef.current);
                setViewState('idle_scanning');
                setVisitorResult(null);
                setIsProcessing(false);
                return 5;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          // Visitor Exit: Open feedback rating screen!
          setActiveFeedbackVisitor(res.visitor);
          setViewState('visitor_feedback_screen');
          soundEffects.playSuccessChime();
          setIsProcessing(false);
        }
      } catch (err: unknown) {
        console.error('Scan processing error:', err);
        soundEffects.playErrorBuzz();
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
   * Camera Stream & Continuous Sensing Loop
   */
  const startCamera = async (mode: 'environment' | 'user' = facingMode, deviceId?: string) => {
    setCameraError(null);
    try {
      // Stop old tracks if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      streamRef.current = stream;
      setCameraActive(true);
      isScanningRef.current = true;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(() => {});
      }

      // Start frame scanning loop
      scanFrame();
    } catch (err: unknown) {
      console.warn('Camera could not be started automatically:', err);
      setCameraError('ካሜራ መክፈት አልተቻለም። እባክዎ የካሜራ ፍቃድ ይስጡ ወይም ከታች ያለውን ቁልፍ ይጫኑ።');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    isScanningRef.current = false;
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
    await startCamera(nextMode);
  };

  const handleDeviceChange = async (devId: string) => {
    setSelectedDeviceId(devId);
    if (devId) {
      await startCamera(facingMode, devId);
    } else {
      await startCamera(facingMode);
    }
  };

  /**
   * Continuous Sensing: Uses native BarcodeDetector API if available,
   * otherwise uses jsQR canvas scanner.
   */
  const scanFrame = async () => {
    if (!isScanningRef.current) return;
    const video = videoRef.current;

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isProcessing) {
      let codeFound: string | null = null;

      // 1. Try native BarcodeDetector (fastest, senses linear 1D barcodes and QR)
      if (barcodeDetectorRef.current) {
        try {
          const detected = await barcodeDetectorRef.current.detect(video);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            codeFound = detected[0].rawValue;
          }
        } catch {
          // ignore error and proceed to jsQR
        }
      }

      // 2. Fallback to jsQR on canvas
      if (!codeFound && canvasRef.current) {
        const canvas = canvasRef.current;
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
            codeFound = qrCode.data;
          }
        }
      }

      // If a code is sensed:
      if (codeFound) {
        handleBarcodeScanned(codeFound);
        // Pause scanning frame loop temporarily
        setTimeout(() => {
          if (isScanningRef.current) {
            animFrameId.current = requestAnimationFrame(scanFrame);
          }
        }, 1500);
        return;
      }
    }

    if (isScanningRef.current) {
      animFrameId.current = requestAnimationFrame(scanFrame);
    }
  };

  // Auto-start camera on initial mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // When returning to 'idle_scanning', reconnect camera stream and resume sensing
  useEffect(() => {
    if (viewState === 'idle_scanning') {
      if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
        isScanningRef.current = true;
        scanFrame();
      } else {
        startCamera();
      }
    }
  }, [viewState]);

  /**
   * Touchscreen Sensor Scan Handler:
   * When the user touches or holds their card/finger on the screen sensor area.
   */
  const handleTouchSensorScan = (codeToScan?: string) => {
    soundEffects.unlockAudio();
    soundEffects.playScanBeep();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch {}
    }
    setIsTouchSensingActive(true);
    setTouchSensorFeedback('የስክሪን ንኪኪ ሴንሰር መታወቂያውን እየተቀበለ ነው...');

    setTimeout(() => {
      setIsTouchSensingActive(false);
      setTouchSensorFeedback(null);
      if (codeToScan) {
        handleBarcodeScanned(codeToScan);
      } else if (manualInput.trim()) {
        handleBarcodeScanned(manualInput.trim());
        setManualInput('');
      } else {
        // Default to first active staff or first citizen if nothing selected
        const defaultSample = SAMPLE_FAYDA_CITIZENS[0].faydaId;
        handleBarcodeScanned(defaultSample);
      }
    }, 450);
  };

  /**
   * Visitor Rating Submission
   */
  const handleSelectRating = async (score: number, label: string) => {
    if (!activeFeedbackVisitor) return;
    setSelectedScore(score);
    setSelectedScoreLabel(label);
    soundEffects.unlockAudio();
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

  const closeCurrentModal = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setViewState('idle_scanning');
    setStaffResult(null);
    setVisitorResult(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-[calc(100vh-130px)] bg-slate-950 text-white p-3 sm:p-6 flex flex-col justify-between">
      {/* Top Kiosk Bar: Department Selector, Cameras & Audio Status */}
      <div className="max-w-6xl mx-auto w-full mb-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-xl backdrop-blur-md">
          {/* Department Selection for this door tablet */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
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

          {/* Time, Cameras & Touch Sensor status */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            <div className="text-right hidden sm:block mr-2">
              <div className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4" />
                <span>{ethTime.formatted}</span>
              </div>
              <span className="text-[10px] text-slate-400">የኢትዮጵያ ሰዓት • ስካነር ዝግጁ</span>
            </div>

            {/* Audio Test Button */}
            <button
              type="button"
              onClick={() => {
                soundEffects.unlockAudio();
                soundEffects.playScanBeep();
                setTimeout(() => soundEffects.playSuccessChime(), 140);
                setAudioNotice(true);
                setTimeout(() => setAudioNotice(false), 2600);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all shadow-md cursor-pointer"
              title="የስካነሩን የማረጋገጫ ድምፅ ይሞክሩ"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{audioNotice ? '🔊 ድምፅ እየሰራ ነው!' : 'ድምፅ ሞክር'}</span>
            </button>

            {/* Front / Back Camera Switch Toggle */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                facingMode === 'user'
                  ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                  : 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
              }`}
              title="የፊት ወይም የጀርባ ካሜራ ቀይር"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {facingMode === 'environment' ? 'የኋላ ካሜራ (Back)' : 'የፊት ካሜራ (Front)'}
              </span>
            </button>

            {/* Camera Device Dropdown (if multiple cameras exist) */}
            {videoDevices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-2 py-1.5 text-slate-200 max-w-[130px] truncate"
                title="የሚጠቀሙትን ካሜራ ይምረጡ"
              >
                <option value="">ካሜራ ምረጥ...</option>
                {videoDevices.map((dev, idx) => (
                  <option key={dev.deviceId || idx} value={dev.deviceId}>
                    {dev.label || `ካሜራ ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Camera Start / Stop */}
            <button
              type="button"
              onClick={cameraActive ? stopCamera : () => startCamera()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
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

            {/* Connected Police Digital ID System (Hidden Modal Trigger) */}
            <button
              type="button"
              onClick={() => setIsPoliceSystemModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all shadow-md cursor-pointer"
              title="የቤንሻንጉል ጉምዝ ፖሊስ ዲጂታል መታወቂያ ሲስተም ቋት"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">የፖሊስ መታወቂያ ቋት</span>
            </button>
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
              className="text-xs bg-rose-900/60 hover:bg-rose-800 px-2 py-1 rounded cursor-pointer"
            >
              አጥፋ
            </button>
          </div>
        )}
      </div>

      {/* Main Kiosk Center Container */}
      <div
        className="max-w-5xl mx-auto w-full flex-1 flex flex-col items-center justify-center relative"
        onClick={() => soundEffects.unlockAudio()}
      >
        {/* VIEW 1: Idle Scanning State */}
        {viewState === 'idle_scanning' && (
          <div className="w-full flex flex-col items-center">
            {/* Top Row: Side-by-side Camera & Touchscreen Sensor */}
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch max-w-5xl">
              
              {/* LEFT / CENTER: Live Camera Viewport (7 Cols on desktop) */}
              <div
                className={`lg:col-span-7 relative min-h-[300px] sm:min-h-[360px] rounded-3xl overflow-hidden bg-slate-900/95 shadow-2xl transition-all duration-300 flex flex-col items-center justify-center ${
                  isCardDetected
                    ? 'border-4 border-emerald-400 shadow-[0_0_40px_#10b981]'
                    : 'border-2 border-amber-500/50 shadow-amber-500/10'
                }`}
              >
                {/* Corner Targets */}
                <div
                  className={`absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 rounded-tl-xl pointer-events-none transition-colors z-20 ${
                    isCardDetected ? 'border-emerald-400' : 'border-amber-400'
                  }`}
                ></div>
                <div
                  className={`absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 rounded-tr-xl pointer-events-none transition-colors z-20 ${
                    isCardDetected ? 'border-emerald-400' : 'border-amber-400'
                  }`}
                ></div>
                <div
                  className={`absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 rounded-bl-xl pointer-events-none transition-colors z-20 ${
                    isCardDetected ? 'border-emerald-400' : 'border-amber-400'
                  }`}
                ></div>
                <div
                  className={`absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 rounded-br-xl pointer-events-none transition-colors z-20 ${
                    isCardDetected ? 'border-emerald-400' : 'border-amber-400'
                  }`}
                ></div>

                {/* Animated Laser Scanning Line */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_18px_#f59e0b] animate-[bounce_2.4s_infinite] pointer-events-none z-10 opacity-90"></div>

                {/* Visual Card Sensed Checkmark Flash Overlay */}
                {isCardDetected && (
                  <div className="absolute inset-0 bg-emerald-500/25 z-30 flex flex-col items-center justify-center animate-in zoom-in duration-150 backdrop-blur-[1px]">
                    <div className="w-20 h-20 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-2xl animate-bounce">
                      <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                    </div>
                    <span className="text-white font-black text-lg mt-2 bg-slate-950/80 px-4 py-1 rounded-full border border-emerald-400">
                      መታወቂያው ተቀባይነት አግኝቷል!
                    </span>
                  </div>
                )}

                {cameraActive ? (
                  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover absolute inset-0"
                      muted
                      autoPlay
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Active Sensor Status Header Pill */}
                    <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-20">
                      <div className="bg-slate-950/85 backdrop-blur-md text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-2 shadow-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span className="font-bold">
                          {facingMode === 'environment' ? 'የኋላ ካሜራ' : 'የፊት ካሜራ'} • ስካነር በርቷል 🔊
                        </span>
                      </div>
                    </div>

                    {/* Target Aiming Crosshair */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-10">
                      <div className="w-56 h-36 border border-dashed border-amber-400/80 rounded-2xl flex items-center justify-center">
                        <Zap className="w-6 h-6 text-amber-400 animate-pulse" />
                      </div>
                    </div>

                    {/* Guidance Footer */}
                    <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none px-4 z-20">
                      <span className="bg-slate-950/90 text-amber-300 text-xs px-3.5 py-1.5 rounded-full border border-amber-500/40 font-semibold shadow-md inline-block max-w-sm">
                        የፖሊስ ዲጂታል መታወቂያዎን ወይም የፋይዳ ካርድዎን በካሜራው ፊት ያሳዩ
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-center mb-3 animate-pulse">
                      <Scan className="w-10 h-10 text-amber-400" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-amber-300 font-serif mb-1">
                      መታወቂያዎን እዚህ ስካን ያድርጉ
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-sm">
                      የፖሊስ ዲጂታል መታወቂያዎን የጀርባ ባርኮድ ወይም የፋይዳ ዲጂታል መታወቂያዎን (Fayda QR) በስካነሩ ፊት ያሳዩ
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => {
                          soundEffects.unlockAudio();
                          startCamera('environment');
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>የኋላ ካሜራ ክፈት</span>
                      </button>
                      <button
                        onClick={() => {
                          soundEffects.unlockAudio();
                          startCamera('user');
                        }}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-slate-700 transition-transform active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>የፊት ካሜራ</span>
                      </button>
                    </div>
                    {cameraError && (
                      <p className="text-xs text-rose-400 mt-2 max-w-xs">{cameraError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Touchscreen Sensor Pad ("የስክሪን ንኪኪ ሴንሰር / Touch ID Sensor") (5 Cols on desktop) */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Fingerprint className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">የስክሪን ንኪኪ ሴንሰር</h4>
                      <p className="text-[11px] text-amber-400/90 font-medium">
                        Touchscreen ID Sensor Scan
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600/40 font-bold">
                    ሴንሰሩ ዝግጁ ነው
                  </span>
                </div>

                {/* Central Touch Target: Pressing / touching on screen triggers sensor scan */}
                <div className="my-4 flex flex-col items-center text-center">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTouchSensorScan()}
                    onTouchStart={() => handleTouchSensorScan()}
                    className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
                      isTouchSensingActive
                        ? 'bg-emerald-500/30 border-4 border-emerald-400 scale-105 shadow-[0_0_50px_#10b981]'
                        : 'bg-gradient-to-b from-amber-500/20 to-slate-950 border-2 border-amber-400/80 hover:border-amber-300 hover:scale-102 shadow-[0_0_30px_rgba(245,158,11,0.2)] active:scale-95'
                    }`}
                  >
                    {/* Concentric Sensor Rings */}
                    <div className="absolute inset-2 rounded-full border border-amber-400/30 pointer-events-none animate-ping"></div>
                    <div className="absolute inset-4 rounded-full border border-dashed border-amber-400/50 pointer-events-none"></div>

                    <Fingerprint
                      className={`w-12 h-12 transition-colors ${
                        isTouchSensingActive ? 'text-emerald-300' : 'text-amber-400'
                      }`}
                    />
                    <span className="text-[10px] font-black tracking-wider text-amber-300 mt-1 uppercase">
                      ስክሪኑን ይንኩ
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    መታወቂያዎን ወይም ጣትዎን በዚህ ሴንሰር ላይ ሲያስቀምጡ ወዲያውኑ ስካን ያደርጋል
                  </p>
                  {touchSensorFeedback && (
                    <span className="text-xs text-emerald-400 font-bold mt-1 animate-pulse">
                      {touchSensorFeedback}
                    </span>
                  )}
                </div>

                {/* Input or USB Gun Barcode Entry */}
                <div className="pt-2 border-t border-slate-800">
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
                        placeholder="ባጅ ወይም ፋይዳ ቁጥር..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shrink-0 transition-colors cursor-pointer"
                    >
                      ስካን
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Quick-Touch Cards Tray: Instant Touch Sensing for Citizens and Police */}
            <div className="w-full max-w-5xl mt-5 bg-slate-900/70 border border-slate-800 p-4 rounded-3xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  የተመዘገቡ መታወቂያዎች የንኪኪ ስካን (Touch Card Sensor Tray)
                </span>
                <span className="text-[11px] text-slate-400">
                  ማንኛውንም ካርድ በስክሪኑ ላይ በመንካት ወዲያውኑ ፎቶውንና መረጃውን ይመልከቱ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Police Staff Touch Cards */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-300 font-bold flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      የፖሊስ ዲጂታል መታወቂያ (የሰራተኛ ፎቶና መረጃ)
                    </span>
                    <span className="text-[10px] text-slate-400">ፖሊስ</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {staffList.slice(0, 4).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleBarcodeScanned(st.badgeNumber)}
                        className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                          st.status === 'on_duty'
                            ? 'bg-emerald-950/40 border-emerald-600/50 hover:bg-emerald-900/50'
                            : 'bg-slate-900/80 border-slate-700/60 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              st.photoUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={st.fullName}
                            className="w-9 h-9 rounded-full object-cover border border-amber-400"
                          />
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{st.fullName}</span>
                              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                                {st.rank}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              ባጅ: {st.badgeNumber} • {st.departmentName}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            st.status === 'on_duty'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {st.status === 'on_duty' ? 'መውጫ ስካን' : 'መግቢያ ስካን'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Fayda Citizens Touch Cards */}
                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      የፋይዳ ዲጂታል መታወቂያ (የባለጉዳይ ፎቶና መረጃ)
                    </span>
                    <span className="text-[10px] text-slate-400">ፋይዳ</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {SAMPLE_FAYDA_CITIZENS.map((c) => {
                      const isActive = visitors.some(
                        (v) => v.faydaId === c.faydaId && v.status === 'active'
                      );
                      return (
                        <button
                          key={c.faydaId}
                          type="button"
                          onClick={() => handleBarcodeScanned(c.faydaId)}
                          className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-950/40 border-amber-500/50 hover:bg-amber-900/50'
                              : 'bg-slate-900/80 border-slate-700/60 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.photoUrl}
                              alt={c.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-emerald-400"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{c.fullName}</span>
                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  ፋይዳ
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                FIN: {c.faydaId} • {c.gender}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {isActive ? 'መውጫ/አስተያየት' : 'መግቢያ ስካን'}
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

        {/* VIEW 2: Staff Police Success Checkmark Modal with Photo & Full Details */}
        {viewState === 'staff_success_modal' && staffResult && (
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/20 animate-in fade-in zoom-in duration-200">
            {/* Header with Green Checkmark */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                  {staffResult.action === 'check_in'
                    ? 'ተመዝግበዋል እናመሰግናለን!'
                    : 'ተመዝግበዋል፤ መልካም እረፍት!'}
                </h2>
                <p className="text-emerald-400 font-bold text-xs sm:text-sm">
                  {staffResult.action === 'check_in'
                    ? 'የፖሊስ ዲጂታል መታወቂያዎ ወደ ስራ መግባትዎን አረጋግጧል'
                    : 'ከሰዓት በኋላ ስራ ጨርሰው መውጣትዎ ተመዝግቧል'}
                </p>
              </div>
            </div>

            {/* The Authentic Police Digital ID Card (Front & Back Interactive View) */}
            <div className="my-4">
              <PoliceIdCard staff={staffResult.staff} settings={settings} />
            </div>

            {/* Comprehensive Police ID System Information Breakdown */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left mb-5 shadow-xl">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  የፖሊስ ዲጂታል መታወቂያ ሙሉ መረጃ (Accepted Police ID Record)
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-600/40">
                  ህጋዊ የኮሚሽኑ አባል
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">መለያ ቁጥር (ID NO):</span>
                  <span className="font-mono font-bold text-amber-300">
                    {staffResult.staff.idNumber || staffResult.staff.id}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ባጅ ቁጥር (Badge NO):</span>
                  <span className="font-bold text-white">{staffResult.staff.badgeNumber}</span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ማዕረግ / RANK:</span>
                  <span className="font-bold text-white">
                    {staffResult.staff.rank} {staffResult.staff.rankEn ? `/ ${staffResult.staff.rankEn}` : ''}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">የደም አይነት / ጾታ:</span>
                  <span className="font-bold text-red-400">
                    {staffResult.staff.bloodType || 'O+'} • {staffResult.staff.gender || 'ወ / M'}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">ሙሉ ስም (Amharic & English):</span>
                  <span className="font-bold text-white">
                    {staffResult.staff.fullName} {staffResult.staff.fullNameEn ? `(${staffResult.staff.fullNameEn})` : ''}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px]">ኃላፊነትና የስራ ክፍል:</span>
                  <span className="font-bold text-slate-200">
                    {staffResult.staff.responsibilityAm || staffResult.staff.departmentName}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ቁመት / መልክ:</span>
                  <span className="font-bold text-slate-200">
                    {staffResult.staff.height || '1.75m'} • {staffResult.staff.complexion || 'ጠይም'}
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">ስልክ ቁጥር:</span>
                  <span className="font-bold text-blue-400">{staffResult.staff.phone || '0911223344'}</span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">የተመዘገበበት ሰዓት:</span>
                  <span className="font-bold text-amber-300">
                    {staffResult.ethiopianTime} (ኢትዮጵያ)
                  </span>
                </div>

                <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">የሰዓት አክባሪነት:</span>
                  <span className="font-bold text-emerald-400">
                    {staffResult.punctualityLabel}
                  </span>
                </div>
              </div>

              {/* Verification Stamp Badges */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን ይፋዊ ዲጂታል መታወቂያ በሲስተሙ ተቀባይነት አግኝቷል</span>
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
                      የኮሚሽኑ አባል • በ{staffResult.doorDepartmentName} በር ስካን ተደርጓል
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Return Button and Countdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>በ {countdown} ሰከንድ ውስጥ ወደ ስካነሩ ይመለሳል...</span>
              </div>
              <button
                type="button"
                onClick={closeCurrentModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
              >
                እሺ (ተመለስ)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: Visitor Entry Success Modal with Fayda Photo & Full Details */}
        {viewState === 'visitor_entry_success_modal' && visitorResult && (
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-500/20 animate-in fade-in zoom-in duration-200">
            {/* Header with Green Checkmark */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                  ተመዝግበዋል እናመሰግናለን!
                </h2>
                <p className="text-emerald-400 font-bold text-xs sm:text-sm">
                  የፋይዳ ብሔራዊ ዲጂታል መታወቂያዎ (Fayda Digital ID) በተሳካ ሁኔታ ተመዝግቧል
                </p>
              </div>
            </div>

            {/* Official Ethiopian National Fayda Digital ID Card Display */}
            <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/60 rounded-2xl p-5 text-left mb-5 shadow-xl relative overflow-hidden">
              {/* Fayda National Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-sm shadow">
                    ፋይዳ
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-emerald-300 block uppercase tracking-wide">
                      የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ • ብሔራዊ ዲጂታል መታወቂያ
                    </span>
                    <span className="text-[10px] text-slate-400">
                      FDRE National ID Program • Fayda Digital ID
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-600/40">
                    ህጋዊ ባለጉዳይ
                  </span>
                </div>
              </div>

              {/* Citizen Photo & Full Cardholder Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Large Citizen Photograph */}
                <div className="relative shrink-0">
                  <img
                    src={
                      visitorResult.visitor.photoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={visitorResult.visitor.fullName}
                    className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl object-cover border-3 border-emerald-400 shadow-xl"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 rounded-full p-1 border-2 border-slate-950 shadow">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>

                {/* Citizen Information Fields */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      የባለጉዳዩ ሙሉ ስም (Cardholder Full Name)
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {visitorResult.visitor.fullName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">የፋይዳ መለያ (FIN):</span>
                      <span className="font-mono font-bold text-amber-300">
                        {visitorResult.visitor.faydaId}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">ጾታ / የስልክ ቁጥር:</span>
                      <span className="font-bold text-slate-200">
                        {visitorResult.visitor.gender || 'ዜጋ'}{' '}
                        {visitorResult.visitor.phone ? `• ${visitorResult.visitor.phone}` : ''}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">የገቡበት የስራ ሂደት:</span>
                      <span className="font-bold text-emerald-400">
                        {visitorResult.visitor.departmentName}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">የመግቢያ ሰዓት:</span>
                      <span className="font-bold text-amber-300">
                        {visitorResult.ethiopianTime} (ኢትዮጵያ)
                      </span>
                    </div>
                  </div>

                  {/* Purpose of Visit & Address */}
                  <div className="pt-1 space-y-1.5">
                    {visitorResult.visitor.address && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>መኖሪያ አድራሻ: {visitorResult.visitor.address}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>ጉዳይ: {visitorResult.visitor.purpose}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Return Button and Countdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>በ {countdown} ሰከንድ ውስጥ ወደ ስካነሩ ይመለሳል...</span>
              </div>
              <button
                type="button"
                onClick={closeCurrentModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer"
              >
                እሺ (ተመለስ)
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Visitor Departure Rating / Feedback Screen with Photo */}
        {viewState === 'visitor_feedback_screen' && activeFeedbackVisitor && (
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Citizen mini profile header */}
            <div className="flex items-center justify-center gap-3 mb-4 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <img
                src={
                  activeFeedbackVisitor.photoUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
                }
                alt={activeFeedbackVisitor.fullName}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400"
              />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-white">
                    {activeFeedbackVisitor.fullName}
                  </h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded border border-amber-500/30">
                    ባለጉዳይ
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  ፋይዳ: <span className="font-mono text-amber-300">{activeFeedbackVisitor.faydaId}</span> • ክፍል፡ {activeFeedbackVisitor.departmentName}
                </p>
              </div>
            </div>

            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>የአገልግሎት እርካታ አስተያየት መስጫ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-serif">
                በተሰጠዎት አገልግሎት ምን ያህል ረክተዋል?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                በ<span className="font-bold text-amber-300">{activeFeedbackVisitor.departmentName}</span> የነበረዎትን
                አገልግሎት ከዚህ በታች ካሉት አማራጮች አንዱን በመንካት ደረጃ ይስጡ፡
              </p>
            </div>

            {/* 5 Rating Buttons */}
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
                  type="button"
                  onClick={() => handleSelectRating(item.score, item.label)}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r ${item.color} text-white flex items-center justify-between shadow-lg transition-all transform active:scale-98 border border-white/10 group cursor-pointer`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 text-left">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${item.badgeColor} font-black text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                    >
                      {item.score}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base tracking-tight">
                        {item.label}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-white/80">{item.subtext}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-white/90 font-bold text-xs sm:text-sm">
                    <span>ይምረጡ</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setViewState('idle_scanning')}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
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
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full p-1 bg-gradient-to-tr from-amber-400 to-amber-200 shadow-xl mb-4">
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
              <p className="text-base sm:text-xl font-bold text-white italic font-serif">
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
      <div className="max-w-6xl mx-auto w-full mt-4 text-center text-xs text-slate-400 border-t border-slate-900 pt-3">
        <p>
          {settings.commissionName || 'የቤኒሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን'} • ዲጂታል የመታወቂያ እና የፋይዳ መስተንግዶ ሲስተም
        </p>
      </div>

      {/* Connected Police Digital ID System (Hidden / Administrative Modal) */}
      <PoliceIdSystemModal
        isOpen={isPoliceSystemModalOpen}
        onClose={() => setIsPoliceSystemModalOpen(false)}
        staffList={staffList}
        settings={settings}
        onScanTest={(id) => handleBarcodeScanned(id)}
      />
    </div>
  );
};
