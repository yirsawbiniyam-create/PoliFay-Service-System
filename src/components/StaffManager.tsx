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
  BadgeAlert,
} from 'lucide-react';
import { Department, Staff } from '../types';
import { addStaff, updateStaff, deleteStaff } from '../services/dbService';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [rank, setRank] = useState('ኮንስታብል');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'special_office');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

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

  const filteredStaff = staffList.filter((s) => {
    if (selectedDept !== 'all' && s.departmentId !== selectedDept) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.badgeNumber.toLowerCase().includes(q) ||
        s.rank.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = (targetDeptId?: string) => {
    setEditingStaff(null);
    setFullName('');
    setBadgeNumber(`POL-${Math.floor(1000 + Math.random() * 9000)}`);
    setRank('ኮንስታብል');
    setDepartmentId(targetDeptId || (selectedDept !== 'all' ? selectedDept : departments[0]?.id || 'special_office'));
    setPhone('');
    setPhotoUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    setEditingStaff(st);
    setFullName(st.fullName);
    setBadgeNumber(st.badgeNumber);
    setRank(st.rank);
    setDepartmentId(st.departmentId);
    setPhone(st.phone || '');
    setPhotoUrl(st.photoUrl || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !badgeNumber.trim()) return;

    const deptObj = departments.find((d) => d.id === departmentId);
    const deptName = deptObj ? deptObj.name : 'አጠቃላይ የስራ ሂደት';

    if (editingStaff) {
      await updateStaff(editingStaff.id, {
        fullName: fullName.trim(),
        badgeNumber: badgeNumber.trim(),
        rank,
        departmentId,
        departmentName: deptName,
        phone: phone.trim(),
        photoUrl: photoUrl.trim() || undefined,
      });
    } else {
      await addStaff({
        fullName: fullName.trim(),
        badgeNumber: badgeNumber.trim(),
        rank,
        departmentId,
        departmentName: deptName,
        phone: phone.trim(),
        photoUrl: photoUrl.trim() || undefined,
        status: 'off_duty',
        active: true,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (st: Staff) => {
    if (confirm(`የፖሊስ አባል "${st.fullName}" (${st.badgeNumber}) እንዲሰረዝ እርግጠኛ ነዎት?`)) {
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
              የፖሊስ ሰራተኞች እና አባላት መዝገብ
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            በኮሚሽኑ ውስጥ የሚሰሩ ሰራተኞች ስም፣ የሚሰሩበት ክፍል እና የፖሊስ ዲጂታል መታወቂያ ባጅ ቁጥር
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setViewMode('by_department')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'by_department'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              በየስራ ክፍሉ ከፋፍለህ መዝግብ
            </button>
            <button
              onClick={() => setViewMode('all_grid')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
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
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg transition-transform active:scale-95 shrink-0"
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
            placeholder="በስም፣ በማዕረግ ወይም በባጅ ይፈልጉ..."
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
                  {/* Department Banner with direct register button */}
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
                      className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ በዚህ ክፍል ስር አባል መዝግብ</span>
                    </button>
                  </div>

                  {/* Members Roster in this Department */}
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
                                  <span className="font-mono text-amber-400 font-bold">{st.badgeNumber}</span>
                                </div>
                                <span className="text-[10px] text-emerald-400 font-medium block">
                                  ✓ የ{dept.code} ህጋዊ ሰራተኛ
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {onOpenCard && (
                                <button
                                  onClick={() => onOpenCard(st)}
                                  className="p-1 rounded bg-slate-900 text-amber-400 hover:bg-slate-800"
                                  title="ዲጂታል ካርድ"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(st)}
                                className="p-1 rounded bg-slate-900 text-slate-300 hover:bg-slate-800"
                                title="አስተካክል"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(st)}
                                className="p-1 rounded bg-slate-900 text-rose-400 hover:bg-rose-950"
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
                  <span className="text-slate-400">የፖሊስ ባጅ ቁጥር:</span>
                  <span className="font-mono font-bold text-amber-400">{st.badgeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">የስራ ክፍል:</span>
                  <span className="font-medium text-white truncate max-w-[170px] text-right">
                    {st.departmentName}
                  </span>
                </div>
                {st.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ስልክ:</span>
                    <span>{st.phone}</span>
                  </div>
                )}
                {st.lastCheckIn && (
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">የመጨረሻ መግቢያ:</span>
                    <span className="font-mono text-emerald-400">{st.lastCheckIn}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              {onOpenCard && (
                <button
                  onClick={() => onOpenCard(st)}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>ዲጂታል ካርድ አሳይ</span>
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleOpenEdit(st)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="አስተካክል"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(st)}
                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 transition-colors"
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

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingStaff ? 'የሰራተኛ መረጃ አስተካክል' : 'አዲስ የፖሊስ ሰራተኛ መዝግብ'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ሙሉ ስም *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ለምሳሌ፡ ኮማንደር ግርማይ አበራ"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    የፖሊስ ባጅ ቁጥር (Barcode ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="POL-1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    የፖሊስ ማዕረግ
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {POLICE_RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  የሚሰራበት የስራ ሂደት (ክፍል) *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ስልክ ቁጥር
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911223344"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    የፎቶ ማስፈንጠሪያ (Image URL)
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  መዝግብ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
