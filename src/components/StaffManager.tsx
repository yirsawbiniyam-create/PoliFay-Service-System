import React, { useState, useRef } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Camera,
  Upload,
  Phone,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Building2,
  Image as ImageIcon,
  User,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Department, Staff, CommissionSettings } from '../types';
import {
  addStaff,
  updateStaff,
  deleteStaff,
  fetchPoliceIdFromRegistry,
  fetchAllPoliceIdsFromRegistry,
  syncAllPoliceIdsFromExternalSystem,
} from '../services/dbService';
import { testPoliceIdSystemConnection } from '../firebase';
import { PoliceIdCard } from './PoliceIdCard';
import { INITIAL_STAFF, POLICE_PORTRAIT_AVATARS } from '../data/initialData';
import { PoliceIdSystemModal } from './PoliceIdSystemModal';

interface StaffManagerProps {
  departments: Department[];
  staffList: Staff[];
  settings?: CommissionSettings;
  onOpenCard?: (staff: Staff) => void;
}

const POLICE_RANKS = [
  'ኮንስታብል',
  'ረዳት ሳጅን',
  'ምክትል ሳጅን',
  'ሳጅን',
  'ዋና ሳጅን',
  'ረዳት ኢንስፔክተር',
  'ምክትል ኢንስፔክተር',
  'ኢንስፔክተር',
  'ዋና ኢንስፔክተር',
  'ምክትል ኮማንደር',
  'ኮማንደር',
  'ረዳት ኮሚሽነር',
  'ምክትል ኮሚሽነር',
  'ኮሚሽነር',
];

