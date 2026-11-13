import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Star,
  Clock,
  Award,
  Users,
  UserPlus,
  Trophy,
  Search,
  GitCompare,
  CheckSquare,
  Square,
  LogIn,
  LogOut,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Department,
  Staff,
  VisitorRecord,
  FeedbackRecord,
  AttendanceRecord,
  StaffEvaluationSummary,
} from '../types';
import {
  addDepartment,
  updateDepartment,
  deleteDepartment,
  calculateDepartmentScores,
  calculateStaffEvaluations,
  addStaff,
} from '../services/dbService';

interface DepartmentManagerProps {
  departments: Department[];
  staffList: Staff[];
  visitors: VisitorRecord[];
  feedbacks: FeedbackRecord[];
  attendanceList: AttendanceRecord[];
}

type EvaluationViewMode = 'staff_overall' | 'staff_by_dept' | 'dept_ranking' | 'compare';

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  staffList,
  visitors,
  feedbacks,
  attendanceList,
}) => {
  const [viewMode, setViewMode] = useState<EvaluationViewMode>('staff_overall');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Comparison selections (IDs)
  const [selectedCompareStaffIds, setSelectedCompareStaffIds] = useState<string[]>([]);
  const [selectedCompareDeptIds, setSelectedCompareDeptIds] = useState<string[]>([]);

  // Department CRUD & Roster Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [viewingStaffDept, setViewingStaffDept] = useState<Department | null>(null);

  // Quick staff add under department state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffBadge, setNewStaffBadge] = useState('');
  const [newStaffRank, setNewStaffRank] = useState('ኮንስታብል');

  // Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Calculations
  const departmentScores = useMemo(
    () => calculateDepartmentScores(departments, visitors, feedbacks, staffList, attendanceList),
    [departments, visitors, feedbacks, staffList, attendanceList]
  );

  const staffEvaluations = useMemo(
    () => calculateStaffEvaluations(staffList, departments, attendanceList, feedbacks),
    [staffList, departments, attendanceList, feedbacks]
  );

  const filteredOverallStaff = useMemo(() => {
    return staffEvaluations.filter((ev) => {
      if (deptFilter !== 'all' && ev.departmentId !== deptFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          ev.staff.fullName.toLowerCase().includes(q) ||
          ev.staff.badgeNumber.toLowerCase().includes(q) ||
          ev.staff.rank.toLowerCase().includes(q) ||
          ev.departmentName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffEvaluations, deptFilter, searchQuery]);

  // Group staff evaluations by department (ordered by dept rank)
  const evaluationsByDepartment = useMemo(() => {
    const deptsToShow =
      deptFilter === 'all' ? departments : departments.filter((d) => d.id === deptFilter);

    return deptsToShow.map((dept) => {
      const deptScore = departmentScores.find((ds) => ds.departmentId === dept.id);
      const members = staffEvaluations
        .filter((ev) => ev.departmentId === dept.id)
        .sort((a, b) => a.deptRank - b.deptRank);
      return {
        dept,
        deptScore,
        members,
      };
    });
  }, [departments, departmentScores, staffEvaluations, deptFilter]);

  // Summary metrics
  const averageStaffScore = useMemo(() => {
    if (staffEvaluations.length === 0) return 0;
    const total = staffEvaluations.reduce((acc, ev) => acc + ev.overallScore, 0);
    return Math.round(total / staffEvaluations.length);
  }, [staffEvaluations]);

  const topOfficer = staffEvaluations[0] || null;
  const topDepartment = departmentScores[0] || null;

  // Effective comparison sets (defaults to Top 3 if admin hasn't checked manually)
  const effectiveCompareStaff = useMemo(() => {
    if (selectedCompareStaffIds.length > 0) {
      return staffEvaluations.filter((ev) => selectedCompareStaffIds.includes(ev.staff.id));
    }
    return staffEvaluations.slice(0, 3);
  }, [selectedCompareStaffIds, staffEvaluations]);

  const effectiveCompareDepts = useMemo(() => {
    if (selectedCompareDeptIds.length > 0) {
      return departmentScores.filter((d) => selectedCompareDeptIds.includes(d.departmentId));
    }
    return departmentScores.slice(0, 4);
  }, [selectedCompareDeptIds, departmentScores]);

  const toggleStaffCompare = (staffId: string) => {
    setSelectedCompareStaffIds((prev) => {
      if (prev.includes(staffId)) return prev.filter((id) => id !== staffId);
      if (prev.length >= 4) return [...prev.slice(1), staffId];
      return [...prev, staffId];
    });
  };

  const toggleDeptCompare = (deptId: string) => {
    setSelectedCompareDeptIds((prev) => {
      if (prev.includes(deptId)) return prev.filter((id) => id !== deptId);
      if (prev.length >= 4) return [...prev.slice(1), deptId];
      return [...prev, deptId];
    });
  };

  // Department Comparison BarChart Data
  const deptChartData = useMemo(() => {
    return departmentScores.map((d) => ({
      name:
        d.departmentName.length > 16
          ? `${d.departmentName.slice(0, 15)}…`
          : d.departmentName,
      fullName: d.departmentName,
      rank: d.rank,
      አጠቃላይ: d.overallScore,
      እርካታ: d.satisfactionScore,
      ሰዓት_አክባሪነት: d.punctualityScore,
    }));
  }, [departmentScores]);

  // Staff Comparison BarChart Data
  const staffCompareChartData = useMemo(() => {
    return effectiveCompareStaff.map((ev) => ({
      name:
        ev.staff.fullName.length > 14
          ? `${ev.staff.fullName.slice(0, 13)}…`
          : ev.staff.fullName,
      fullName: ev.staff.fullName,
      rank: ev.overallRank,
      መግቢያ: ev.checkInScore,
      መውጫ: ev.checkOutScore,
      አስተያየት: ev.feedbackScore,
      አጠቃላይ: ev.overallScore,
    }));
  }, [effectiveCompareStaff]);

  // Department Head-to-Head Comparison Chart Data
  const deptCompareChartData = useMemo(() => {
    return effectiveCompareDepts.map((d) => ({
      name:
        d.departmentName.length > 15
          ? `${d.departmentName.slice(0, 14)}…`
          : d.departmentName,
      fullName: d.departmentName,
      rank: d.rank,
      አጠቃላይ: d.overallScore,
      እርካታ: d.satisfactionScore,
      መግቢያ: d.checkInPunctualityScore ?? d.punctualityScore,
      መውጫ: d.checkOutPunctualityScore ?? d.punctualityScore,
    }));
  }, [effectiveCompareDepts]);

  // Handlers
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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30';
    if (rank === 2) return 'bg-slate-200 text-slate-950';
    if (rank === 3) return 'bg-amber-700 text-white';
    return 'bg-slate-800 text-slate-300';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-gradient-to-r from-emerald-500 to-teal-400';
    if (score >= 70) return 'bg-gradient-to-r from-amber-500 to-yellow-400';
    return 'bg-rose-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የሰራተኞች እና የስራ ክፍሎች ምዘና እና ደረጃ (ከ 100%)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            በተገልጋይ አስተያየት (45%)፣ በመግቢያ ሰዓት (30%) እና በመውጫ ሰዓት (25%) መሰረት ከ 1ኛ ደረጃ ጀምሮ የተሰላ ንጽጽር
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedCompareStaffIds.length > 0 && (
            <button
              onClick={() => setViewMode('compare')}
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <GitCompare className="w-4 h-4" />
              <span>የተመረጡትን ({selectedCompareStaffIds.length}) አወዳድር</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>አዲስ የስራ ክፍል ጨምር</span>
          </button>
        </div>
      </div>

      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ጠቅላላ የተመዘኑ ሰራተኞች</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {staffEvaluations.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            በ{departments.length} የስራ ክፍሎች ውስጥ
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>አማካይ የሰራተኞች ውጤት</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black font-mono tabular-nums ${getScoreColor(averageStaffScore)}`}>
            {averageStaffScore}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ከ 100% አማካይ የአፈጻጸም ነጥብ
          </p>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span>የኮሚሽኑ 1ኛ ደረጃ ሰራተኛ</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-black text-white truncate">
            {topOfficer ? topOfficer.staff.fullName : '—'}
          </div>
          <p className="text-xs text-amber-400 font-mono tabular-nums font-bold mt-1">
            {topOfficer ? `${topOfficer.overallScore}% • ${topOfficer.departmentName}` : 'መረጃ የለም'}
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span>1ኛ ደረጃ የወጣ የስራ ክፍል</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-black text-white truncate">
            {topDepartment ? topDepartment.departmentName : '—'}
          </div>
          <p className="text-xs text-emerald-400 font-mono tabular-nums font-bold mt-1">
            {topDepartment ? `${topDepartment.overallScore}% • ${topDepartment.averageRating} ★` : 'መረጃ የለም'}
          </p>
        </div>
      </div>

      {/* View Mode Navigation Tabs & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewMode('staff_overall')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'staff_overall'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>የሁሉም ሰራተኞች ደረጃ (1ኛ..N)</span>
          </button>

          <button
            onClick={() => setViewMode('staff_by_dept')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'staff_by_dept'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>በየክፍሉ የሰራተኞች ደረጃ</span>
          </button>

          <button
            onClick={() => setViewMode('dept_ranking')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'dept_ranking'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ክፍል ከክፍል ደረጃ (100%)</span>
          </button>

          <button
            onClick={() => setViewMode('compare')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              viewMode === 'compare'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>ማወዳደሪያ (Compare)</span>
          </button>
        </div>

        {(viewMode === 'staff_overall' || viewMode === 'staff_by_dept') && (
          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'staff_overall' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ሰራተኛ ወይም ባጅ ፈልግ..."
                  className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-56"
                />
              </div>
            )}

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">ሁሉም የስራ ክፍሎች ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: OVERALL COMMISSION-WIDE STAFF RANKING (1ኛ..N ከ 100%) */}
      {viewMode === 'staff_overall' && (
        <div className="space-y-6">
          {/* Top 3 Commission-Wide Spotlight */}
          {staffEvaluations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staffEvaluations.slice(0, 3).map((ev) => (
                <div
                  key={ev.staff.id}
                  className={`bg-slate-900 rounded-2xl p-5 border ${
                    ev.overallRank === 1
                      ? 'border-amber-400/60 shadow-lg shadow-amber-500/10'
                      : ev.overallRank === 2
                      ? 'border-slate-400/50'
                      : 'border-amber-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm font-mono tabular-nums shrink-0 ${getRankStyle(
                          ev.overallRank
                        )}`}
                      >
                        {ev.overallRank}ኛ
                      </span>
                      <img
                        src={
                          ev.staff.photoUrl ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                        }
                        alt={ev.staff.fullName}
                        className="w-11 h-11 rounded-full object-cover border border-amber-400/60 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="font-black text-white text-sm truncate">
                          {ev.staff.fullName}
                        </h3>
                        <p className="text-[11px] text-amber-300 truncate">
                          {ev.staff.rank} • {ev.staff.badgeNumber}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-lg font-black font-mono tabular-nums shrink-0 ${getScoreColor(
                        ev.overallScore
                      )}`}
                    >
                      {ev.overallScore}%
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mb-3">
                    {ev.departmentName} (በክፍሉ {ev.deptRank}ኛ)
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 rounded-xl p-2.5 border border-slate-800 text-center text-[11px]">
                    <div>
                      <span className="text-slate-400 block">መግቢያ</span>
                      <span className="font-bold text-emerald-400 font-mono tabular-nums">
                        {ev.checkInScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">መውጫ</span>
                      <span className="font-bold text-cyan-400 font-mono tabular-nums">
                        {ev.checkOutScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">አስተያየት</span>
                      <span className="font-bold text-amber-400 font-mono tabular-nums">
                        {ev.feedbackScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Commission-Wide Ranking Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white">
                  አጠቃላይ የኮሚሽኑ ሰራተኞች ደረጃ ሰንጠረዥ (ከ 100%)
                </h2>
                <p className="text-xs text-slate-400">
                  ሁሉም ሰራተኞች ከ1ኛ ደረጃ ጀምሮ ተሰልፈዋል — ለማወዳደር እስከ 4 ሰራተኞችን ይምረጡ
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                ውጤት: {filteredOverallStaff.length} ሰራተኞች
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 font-bold">አጠቃላይ ደረጃ</th>
                    <th className="py-3 px-4 font-bold">የፖሊስ አባል</th>
                    <th className="py-3 px-4 font-bold">የስራ ክፍል / በክፍሉ ደረጃ</th>
                    <th className="py-3 px-4 font-bold text-center">መግቢያ (30%)</th>
                    <th className="py-3 px-4 font-bold text-center">መውጫ (25%)</th>
                    <th className="py-3 px-4 font-bold text-center">አስተያየት (45%)</th>
                    <th className="py-3 px-4 font-bold">አጠቃላይ ውጤት (ከ100%)</th>
                    <th className="py-3 px-4 font-bold text-center">አወዳድር</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {filteredOverallStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        የተገኘ ሰራተኛ የለም።
                      </td>
                    </tr>
                  ) : (
                    filteredOverallStaff.map((ev) => {
                      const isChecked = selectedCompareStaffIds.includes(ev.staff.id);
                      return (
                        <tr
                          key={ev.staff.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isChecked ? 'bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs font-mono tabular-nums ${getRankStyle(
                                ev.overallRank
                              )}`}
                            >
                              {ev.overallRank}ኛ
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  ev.staff.photoUrl ||
                                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={ev.staff.fullName}
                                className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white">{ev.staff.fullName}</div>
                                <div className="text-[11px] text-slate-400">
                                  {ev.staff.rank} •{' '}
                                  <span className="font-mono text-amber-400">
                                    {ev.staff.badgeNumber}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-200 max-w-[200px] truncate">
                              {ev.departmentName}
                            </div>
                            <div className="text-[11px] text-amber-400 font-bold font-mono tabular-nums">
                              በክፍሉ ውስጥ፡ {ev.deptRank}ኛ ደረጃ
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono tabular-nums">
                            <div className="font-bold text-emerald-400">{ev.checkInScore}%</div>
                            <div className="text-[10px] text-slate-400">
                              {ev.hasAttendanceData
                                ? `${ev.onTimeCheckInCount}/${ev.attendanceCount} በሰዓቱ`
                                : 'መነሻ ነጥብ'}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono tabular-nums">
                            <div className="font-bold text-cyan-400">{ev.checkOutScore}%</div>
                            <div className="text-[10px] text-slate-400">
                              {ev.completedCheckOutCount > 0
                                ? `${ev.onTimeCheckOutCount}/${ev.completedCheckOutCount} በሰዓቱ`
                                : ev.hasAttendanceData
                                ? 'በስራ ላይ'
                                : 'መነሻ ነጥብ'}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center font-mono tabular-nums">
                            <div className="font-bold text-amber-400">{ev.feedbackScore}%</div>
                            <div className="text-[10px] text-slate-400">
                              {ev.averageRating} ★ ({ev.deptFeedbackCount} አስተያየት)
                            </div>
                          </td>

                          <td className="py-3 px-4 min-w-[170px]">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span
                                className={`text-sm font-black font-mono tabular-nums ${getScoreColor(
                                  ev.overallScore
                                )}`}
                              >
                                {ev.overallScore}%
                              </span>
                              <span className="text-[10px] text-slate-300 font-semibold">
                                {ev.gradeLabel}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full rounded-full ${getBarColor(ev.overallScore)}`}
                                style={{ width: `${ev.overallScore}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => toggleStaffCompare(ev.staff.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-3.5 h-3.5" />
                              ) : (
                                <Square className="w-3.5 h-3.5" />
                              )}
                              <span>{isChecked ? 'ተመርጧል' : 'ምረጥ'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: WITHIN-DEPARTMENT STAFF RANKING (በየክፍሉ የሰራተኞች ደረጃ) */}
      {viewMode === 'staff_by_dept' && (
        <div className="space-y-5">
          {evaluationsByDepartment.map(({ dept, deptScore, members }) => (
            <div
              key={dept.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Department Banner */}
              <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono tabular-nums shrink-0 ${getRankStyle(
                      deptScore?.rank || 99
                    )}`}
                  >
                    {deptScore?.rank || '—'}ኛ
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ኮድ: {dept.code} {dept.roomNumber ? `• ${dept.roomNumber}` : ''} • የክፍሉ አጠቃላይ ውጤት:{' '}
                      <span className="text-amber-400 font-bold font-mono tabular-nums">
                        {deptScore?.overallScore ?? 0}%
                      </span>{' '}
                      ({members.length} ሰራተኞች)
                    </p>
                  </div>
                </div>

                {members[0] && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-slate-300">የክፍሉ 1ኛ፡</span>
                    <span className="font-bold text-amber-300">{members[0].staff.fullName}</span>
                    <span className="font-mono tabular-nums font-black text-emerald-400">
                      ({members[0].overallScore}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Ranked Members Inside Department */}
              {members.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  በዚህ ክፍል ውስጥ የተመዘገበ ሰራተኛ የለም።
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/40 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                        <th className="py-2.5 px-4 font-bold">በክፍሉ ደረጃ</th>
                        <th className="py-2.5 px-4 font-bold">የፖሊስ አባል</th>
                        <th className="py-2.5 px-4 font-bold text-center">መግቢያ (30%)</th>
                        <th className="py-2.5 px-4 font-bold text-center">መውጫ (25%)</th>
                        <th className="py-2.5 px-4 font-bold text-center">አስተያየት (45%)</th>
                        <th className="py-2.5 px-4 font-bold">ውጤት (ከ100%)</th>
                        <th className="py-2.5 px-4 font-bold text-center">ከኮሚሽኑ ደረጃ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {members.map((ev) => (
                        <tr key={ev.staff.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs font-mono tabular-nums ${getRankStyle(
                                ev.deptRank
                              )}`}
                            >
                              {ev.deptRank}ኛ
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={
                                  ev.staff.photoUrl ||
                                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                                }
                                alt={ev.staff.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-white">{ev.staff.fullName}</div>
                                <div className="text-[11px] text-slate-400">
                                  {ev.staff.rank} • {ev.staff.badgeNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-emerald-400">
                            {ev.checkInScore}%
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-cyan-400">
                            {ev.checkOutScore}%
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums font-bold text-amber-400">
                            {ev.feedbackScore}%
                          </td>
                          <td className="py-3 px-4 min-w-[160px]">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span
                                className={`font-black font-mono tabular-nums ${getScoreColor(
                                  ev.overallScore
                                )}`}
                              >
                                {ev.overallScore}%
                              </span>
                              <span className="text-[10px] text-slate-400">{ev.gradeLabel}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getBarColor(ev.overallScore)}`}
                                style={{ width: `${ev.overallScore}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-300 font-bold">
                            ከሁሉም {ev.overallRank}ኛ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: DEPARTMENT-TO-DEPARTMENT COMPARISON & CRUD (ክፍል ከክፍል ደረጃ) */}
      {viewMode === 'dept_ranking' && (
        <div className="space-y-6">
          {/* Department Comparison BarChart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base sm:text-lg font-black text-white">
                    ክፍል ከክፍል የአፈጻጸም ንጽጽር (ከ 100%)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  የባለጉዳይ እርካታ፣ የሰራተኞች መግቢያ/መውጫ ሰዓት አክባሪነት እና አጠቃላይ ውጤት ንጽጽር
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 10, right: 16, left: -12, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="አጠቃላይ" name="አጠቃላይ ውጤት (%)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="እርካታ" name="የባለጉዳይ እርካታ (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar
                    dataKey="ሰዓት_አክባሪነት"
                    name="ሰዓት አክባሪነት (%)"
                    fill="#38bdf8"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departmentScores.map((item, idx) => {
              const dept = departments.find((d) => d.id === item.departmentId);
              if (!dept) return null;
              const topDeptMember = staffEvaluations.find(
                (ev) => ev.departmentId === dept.id && ev.deptRank === 1
              );

              return (
                <div
                  key={item.departmentId}
                  className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                    dept.active
                      ? 'border-slate-800 hover:border-amber-500/50'
                      : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono tabular-nums shrink-0 ${getRankStyle(
                            item.rank || idx + 1
                          )}`}
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
                        className={`text-xs px-2.5 py-1 rounded-lg font-black font-mono tabular-nums shrink-0 ${
                          item.overallScore >= 85
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                            : item.overallScore >= 70
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                        }`}
                      >
                        {item.overallScore}%
                      </span>
                    </div>

                    <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 my-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          የባለጉዳይ እርካታ ({item.feedbackCount || 0} አስተያየት):
                        </span>
                        <span className="font-bold text-yellow-400 font-mono tabular-nums">
                          {item.satisfactionScore}% ({item.averageRating} ★)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                          የመግቢያ ሰዓት አክባሪነት:
                        </span>
                        <span className="font-bold text-emerald-400 font-mono tabular-nums">
                          {item.checkInPunctualityScore ?? item.punctualityScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <LogOut className="w-3.5 h-3.5 text-cyan-400" />
                          የመውጫ ሰዓት አክባሪነት:
                        </span>
                        <span className="font-bold text-cyan-400 font-mono tabular-nums">
                          {item.checkOutPunctualityScore ?? item.punctualityScore}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          ሰራተኞች (ስራ ላይ):
                        </span>
                        <span className="font-bold text-blue-300 font-mono tabular-nums">
                          {item.onDutyStaffCount} / {item.staffCount}
                        </span>
                      </div>

                      {topDeptMember && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            የክፍሉ 1ኛ ሰራተኛ:
                          </span>
                          <span className="font-bold text-amber-300 truncate max-w-[150px]">
                            {topDeptMember.staff.fullName} ({topDeptMember.overallScore}%)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-3">
                      <div
                        className={`h-full rounded-full ${getBarColor(item.overallScore)}`}
                        style={{ width: `${item.overallScore}%` }}
                      />
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
                      className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>የክፍሉ አባላት ({item.staffCount})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(dept)}
                        className={`text-[11px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                          dept.active
                            ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {dept.active ? 'ክፍት' : 'ተዘግቷል'}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        title="አስተካክል"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 cursor-pointer"
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
        </div>
      )}

      {/* VIEW 4: INTERACTIVE HEAD-TO-HEAD COMPARISON (ማወዳደሪያ) */}
      {viewMode === 'compare' && (
        <div className="space-y-6">
          {/* 1. STAFF HEAD-TO-HEAD COMPARISON */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-emerald-400" />
                  <span>ሰራተኞችን ጎን ለጎን ማወዳደሪያ (ከ 100%)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  እስከ 4 የሚደርሱ ሰራተኞችን በመምረጥ በመግቢያ፣ በመውጫ እና በባለጉዳይ አስተያየት ያወዳድሩ
                </p>
              </div>
              {selectedCompareStaffIds.length > 0 && (
                <button
                  onClick={() => setSelectedCompareStaffIds([])}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer self-start sm:self-auto"
                >
                  ምርጫውን አጽዳ (ከፍተኛ 3 አሳይ)
                </button>
              )}
            </div>

            {/* Quick Staff Selector Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {staffEvaluations.map((ev) => {
                const active = effectiveCompareStaff.some((s) => s.staff.id === ev.staff.id);
                return (
                  <button
                    key={ev.staff.id}
                    onClick={() => toggleStaffCompare(ev.staff.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {ev.overallRank}ኛ. {ev.staff.fullName} ({ev.overallScore}%)
                  </button>
                );
              })}
            </div>

            {/* Staff Comparison Chart */}
            {staffCompareChartData.length > 0 && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={staffCompareChartData}
                    margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="አጠቃላይ" name="አጠቃላይ (100%)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="መግቢያ" name="መግቢያ ሰዓት (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="መውጫ" name="መውጫ ሰዓት (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="አስተያየት" name="የባለጉዳይ አስተያየት (%)" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Side-by-side Staff Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {effectiveCompareStaff.map((ev: StaffEvaluationSummary) => (
                <div
                  key={ev.staff.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-xs font-mono tabular-nums ${getRankStyle(
                        ev.overallRank
                      )}`}
                    >
                      አጠቃላይ {ev.overallRank}ኛ
                    </span>
                    <span className="text-xs text-amber-400 font-mono tabular-nums font-bold">
                      በክፍሉ {ev.deptRank}ኛ
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        ev.staff.photoUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={ev.staff.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-amber-400/50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">{ev.staff.fullName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{ev.departmentName}</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800 font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">መግቢያ ሰዓት (30%):</span>
                      <span className="text-emerald-400 font-bold">{ev.checkInScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">መውጫ ሰዓት (25%):</span>
                      <span className="text-cyan-400 font-bold">{ev.checkOutScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">አስተያየት (45%):</span>
                      <span className="text-purple-400 font-bold">{ev.feedbackScore}%</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                      <span className="text-white font-bold font-sans">አጠቃላይ:</span>
                      <span className={`font-black ${getScoreColor(ev.overallScore)}`}>
                        {ev.overallScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. DEPARTMENT HEAD-TO-HEAD COMPARISON */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>የስራ ክፍሎችን ጎን ለጎን ማወዳደሪያ (ክፍል ከክፍል)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                እስከ 4 የሚደርሱ የስራ ክፍሎችን በመምረጥ ውጤታቸውን ከ 100% ያወዳድሩ
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
              {departmentScores.map((ds) => {
                const active = effectiveCompareDepts.some((d) => d.departmentId === ds.departmentId);
                return (
                  <button
                    key={ds.departmentId}
                    onClick={() => toggleDeptCompare(ds.departmentId)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {ds.rank}ኛ. {ds.departmentName} ({ds.overallScore}%)
                  </button>
                );
              })}
            </div>

            {deptCompareChartData.length > 0 && (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={deptCompareChartData}
                    margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="አጠቃላይ" name="አጠቃላይ ውጤት (%)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="እርካታ" name="የባለጉዳይ እርካታ (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="መግቢያ" name="መግቢያ ሰዓት (%)" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="መውጫ" name="መውጫ ሰዓት (%)" fill="#a855f7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
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
                  የስራ ክፍል አባላት መዝገብ እና ደረጃ
                </span>
                <h2 className="text-xl font-black text-white">
                  {viewingStaffDept.name} ({viewingStaffDept.code})
                </h2>
              </div>
              <button
                onClick={() => setViewingStaffDept(null)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl font-bold cursor-pointer"
              >
                ዝጋ (Close)
              </button>
            </div>

            {/* List of officers in this department */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              <span className="text-xs font-bold text-slate-400 block mb-2">
                በዚህ ክፍል ስር የተመዘገቡ የፖሊስ አባላት (
                {staffList.filter((s) => s.departmentId === viewingStaffDept.id).length}):
              </span>

              {staffList.filter((s) => s.departmentId === viewingStaffDept.id).length === 0 ? (
                <div className="bg-slate-950 p-6 rounded-2xl text-center text-slate-500 text-xs">
                  በዚህ ክፍል ስር የተመዘገበ ሰራተኛ የለም። ከታች ባለው ቅጽ አዲስ አባል መመዝገብ ይችላሉ።
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {staffList
                    .filter((s) => s.departmentId === viewingStaffDept.id)
                    .map((st) => {
                      const stEval = staffEvaluations.find((e) => e.staff.id === st.id);
                      return (
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
                                <span className="font-mono text-amber-400 font-bold">
                                  {st.badgeNumber}
                                </span>
                              </div>
                              {stEval && (
                                <span className="text-[10px] text-emerald-400 font-mono tabular-nums block">
                                  በክፍሉ {stEval.deptRank}ኛ • ውጤት: {stEval.overallScore}%
                                </span>
                              )}
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
                      );
                    })}
                </div>
              )}
            </div>

            {/* Quick Register into this department form */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
              <span className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
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
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
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
