import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  Award,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { Department, Staff, VisitorRecord, FeedbackRecord, AttendanceRecord } from '../types';
import {
  addDepartment,
  updateDepartment,
  deleteDepartment,
  calculateDepartmentScores,
  addStaff,
} from '../services/dbService';

interface DepartmentManagerProps {
  departments: Department[];
  staffList: Staff[];
  visitors: VisitorRecord[];
  feedbacks: FeedbackRecord[];
  attendanceList: AttendanceRecord[];
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  staffList,
  visitors,
  feedbacks,
  attendanceList,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingStaffDept, setViewingStaffDept] = useState<Department | null>(null);

  // Quick staff add under department state
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffBadge, setNewStaffBadge] = useState('');
  const [newStaffRank, setNewStaffRank] = useState('ኮንስታብል');

  // Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const scores = calculateDepartmentScores(
    departments,
    visitors,
    feedbacks,
    staffList,
    attendanceList
  );

  const handleOpenAdd = () => {
    setEditingDept(null);
    setName('');
    setCode(`DEPT-${departments.length + 1}`);
    setRoomNumber(`ክፍል ${100 + departments.length + 1}`);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Department) => {
    setEditingDept(d);
    setName(d.name);
    setCode(d.code);
    setRoomNumber(d.roomNumber || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name: name.trim(),
        code: code.trim(),
        roomNumber: roomNumber.trim(),
      });
    } else {
      await addDepartment({
        name: name.trim(),
        code: code.trim(),
        roomNumber: roomNumber.trim(),
        active: true,
        order: departments.length + 1,
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (d: Department) => {
    if (confirm(`የስራ ሂደቱ "${d.name}" እንዲሰረዝ እርግጠኛ ነዎት?`)) {
      await deleteDepartment(d.id);
    }
  };

  const handleToggleActive = async (d: Department) => {
    await updateDepartment(d.id, { active: !d.active });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የኮሚሽኑ የስራ ክፍሎች እና አፈጻጸም (ከ 100%)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            የስራ ክፍሎች መረጃ፣ የተገልጋይ እርካታ እና የሰራተኞች ሰዓት አክባሪነት ደረጃ (አድሚኑ መጨመር/መቀነስ ይችላል)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>አዲስ የስራ ክፍል ጨምር</span>
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scores.map((item, idx) => {
          const dept = departments.find((d) => d.id === item.departmentId);
          if (!dept) return null;

          return (
            <div
              key={item.departmentId}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                dept.active ? 'border-slate-800 hover:border-amber-500/50' : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.rank || idx + 1}ኛ
                    </span>
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold">
                        {dept.code} {dept.roomNumber ? `• ${dept.roomNumber}` : ''}
                      </span>
                      <h3 className="font-extrabold text-white text-base leading-snug">
                        {dept.name}
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded font-bold shrink-0 ${
                      item.overallScore >= 90
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : item.overallScore >= 75
                        ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                    }`}
                  >
                    ደረጃ: {item.overallScore}%
                  </span>
                </div>

                {/* Score breakdown metrics */}
                <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 my-3">
                  {/* Visitor Satisfaction */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      የባለጉዳይ እርካታ ({item.visitorCount} ባለጉዳይ):
                    </span>
                    <span className="font-bold text-yellow-400 font-mono">
                      {item.satisfactionScore}% ({item.averageRating} ★)
                    </span>
                  </div>

                  {/* Staff Punctuality */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      የሰዓት አክባሪነት (2፡30 - 3፡00):
                    </span>
                    <span className="font-bold text-purple-400 font-mono">
                      {item.punctualityScore}%
                    </span>
                  </div>

                  {/* Staff on duty */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      ሰራተኞች (በአሁን ሰዓት):
                    </span>
                    <span className="font-bold text-blue-300">
                      {item.onDutyStaffCount} ስራ ላይ / {item.staffCount} አጠቃላይ
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-3">
                  <div
                    className={`h-full rounded-full ${
                      item.overallScore >= 90
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : item.overallScore >= 75
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${item.overallScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <button
                  onClick={() => {
                    setViewingStaffDept(dept);
                    setNewStaffBadge(`POL-${Math.floor(1000 + Math.random() * 9000)}`);
                    setNewStaffName('');
                    setNewStaffRank('ኮንስታብል');
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>የክፍሉ አባላት ({item.staffCount})</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(dept)}
                    className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${
                      dept.active
                        ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {dept.active ? 'ክፍት' : 'ተዘግቷል'}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="አስተካክል"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300"
                    title="ሰርዝ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingDept ? 'የስራ ክፍል አስተካክል' : 'አዲስ የስራ ክፍል ጨምር'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  የስራ ክፍሉ (ሂደቱ) ሙሉ ስም *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ለምሳሌ፡ የሰው ሀብት አስተዳደር ደጋፊ የስራ ሂደት"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    የክፍል ኮድ *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="HR-01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    የቢሮ / ክፍል ቁጥር
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="ክፍል 101"
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
                  አስቀምጥ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Staff Members Roster & Direct Registration Modal */}
      {viewingStaffDept && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  የስራ ክፍል አባላት መዝገብ
                </span>
                <h2 className="text-xl font-black text-white">
                  {viewingStaffDept.name} ({viewingStaffDept.code})
                </h2>
              </div>
              <button
                onClick={() => setViewingStaffDept(null)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold"
              >
                ዝጋ (Close)
              </button>
            </div>

            {/* List of officers in this department */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              <span className="text-xs font-bold text-slate-400 block mb-2">
                በዚህ ክፍል ስር የተመዘገቡ የፖሊስ አባላት ({staffList.filter((s) => s.departmentId === viewingStaffDept.id).length}):
              </span>

              {staffList.filter((s) => s.departmentId === viewingStaffDept.id).length === 0 ? (
                <div className="bg-slate-950 p-6 rounded-2xl text-center text-slate-500 text-xs">
                  በዚህ ክፍል ስር የተመዘገበ ሰራተኛ የለም። ከታች ባለው ቅጽ አዲስ አባል መመዝገብ ይችላሉ።
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {staffList
                    .filter((s) => s.departmentId === viewingStaffDept.id)
                    .map((st) => (
                      <div
                        key={st.id}
                        className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={
                              st.photoUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                            }
                            alt={st.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-white text-xs truncate">{st.fullName}</h4>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                              <span className="text-amber-300 font-semibold">{st.rank}</span>
                              <span>•</span>
                              <span className="font-mono text-amber-400 font-bold">{st.badgeNumber}</span>
                            </div>
                            <span className="text-[10px] text-emerald-400 block">✓ የተረጋገጠ አባል</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            st.status === 'on_duty'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st.status === 'on_duty' ? 'ስራ ላይ' : 'ያልገባ'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Quick Register into this department form */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                አዲስ የፖሊስ አባል በቀጥታ ወደዚህ ክፍል መዝግብ
              </span>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newStaffName.trim() || !newStaffBadge.trim()) return;

                  await addStaff({
                    fullName: newStaffName.trim(),
                    badgeNumber: newStaffBadge.trim(),
                    rank: newStaffRank,
                    departmentId: viewingStaffDept.id,
                    departmentName: viewingStaffDept.name,
                    status: 'off_duty',
                    active: true,
                  });

                  setNewStaffName('');
                  setNewStaffBadge(`POL-${Math.floor(1000 + Math.random() * 9000)}`);
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2"
              >
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="የሰራተኛው ሙሉ ስም..."
                  className="sm:col-span-2 bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                />

                <input
                  type="text"
                  required
                  value={newStaffBadge}
                  onChange={(e) => setNewStaffBadge(e.target.value)}
                  placeholder="ባጅ (POL-XXXX)"
                  className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-colors shrink-0"
                >
                  መዝግብ
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