export const StaffManager: React.FC<StaffManagerProps> = ({
  departments,
  staffList,
  settings,
  onOpenCard,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [viewMode, setViewMode] = useState<'by_department' | 'all_grid'>('by_department');
  
  // Registration Modal state: 3 steps as requested
  // Step 1: Input/Select Officer Details + Photo (Auto-fetched from ID System)
  // Step 2: Show Front & Back of ID Card Preview
  // Step 3: Assign Department, Responsibility & Confirm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [step1Mode, setStep1Mode] = useState<'pick_existing' | 'new_officer'>('new_officer');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Registered Police IDs pool from the Police ID System
  const [registryOfficers, setRegistryOfficers] = useState<Staff[]>([]);
  const [showManualEditDetails, setShowManualEditDetails] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  // Form Fields for Complete Police Digital ID
  const [idNumber, setIdNumber] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [rank, setRank] = useState('ኮንስታብል');
  const [rankEn, setRankEn] = useState('Constable');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [gender, setGender] = useState('ወ / M');
  const [height, setHeight] = useState('1.75m');
  const [complexion, setComplexion] = useState('ጠይም (Brown)');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'special_office');
  const [responsibilityAm, setResponsibilityAm] = useState('');

  const [isFetchingId, setIsFetchingId] = useState(false);
  const [fetchSuccessMessage, setFetchSuccessMessage] = useState<string | null>(null);
  const [foundOfficerPreview, setFoundOfficerPreview] = useState<Staff | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);
  const [candidateStaff, setCandidateStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Central Police ID System Modal state
  const [isIdSystemModalOpen, setIsIdSystemModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isSystemOnline, setIsSystemOnline] = useState<boolean | null>(true);

  const reloadRegistry = async () => {
    try {
      const list = await fetchAllPoliceIdsFromRegistry();
      if (list && list.length > 0) {
        setRegistryOfficers(list);
      }
    } catch {}
  };

  // Pre-load registered officers from Police ID System and check connection health
  React.useEffect(() => {
    reloadRegistry();
    testPoliceIdSystemConnection().then((res) => {
      setIsSystemOnline(res.connected);
    });

    const handleSyncEvent = () => reloadRegistry();
    if (typeof window !== 'undefined') {
      window.addEventListener('police_ids_synced', handleSyncEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('police_ids_synced', handleSyncEvent);
      }
    };
  }, []);

  const handleSyncFromPoliceIdSystem = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await syncAllPoliceIdsFromExternalSystem(departments);
      setSyncStatusMsg(
        `✓ ${res.total} የፖሊስ አባላት ከመታወቂያ ሲስተም (bg-police-id-system) ጋር ተመሳስለዋል! (${res.added} አዲስ ተመዝግቧል፣ ${res.updated} ታድሷል)`
      );
      await reloadRegistry();
    } catch (err: any) {
      setSyncStatusMsg(`የማመሳሰል ችግር፡ ${err.message || 'እባክዎ እንደገና ይሞክሩ'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        (s.fullNameEn && s.fullNameEn.toLowerCase().includes(q)) ||
        s.badgeNumber.toLowerCase().includes(q) ||
        (s.idNumber && s.idNumber.toLowerCase().includes(q)) ||
        s.rank.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = (targetDeptId?: string) => {
    setEditingStaff(null);
    setCandidateStaff(null);
    setModalError(null);
    setFetchSuccessMessage(null);
    setFoundOfficerPreview(null);
    setIsFetchingId(false);
    setModalStep(1);
    setStep1Mode('new_officer');
    setShowManualEditDetails(false);

    // Refresh registry list in background
    fetchAllPoliceIdsFromRegistry().then((list) => {
      if (list && list.length > 0) setRegistryOfficers(list);
    });

    setIdNumber('');
    setBadgeNumber('');
    setFullName('');
    setFullNameEn('');
    setRank('ኮንስታብል');
    setRankEn('Constable');
    setPhotoUrl(POLICE_PORTRAIT_AVATARS[0].url);
    setBloodType('O+');
    setGender('ወ / M');
    setHeight('1.75m');
    setComplexion('ጠይም (Brown)');
    setPhone('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setDepartmentId(targetDeptId || (selectedDept !== 'all' ? selectedDept : departments[0]?.id || 'special_office'));
    setResponsibilityAm('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    setEditingStaff(st);
    setCandidateStaff(st);
    setIdNumber(st.idNumber || st.id);
    setBadgeNumber(st.badgeNumber);
    setFullName(st.fullName);
    setFullNameEn(st.fullNameEn || '');
    setRank(st.rank);
    setRankEn(st.rankEn || '');
    setPhotoUrl(st.photoUrl || POLICE_PORTRAIT_AVATARS[0].url);
    setBloodType(st.bloodType || 'O+');
    setGender(st.gender || 'ወ / M');
    setHeight(st.height || '1.75m');
    setComplexion(st.complexion || 'ጠይም (Brown)');
    setPhone(st.phone || '');
    setEmergencyContactName(st.emergencyContactName || '');
    setEmergencyContactPhone(st.emergencyContactPhone || '');
    setDepartmentId(st.departmentId);
    setResponsibilityAm(st.responsibilityAm || '');
    setModalStep(1);
    setStep1Mode('new_officer');
    setIsModalOpen(true);
  };

  // Helper to handle image uploads/camera capture to Base64
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle ID input changes with debounced automatic lookup from the Police ID System
  const handleIdInputChange = (val: string) => {
    setIdNumber(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    const clean = val.trim();
    if (clean.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        handleLookupId(clean);
      }, 200);
    } else {
      setFoundOfficerPreview(null);
      setFetchSuccessMessage(null);
    }
  };

  // Step 1: Pre-populate when an existing ID is chosen
  const handleSelectExistingId = (st: Staff) => {
    setIdNumber(st.idNumber || st.id);
    setBadgeNumber(st.badgeNumber);
    setFullName(st.fullName);
    setFullNameEn(st.fullNameEn || st.fullName);
    setRank(st.rank);
    setRankEn(st.rankEn || st.rank);
    setPhotoUrl(st.photoUrl || POLICE_PORTRAIT_AVATARS[0].url);
    setBloodType(st.bloodType || 'O+');
    setGender(st.gender || 'ወ / M');
    setHeight(st.height || '1.75m');
    setComplexion(st.complexion || 'ጠይም (Brown)');
    setPhone(st.phone || '');
    setEmergencyContactName(st.emergencyContactName || '');
    setEmergencyContactPhone(st.emergencyContactPhone || '');
    setResponsibilityAm(st.responsibilityAm || '');
    if (st.departmentId && departments.some((d) => d.id === st.departmentId)) {
      setDepartmentId(st.departmentId);
    }
    setFoundOfficerPreview(st);
    setFetchSuccessMessage(`✓ ከመታወቂያ ሲስተሙ የተገኘ፡ ${st.fullName} (${st.rank})`);
  };

  // Auto-search and pre-fill all officer information + photo from police ID system
  const handleLookupId = async (inputStr: string) => {
    const q = inputStr.trim();
    if (!q || q.length < 2) return;
    setIsFetchingId(true);
    setModalError(null);

    try {
      const found = await fetchPoliceIdFromRegistry(q);
      if (found) {
        setIdNumber(found.idNumber || found.id);
        setBadgeNumber(found.badgeNumber || '');
        setFullName(found.fullName);
        setFullNameEn(found.fullNameEn || '');
        setRank(found.rank);
        setRankEn(found.rankEn || '');
        if (found.photoUrl) {
          setPhotoUrl(found.photoUrl);
        }
        if (found.bloodType) setBloodType(found.bloodType);
        if (found.gender) setGender(found.gender);
        if (found.height) setHeight(found.height);
        if (found.complexion) setComplexion(found.complexion);
        if (found.phone) setPhone(found.phone);
        if (found.emergencyContactName) setEmergencyContactName(found.emergencyContactName);
        if (found.emergencyContactPhone) setEmergencyContactPhone(found.emergencyContactPhone);
        if (found.departmentId && departments.some((d) => d.id === found.departmentId)) {
          setDepartmentId(found.departmentId);
        }
        if (found.responsibilityAm) setResponsibilityAm(found.responsibilityAm);
        setFoundOfficerPreview(found);
        setFetchSuccessMessage(`✨ ከመታወቂያ ሲስተሙ ሙሉ መረጃና ፎቶ መጥቷል፡ "${found.fullName}" (${found.rank})!`);
      } else {
        setFoundOfficerPreview(null);
        setFetchSuccessMessage(null);
      }
    } catch (err: any) {
      console.warn('handleLookupId error:', err);
    } finally {
      setIsFetchingId(false);
    }
  };

  // Direct 1-Click Registration from Fetched ID Data (No manual typing required!)
  const handleDirectRegisterFromFetched = async () => {
    if (!idNumber.trim()) {
      setModalError('እባክዎ መጀመሪያ የዲጂታል መታወቂያ ቁጥር ያስገቡ ወይም ይምረጡ!');
      return;
    }
    if (!fullName.trim()) {
      setModalError('እባክዎ መጀመሪያ የመታወቂያ ቁጥሩን ፈልገው መረጃውን ያምጡ!');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const deptObj = departments.find((d) => d.id === departmentId);
      const deptName = deptObj ? deptObj.name : 'የኮሚሽኑ ልዩ ጽ/ቤት';

      const payload: Staff = {
        id: idNumber.trim().toUpperCase(),
        idNumber: idNumber.trim().toUpperCase(),
        badgeNumber: badgeNumber.trim() || `POL-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: fullName.trim(),
        fullNameEn: fullNameEn.trim() || fullName.trim(),
        rank,
        rankEn: rankEn.trim() || rank,
        departmentId,
        departmentName: deptName,
        responsibilityAm: responsibilityAm.trim() || deptName,
        phone: phone.trim(),
        photoUrl: photoUrl.trim() || POLICE_PORTRAIT_AVATARS[0].url,
        bloodType,
        gender,
        height,
        complexion,
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        issuedAt: '2026-01-10',
        expiresAt: '2028-01-10',
        status: editingStaff ? editingStaff.status : 'off_duty',
        active: true,
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, payload);
      } else {
        await addStaff(payload);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'ሰራተኛውን በመመዝገብ ላይ ችግር አጋጥሟል');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 1 -> STEP 2: Validate and generate live candidate card
  const handleProceedToStep2 = () => {
    setModalError(null);
    if (!idNumber.trim()) {
      setModalError('እባክዎ የፖሊስ ዲጂታል መታወቂያ ቁጥር ያስገቡ!');
      return;
    }
    if (!fullName.trim()) {
      setModalError('እባክዎ የፖሊስ አባሉን ሙሉ ስም ያስገቡ!');
      return;
    }

    const deptObj = departments.find((d) => d.id === departmentId);
    const deptName = deptObj ? deptObj.name : 'የኮሚሽኑ ልዩ ጽ/ቤት';

    const candidate: Staff = {
      id: idNumber.trim().toUpperCase(),
      idNumber: idNumber.trim().toUpperCase(),
      badgeNumber: badgeNumber.trim() || `POL-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: fullName.trim(),
      fullNameEn: fullNameEn.trim() || fullName.trim(),
      rank,
      rankEn: rankEn.trim() || rank,
      departmentId,
      departmentName: deptName,
      responsibilityAm: responsibilityAm.trim() || deptName,
      phone: phone.trim(),
      photoUrl: photoUrl.trim() || POLICE_PORTRAIT_AVATARS[0].url,
      bloodType,
      gender,
      height,
      complexion,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      issuedAt: '2026-01-10',
      expiresAt: '2028-01-10',
      status: editingStaff ? editingStaff.status : 'off_duty',
      active: true,
    };

    setCandidateStaff(candidate);
    setModalStep(2);
  };

  // STEP 3: Confirm and save to both 'staff' and 'ids' collections
  const handleFinalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateStaff) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      const deptObj = departments.find((d) => d.id === departmentId);
      const deptName = deptObj ? deptObj.name : 'አጠቃላይ የስራ ሂደት';

      const payload = {
        ...candidateStaff,
        departmentId,
        departmentName: deptName,
        responsibilityAm: responsibilityAm.trim() || deptName,
        phone: phone.trim(),
      };

      if (editingStaff) {
        await updateStaff(editingStaff.id, payload);
      } else {
        await addStaff(payload);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'ሰራተኛውን በመመዝገብ ላይ ችግር አጋጥሟል');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (st: Staff) => {
    if (confirm(`የፖሊስ አባል "${st.fullName}" (${st.idNumber || st.badgeNumber}) እንዲሰረዝ እርግጠኛ ነዎት?`)) {
      await deleteStaff(st.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የፖሊስ ሰራተኞች እና አባላት በየክፍሉ መመዝገቢያ
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            በኮሚሽኑ ውስጥ የሚሰሩ ሰራተኞችን በዲጂታል መታወቂያ ቁጥራቸው፣ በሙሉ መረጃቸውና በፎቷቸው በየክፍሉ መመዝገቢያ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Button to open Police ID Central System */}
          <button
            onClick={() => setIsIdSystemModalOpen(true)}
            className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>የዲጂታል መታወቂያ ቋት (Police ID Registry)</span>
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('by_department')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'by_department'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              በየክፍሉ ከፋፍለህ መዝግብ
            </button>
            <button
              onClick={() => setViewMode('all_grid')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'all_grid'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              የሁሉም ሰራተኞች ዝርዝር
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>አዲስ ሰራተኛ መዝግብ</span>
          </button>
        </div>
      </div>

      {/* Live Bridge Card to Benishangul-Gumuz Police Digital ID System (bg-police-id-system) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white font-serif">
                የቤንሻንጉል ጉሙዝ ክልል ፖሊስ ኮሚሽን የዲጂታል መታወቂያ ሲስተም ትስስር
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ቀጥታ የተገናኘ (bg-police-id-system)</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              ከመታወቂያ ሲስተም ጋር የተናበበ፡ በመታወቂያ ሲስተሙ የተመዘገቡ <strong className="text-amber-400 font-mono">{registryOfficers.length}</strong> የፖሊስ አባላት በቋቱ ውስጥ ይገኛሉ። ሰራተኞችን ሲመዘግቡ በመታወቂያ ቁጥራቸው ብቻ ሙሉ መረጃቸውና ፎቷቸው በቅጽበት ይወርዳል!
            </p>
            {syncStatusMsg && (
              <p className="text-xs text-emerald-300 font-bold mt-2 animate-in fade-in">
                {syncStatusMsg}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSyncFromPoliceIdSystem}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'እያመሳሰለ ነው...' : '🔄 ከመታወቂያ ሲስተም ሁሉንም አባላት አመሳስል'}</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="በስም፣ በማዕረግ፣ በዲጂታል መታወቂያ ይፈልጉ..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-amber-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white rounded-lg px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="all">ሁሉም የስራ ክፍሎች ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: By Department Roster View (በየስራ ክፍሉ ገብቶ መመዝገብ) */}
      {viewMode === 'by_department' && (
        <div className="space-y-6">
          {departments
            .filter((d) => selectedDept === 'all' || d.id === selectedDept)
            .map((dept) => {
              const deptStaffMembers = filteredStaff.filter((s) => s.departmentId === dept.id);
              return (
                <div
                  key={dept.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="bg-slate-950/80 border-b border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-white text-base sm:text-lg">
                            {dept.name}
                          </h3>
                          <span className="text-[10px] font-mono bg-slate-900 text-amber-400 px-2 py-0.5 rounded border border-slate-800">
                            {dept.code} {dept.roomNumber ? `• ${dept.roomNumber}` : ''}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          በዚህ ክፍል ስር የተመዘገቡ የፖሊስ አባላት፡{' '}
                          <span className="font-bold text-amber-400">{deptStaffMembers.length}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenAdd(dept.id)}
                      className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ በዚህ ክፍል ስር አባል መዝግብ</span>
                    </button>
                  </div>

                  <div className="p-4">
                    {deptStaffMembers.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        በዚህ የስራ ክፍል ስር የተመዘገበ ሰራተኛ የለም። «+ በዚህ ክፍል ስር አባል መዝግብ» የሚለውን በመንካት ይመዝግቡ።
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deptStaffMembers.map((st) => (
                          <div
                            key={st.id}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <img
                                src={
                                  st.photoUrl ||
                                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={st.fullName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/70 shrink-0"
                              />
                              <div className="overflow-hidden">
                                <h4 className="font-bold text-white text-xs truncate">
                                  {st.fullName}
                                </h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <span className="text-amber-300 font-semibold">{st.rank}</span>
                                  <span>•</span>
                                  <span className="font-mono text-amber-400 font-bold">{st.idNumber || st.badgeNumber}</span>
                                </div>
                                <span className="text-[10px] text-emerald-400 font-medium block truncate">
                                  ✓ {st.responsibilityAm || dept.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onOpenCard && (
                                <button
                                  onClick={() => onOpenCard(st)}
                                  className="p-1 rounded bg-slate-900 text-amber-400 hover:bg-slate-800 cursor-pointer"
                                  title="ዲጂታል ካርድ አሳይ"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(st)}
                                className="p-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800 cursor-pointer"
                                title="አስተካክል"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(st)}
                                className="p-1 rounded bg-slate-900 text-rose-400 hover:bg-rose-950 cursor-pointer"
                                title="ሰርዝ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW 2: All Staff Grid View */}
      {viewMode === 'all_grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((st) => (
            <div
              key={st.id}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        st.photoUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={st.fullName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/70 shrink-0"
                    />
                    <div>
                      <h3 className="font-extrabold text-white text-base leading-tight">
                        {st.fullName}
                      </h3>
                      {st.fullNameEn && (
                        <span className="block text-[11px] text-slate-400 font-sans">
                          {st.fullNameEn}
                        </span>
                      )}
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mt-1">
                        {st.rank}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      st.status === 'on_duty'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        st.status === 'on_duty' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    ></span>
                    {st.status === 'on_duty' ? 'ስራ ላይ' : 'ያልገባ'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">የዲጂታል መታወቂያ:</span>
                    <span className="font-mono font-bold text-amber-400">{st.idNumber || st.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">የፖሊስ ባጅ:</span>
                    <span className="font-mono text-white font-semibold">{st.badgeNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">የስራ ክፍል:</span>
                    <span className="font-medium text-white truncate max-w-[170px] text-right">
                      {st.departmentName}
                    </span>
                  </div>
                  {st.responsibilityAm && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ኃላፊነት:</span>
                      <span className="text-slate-200">{st.responsibilityAm}</span>
                    </div>
                  )}
                  {st.bloodType && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">የደም ዓይነት:</span>
                      <span className="font-bold text-rose-400">{st.bloodType}</span>
                    </div>
                  )}
                  {st.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ስልክ:</span>
                      <span className="font-mono text-cyan-400">{st.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                {onOpenCard && (
                  <button
                    onClick={() => onOpenCard(st)}
                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>ዲጂታል ካርድ አሳይ</span>
                  </button>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => handleOpenEdit(st)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="አስተካክል"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(st)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors cursor-pointer"
                    title="ሰርዝ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3-STEP COMPLETE REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150 my-6 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-serif flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>{editingStaff ? 'የሰራተኛ መረጃ ማስተካከያ' : 'የፖሊስ አባልና ዲጂታል መታወቂያ መመዝገቢያ'}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {modalStep === 1 && 'ደረጃ 1፡ የመታወቂያ ቁጥር፣ ሙሉ ስም እና ፎቶ ሙላ'}
                  {modalStep === 2 && 'ደረጃ 2፡ የዲጂታል መታወቂያ ካርድ (የፊትና የኋላ ገጽ) ማረጋገጫ'}
                  {modalStep === 3 && 'ደረጃ 3፡ የሚመደብበት የስራ ሂደትና ኃላፊነት መመደቢያ'}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold shrink-0">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1</span>
                <span className="text-slate-600">-</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2</span>
                <span className="text-slate-600">-</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3</span>
              </div>
            </div>

            {/* STEP 1: Auto-fetch Officer from Digital Police ID System (Zero manual typing required!) */}
            {modalStep === 1 && (
              <div className="space-y-4">
                {/* Connection Status Banner */}
                <div className="bg-gradient-to-r from-amber-500/15 via-slate-950 to-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white">
                          የፖሊስ ዲጂታል መታወቂያ ሲስተም ግንኙነት
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          የተገናኘ / Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        አድሚኑ ሰራተኞችን ሲመዘግብ ሙሉ መረጃ መፃፍ አይጠበቅበትም፤ የዲጂታል መታወቂያ ቁጥሩን ሲያስገቡ (ወይም ከስሩ ሲመርጡ) ሙሉ መረጃውና ፎቶው በቅጽበት ይወርዳል!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Primary Input: ID Number with Instant Lookup */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>የፖሊስ ዲጂታል መታወቂያ ቁጥር (ወይም ባጅ / ስም) *</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      በመጻፍ ወይም ከታች በመጫን ይምረጡ
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      value={idNumber}
                      onChange={(e) => handleIdInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupId(idNumber);
                        }
                      }}
                      placeholder="ለምሳሌ፡ BGR-POL-1600001 ወይም 1600001 ወይም POL-0192 ወይም ግርማይ"
                      className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-500 rounded-xl pl-3.5 pr-28 py-2.5 text-xs sm:text-sm font-mono text-white outline-none transition-colors shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupId(idNumber)}
                      disabled={isFetchingId}
                      className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow"
                    >
                      {isFetchingId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>{isFetchingId ? 'እየፈለገ...' : 'መረጃ አምጣ'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    * ቁጥሩን ሲጽፉ ሲስተሙ በቅጽበት ፈልጎ የባለቤቱን ፎቶ እና ሙሉ መረጃ ያመጣል
                  </p>
                </div>

                {/* Quick Picker from Registered Police Officers */}
                {registryOfficers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>ከተመዘገቡ የፖሊስ ዲጂታል መታወቂያዎች በፍጥነት ይምረጡ (1-Click):</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {registryOfficers.length} አባላት ተገኝተዋል
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {registryOfficers.slice(0, 10).map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleSelectExistingId(st)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                            idNumber === (st.idNumber || st.id)
                              ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                              : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40 text-slate-300'
                          }`}
                        >
                          <img
                            src={st.photoUrl || POLICE_PORTRAIT_AVATARS[0].url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
                          />
                          <div className="overflow-hidden min-w-0">
                            <span className="text-xs font-bold text-white block truncate">
                              {st.fullName}
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono block">
                              {st.idNumber || st.id} • {st.rank}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VERIFIED OFFICER CARD (Auto-populated from ID System) */}
                {fullName ? (
                  <div className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/60 shadow-xl space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>ከፖሊስ ዲጂታል መታወቂያ ሲስተም በቀጥታ የተገኘ ሙሉ መረጃ</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        ጽሁፍ መሙላት አያስፈልግም
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      {/* Officer Photo */}
                      <div className="relative shrink-0">
                        <img
                          src={photoUrl || POLICE_PORTRAIT_AVATARS[0].url}
                          alt={fullName}
                          className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1 rounded-full shadow">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Officer Details Grid */}
                      <div className="flex-1 w-full space-y-2 text-xs">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                            {rank} {rankEn ? `(${rankEn})` : ''}
                          </span>
                          <h4 className="text-base font-black text-white">{fullName}</h4>
                          {fullNameEn && (
                            <span className="text-xs text-slate-400 block font-sans">
                              {fullNameEn}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block">የመታወቂያ ቁጥር:</span>
                            <span className="font-mono font-bold text-amber-400">
                              {idNumber}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">የባጅ ቁጥር:</span>
                            <span className="font-mono text-white font-semibold">
                              {badgeNumber || 'POL-0000'}
                            </span>
                          </div>
                          {phone && (
                            <div>
                              <span className="text-slate-400 block">ስልክ ቁጥር:</span>
                              <span className="font-mono text-cyan-400">{phone}</span>
                            </div>
                          )}
                          {bloodType && (
                            <div>
                              <span className="text-slate-400 block">የደም ዓይነት:</span>
                              <span className="font-bold text-rose-400">{bloodType}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* DEPARTMENT ASSIGNMENT SELECTOR (The only choice the admin needs to make!) */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          የሚመደቡበት የስራ ሂደት (ክፍል) ምረጥ *
                        </label>
                        <select
                          value={departmentId}
                          onChange={(e) => setDepartmentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 font-bold"
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          የስራ ኃላፊነት (አማራጭ)
                        </label>
                        <input
                          type="text"
                          value={responsibilityAm}
                          onChange={(e) => setResponsibilityAm(e.target.value)}
                          placeholder="ለምሳሌ፡ የክፍል አስተባባሪ / መርማሪ (ባዶ ከሆነ የክፍሉ ስም ይሆናል)"
                          className="w-full bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* DIRECT FAST REGISTRATION BUTTONS */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleDirectRegisterFromFetched}
                        disabled={isSubmitting}
                        className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        )}
                        <span>
                          {isSubmitting
                            ? 'በመመዝገብ ላይ...'
                            : '⚡ በመጣው መረጃ ሰራተኛውን ወዲያውኑ መዝግብ'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>የመታወቂያ ካርድ ገጽ እይ (ደረጃ 2)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                    <Shield className="w-8 h-8 text-slate-600 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-300">
                      የፖሊስ ዲጂታል መታወቂያ ቁጥር አልተመረጠም
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      እባክዎ ከላይ የመታወቂያ ቁጥሩን ያስገቡ ወይም ከተዘጋጁት የፖሊስ አባላት አንዱን ይጫኑ። መረጃው በራሱ ተሞልቶ ይመጣል።
                    </p>
                  </div>
                )}

                {/* Collapsible toggle for optional manual details inspection */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowManualEditDetails(!showManualEditDetails)}
                    className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <span>{showManualEditDetails ? '▼' : '►'}</span>
                    <span>ዝርዝር መረጃዎችን በእጅ ለማየት ወይም ለማስተካከል (አማራጭ)</span>
                  </button>

                  {showManualEditDetails && (
                    <div className="mt-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            ሙሉ ስም በአማርኛ
                          </label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            ሙሉ ስም በእንግሊዝኛ
                          </label>
                          <input
                            type="text"
                            value={fullNameEn}
                            onChange={(e) => setFullNameEn(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            የፖሊስ ማዕረግ
                          </label>
                          <select
                            value={rank}
                            onChange={(e) => setRank(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-2"
                          >
                            {POLICE_RANKS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            የደም ዓይነት
                          </label>
                          <select
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-2 font-bold"
                          >
                            {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            ጾታ
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-2"
                          >
                            <option value="ወ / M">ወንድ / M</option>
                            <option value="ሴ / F">ሴት / F</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            ስልክ ቁጥር
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-xs font-mono text-white rounded-xl px-2.5 py-2"
                          />
                        </div>
                      </div>

                      {/* Photo custom selector */}
                      <div className="flex items-center gap-3 pt-2">
                        <img
                          src={photoUrl || POLICE_PORTRAIT_AVATARS[0].url}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border border-amber-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>ፎቶ ቀይር</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePhotoFileChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {modalError && (
                  <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    ይቅር
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToStep2}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                  >
                    <span>ቀጣይ (መታወቂያ ካርድ እይ)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Show Front & Back of Police Digital ID Card Preview */}
            {modalStep === 2 && candidateStaff && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                    ✓ የዲጂታል መታወቂያ ካርድ ቅድመ-እይታ
                  </span>
                  <h3 className="text-sm font-black text-white">
                    እባክዎ የተሞላውን መረጃ እና ፎቶ በካርዱ ላይ ያረጋግጡ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ካርዱን በመጫን የፊት እና የኋላ ገጹን ማገላበጥ ይችላሉ።
                  </p>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-full max-w-md transform scale-[0.92] sm:scale-100 origin-top">
                    <PoliceIdCard staff={candidateStaff} settings={settings} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ተመለስና አስተካክል</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep(3)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                  >
                    <span>ቀጣይ (የስራ ክፍል መደብ)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Assign Department, Responsibility and Final Save */}
            {modalStep === 3 && candidateStaff && (
              <form onSubmit={handleFinalSave} className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                  <img
                    src={candidateStaff.photoUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/70"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {candidateStaff.rank} {candidateStaff.fullName}
                    </h4>
                    <span className="font-mono text-xs text-amber-400">
                      {candidateStaff.idNumber} • {candidateStaff.badgeNumber}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    የሚመደብበት የስራ ሂደት (ክፍል) *
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    የተሰጠው ኃላፊነት (Responsibility in this Department) *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsibilityAm}
                    onChange={(e) => setResponsibilityAm(e.target.value)}
                    placeholder="ለምሳሌ፡ ዋና መርማሪ / የክፍል አስተባባሪ"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    ስልክ ቁጥር
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono text-xs sm:text-sm"
                  />
                </div>

                {modalError && (
                  <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalStep(2)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ተመለስ</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'እየመዘገበ ነው...' : 'በክፍሉ ውስጥ መዝግብና አጽድቅ'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Central Police ID System Modal */}
      <PoliceIdSystemModal
        isOpen={isIdSystemModalOpen}
        onClose={() => setIsIdSystemModalOpen(false)}
        staffList={staffList}
        settings={{
          commissionName: 'የቤንሻንጉል ጉምዝ ክልል ፖሊስ ኮሚሽን',
          logoUrl: '',
          flagUrl: '',
          regionalFlagUrl: '',
          motto: 'የህዝብ ሰላምና ደህንነት ቅድሚያ ተልዕኳችን ነው!',
          morningStart: '08:30',
          morningDeadline: '09:00',
          eveningExitTime: '17:00',
        }}
      />
    </div>
  );
};
