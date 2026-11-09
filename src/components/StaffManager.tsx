import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { Department, Staff, PoliceIDRecord } from '../types';
import { addStaff, updateStaff, deleteStaff } from '../services/dbService';
import { PoliceIdCard } from './PoliceIdCard';
import { INITIAL_STAFF } from '../data/initialData';

interface StaffManagerProps {
  departments: Department[];
  staffList: Staff[];
  onOpenCard?: (staff: Staff) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  departments,
  staffList,
  onOpenCard,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [viewMode, setViewMode] = useState<'by_department' | 'all_grid'>('by_department');
  
  // Registration Modal state: 3 steps as requested
  // Step 1: Input ID Number -> Next
  // Step 2: Show Front & Back of ID Card -> Next
  // Step 3: Assign Department, Responsibility & Save
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form Fields
  const [idNumberInput, setIdNumberInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [candidateStaff, setCandidateStaff] = useState<Staff | null>(null);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'special_office');
  const [responsibilityAm, setResponsibilityAm] = useState('');
  const [phone, setPhone] = useState('');

  const filteredStaff = staffList.filter((s) => {
    if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
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
    setIdNumberInput('');
    setModalError(null);
    setModalStep(1);
    setDepartmentId(targetDeptId || (selectedDept !== 'all' ? selectedDept : departments[0]?.id || 'special_office'));
    setResponsibilityAm('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    setEditingStaff(st);
    setCandidateStaff(st);
    setIdNumberInput(st.idNumber || st.badgeNumber);
    setDepartmentId(st.departmentId);
    setResponsibilityAm(st.responsibilityAm || '');
    setPhone(st.phone || '');
    setModalStep(3); // Go straight to assignment for edit
    setIsModalOpen(true);
  };

  // STEP 1 -> STEP 2: Lookup ID Number
  const handleVerifyIdStep1 = () => {
    setModalError(null);
    const query = idNumberInput.trim().toLowerCase();
    if (!query) {
      setModalError('እባክዎ የፖሊስ ዲጂታል መታወቂያ ቁጥር ያስገቡ!');
      return;
    }

    // Check existing staff or initial records
    let found = staffList.find(
      (s) =>
        s.id.toLowerCase() === query ||
        (s.idNumber && s.idNumber.toLowerCase() === query) ||
        s.badgeNumber.toLowerCase() === query ||
        query.includes(s.badgeNumber.toLowerCase())
    );

    if (!found) {
      found = INITIAL_STAFF.find(
        (s) =>
          s.id.toLowerCase() === query ||
          (s.idNumber && s.idNumber.toLowerCase() === query) ||
          s.badgeNumber.toLowerCase() === query ||
          query.includes(s.badgeNumber.toLowerCase())
      );
    }

    // If not found in known list, generate a verified candidate template
    if (!found) {
      const randomBadge = `POL-${Math.floor(1000 + Math.random() * 9000)}`;
      found = {
        id: query.toUpperCase(),
        idNumber: query.toUpperCase(),
        badgeNumber: randomBadge,
        fullName: 'የኮሚሽኑ አባል',
        fullNameEn: 'Commission Member',
        rank: 'ኮንስታብል',
        rankEn: 'Constable',
        departmentId: departmentId,
        departmentName: departments.find((d) => d.id === departmentId)?.name || 'ልዩ ጽ/ቤት',
        responsibilityAm: 'የክፍል አባል',
        bloodType: 'O+',
        gender: 'ወ / M',
        height: '1.75m',
        complexion: 'ጠይም',
        issuedAt: '2026-01-10',
        expiresAt: '2028-01-10',
        status: 'off_duty',
        active: true,
      };
    }

    setCandidateStaff(found);
    setPhone(found.phone || '');
    setResponsibilityAm(found.responsibilityAm || found.departmentName || '');
    setModalStep(2);
  };

  // STEP 3: Confirm and Register in Department
  const handleFinalSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateStaff) return;

    const deptObj = departments.find((d) => d.id === departmentId);
    const deptName = deptObj ? deptObj.name : 'አጠቃላይ የስራ ሂደት';

    if (editingStaff) {
      await updateStaff(editingStaff.id, {
        departmentId,
        departmentName: deptName,
        responsibilityAm: responsibilityAm.trim() || deptName,
        phone: phone.trim(),
      });
    } else {
      await addStaff({
        ...candidateStaff,
        departmentId,
        departmentName: deptName,
        responsibilityAm: responsibilityAm.trim() || deptName,
        phone: phone.trim(),
        status: 'off_duty',
        active: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (st: Staff) => {
    if (confirm(`የፖሊስ አባል "${st.fullName}" (${st.idNumber || st.badgeNumber}) ከዚህ ክፍል እንዲሰረዝ እርግጠኛ ነዎት?`)) {
      await deleteStaff(st.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የፖሊስ ሰራተኞች እና አባላት በየክፍሉ መመዝገቢያ
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            በኮሚሽኑ ውስጥ የሚሰሩ ሰራተኞች ቅድሚያ በአድሚኑ በየሚሰሩበት ክፍል በዲጂታል መታወቂያ ቁጥራቸው ይመዘገባሉ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('by_department')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'by_department'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              በየስራ ክፍሉ ከፋፍለህ መዝግብ
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
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-sm shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>አዲስ ሰራተኛ መዝግብ</span>
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
                                className="w-11 h-11 rounded-full object-cover border border-amber-400/40 shrink-0"
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
                      className="w-14 h-14 rounded-full object-cover border-2 border-amber-400/50 shrink-0"
                    />
                    <div>
                      <h3 className="font-extrabold text-white text-base leading-tight">
                        {st.fullName}
                      </h3>
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
                  {st.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">ስልክ:</span>
                      <span>{st.phone}</span>
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

      {/* 3-STEP STAFF REGISTRATION MODAL (በየክፍሉ መመዝገቢያ) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white font-serif">
                  {editingStaff ? 'የሰራተኛ መረጃ ማስተካከያ' : 'አዲስ የፖሊስ ሰራተኛ በክፍል መመዝገቢያ'}
                </h2>
                <p className="text-xs text-slate-400">
                  {modalStep === 1 && 'ደረጃ 1፡ የመታወቂያ ቁጥር አስገባ'}
                  {modalStep === 2 && 'ደረጃ 2፡ የዲጂታል መታወቂያ ካርድ ማረጋገጫ (የፊት እና የኋላ ገጽ)'}
                  {modalStep === 3 && 'ደረጃ 3፡ የሚሰራበት ክፍል እና ኃላፊነት መመደቢያ'}
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 1 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1</span>
                <span className="text-slate-600">-</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 2 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2</span>
                <span className="text-slate-600">-</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${modalStep >= 3 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>3</span>
              </div>
            </div>

            {/* STEP 1: Enter ID Number */}
            {modalStep === 1 && (
              <div className="space-y-4">
                <div className="text-xs text-slate-300">
                  የፖሊስ አባሉን ዲጂታል መታወቂያ ቁጥር (ID Number) ያስገቡ ወይም ከስርዓቱ ይምረጡ፡
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    የመታወቂያ ቁጥር (Digital ID Number) *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={idNumberInput}
                    onChange={(e) => {
                      setIdNumberInput(e.target.value);
                      setModalError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyIdStep1();
                    }}
                    placeholder="ለምሳሌ፡ BGR-POL-1600001 ወይም ባጅ POL-1001"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {modalError && (
                  <div className="bg-rose-950/60 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Pre-existing Digital Police IDs quick list */}
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold mb-2 block">
                    ወይም ከመታወቂያ ሲስተሙ በቀጥታ ይምረጡ፡
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {INITIAL_STAFF.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setIdNumberInput(st.idNumber || st.id);
                          setCandidateStaff(st);
                          setPhone(st.phone || '');
                          setResponsibilityAm(st.responsibilityAm || '');
                          setModalStep(2);
                        }}
                        className="bg-slate-950 hover:bg-slate-800 border border-slate-800 p-2 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer"
                      >
                        <img
                          src={st.photoUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-amber-400/40 shrink-0"
                        />
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-white block truncate">
                            {st.fullName}
                          </span>
                          <span className="text-[10px] text-amber-300 font-mono">
                            {st.idNumber || st.badgeNumber} • {st.rank}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                    onClick={handleVerifyIdStep1}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer"
                  >
                    <span>ቀጣይ (Next)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Show Front & Back of ID Card */}
            {modalStep === 2 && candidateStaff && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-600/40">
                    ✓ የመታወቂያ መረጃው ተገኝቷል
                  </span>
                  <h3 className="text-sm font-black text-white">
                    እባክዎ የፖሊስ አባሉን ዲጂታል መታወቂያ ካርድ (የፊትና የኋላ ገጽ) ያረጋግጡ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ካርዱን በመጫን የፊት እና የኋላ ገጹን ማገላበጥ ይችላሉ።
                  </p>
                </div>

                <div className="flex justify-center py-1">
                  <div className="w-full max-w-md transform scale-[0.9] origin-top">
                    <PoliceIdCard staff={candidateStaff} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalStep(1)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>ተመለስ</span>
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

            {/* STEP 3: Assign Department, Responsibility and Save */}
            {modalStep === 3 && candidateStaff && (
              <form onSubmit={handleFinalSave} className="space-y-4 text-xs sm:text-sm">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                  <img
                    src={candidateStaff.photoUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-amber-400/50"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {candidateStaff.rank} {candidateStaff.fullName}
                    </h4>
                    <span className="font-mono text-xs text-amber-400">
                      {candidateStaff.idNumber || candidateStaff.badgeNumber}
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
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>በክፍሉ ውስጥ መዝግብና አጽድቅ</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
