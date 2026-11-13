import React, { useState, useEffect, useCallback } from 'react';
import {
  Printer,
  Smartphone,
  ExternalLink,
  Check,
  Eye,
  Info,
  Maximize2,
  Minimize2,
  Columns2,
  Shield,
  Users,
} from 'lucide-react';
import { Department, CommissionSettings } from '../types';

interface WallPostersPrintCenterProps {
  departments: Department[];
  settings: CommissionSettings;
  onOpenMobilePortal?: (portal: 'staff' | 'visitor', deptId: string) => void;
}

export const WallPostersPrintCenter: React.FC<WallPostersPrintCenterProps> = ({
  departments,
  settings,
  onOpenMobilePortal,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [posterType, setPosterType] = useState<'side_by_side' | 'both' | 'staff' | 'visitor'>('side_by_side');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [fullscreenDept, setFullscreenDept] = useState<Department | null>(null);

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : '';

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const enterQrFullscreen = useCallback((dept: Department) => {
    setFullscreenDept(dept);
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fallback: fixed full-viewport overlay still works inside restricted iframes
      });
    }
  }, []);

  const exitQrFullscreen = useCallback(() => {
    setFullscreenDept(null);
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenDept(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreenDept(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredDepts = selectedDeptId === 'all'
    ? departments
    : departments.filter((d) => d.id === selectedDeptId);

  const activeTargetDept =
    selectedDeptId !== 'all'
      ? departments.find((d) => d.id === selectedDeptId) || departments[0]
      : departments.find((d) => d.active) || departments[0];

  const mottoRaw = (settings.motto || 'በሰብዓዊነት ማገልገል በጀግንነት መጠበቅ').replace(/[«»"]/g, '').trim();
  const hasSplitMotto =
    mottoRaw.includes('በሰብዓዊነት ማገልገል') && mottoRaw.includes('በጀግንነት መጠበቅ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* FULLSCREEN QR-ONLY DISPLAY OVERLAY */}
      {fullscreenDept && (() => {
        const fsStaffUrl = `${baseUrl}?portal=staff&dept=${fullscreenDept.id}`;
        const fsVisitorUrl = `${baseUrl}?portal=visitor&dept=${fullscreenDept.id}`;
        const fsStaffQr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(fsStaffUrl)}`;
        const fsVisitorQr = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(fsVisitorUrl)}`;

        return (
          <div className="fixed inset-0 z-[120] bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none print:hidden">
            {/* Subtle Ambient Radial Glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_50%,rgba(245,158,11,0.12),transparent_42%),radial-gradient(circle_at_78%_50%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.08),transparent_36%)]" />

            {/* Top Ethiopian Tricolor Accent Hairline */}
            <div className="relative z-10 h-1.5 w-full flex shrink-0">
              <div className="h-full w-1/3 bg-emerald-500" />
              <div className="h-full w-1/3 bg-amber-400" />
              <div className="h-full w-1/3 bg-rose-600" />
            </div>

            {/* Discreet Exit Fullscreen Button (reveals brightly on hover) */}
            <button
              onClick={exitQrFullscreen}
              title="ከሙሉ ስክሪን ውጣ (Esc)"
              className="fixed top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-bold opacity-35 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Minimize2 className="w-4 h-4 text-amber-400" />
              <span className="whitespace-nowrap">ከሙሉ ስክሪን ውጣ (Esc)</span>
            </button>

            {/* Main Side-by-Side QR Stage: Left Staff QR | Center Logo + Motto | Right Visitor QR */}
            <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-11 items-center gap-6 px-6 sm:px-10 lg:px-16 py-6">
              {/* LEFT: LARGE STAFF QR CODE */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 text-amber-400 font-black text-lg sm:text-xl lg:text-2xl font-serif tracking-wide">
                    <Shield className="w-6 h-6 text-amber-400 shrink-0" />
                    <span>የሰራተኞች መግቢያና መውጫ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                    {fullscreenDept.name}
                    {fullscreenDept.roomNumber ? ` • ${fullscreenDept.roomNumber}` : ''}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border-4 border-amber-400 shadow-[0_0_55px_rgba(245,158,11,0.22)]">
                  <img
                    src={fsStaffQr}
                    alt="የሰራተኞች መግቢያና መውጫ QR ኮድ"
                    className="w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-[360px] xl:h-[360px] object-contain"
                  />
                </div>

                <p className="mt-4 text-xs sm:text-sm font-bold text-amber-300/90 tracking-wide">
                  በስልክዎ ካሜራ ስካን ያድርጉ
                </p>
              </div>

              {/* CENTER: POLICE COMMISSION LOGO + VIBRANT MOTTO DIVIDER */}
              <div className="md:col-span-3 flex flex-col items-center justify-center text-center px-2">
                {/* Top Vertical Luminous Divider Line */}
                <div className="hidden md:block w-px h-14 lg:h-20 bg-gradient-to-b from-transparent via-amber-400/70 to-amber-300 mb-5" />

                {/* Glowing Commission Logo */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-500/25 via-amber-400/30 to-rose-500/25 blur-xl" />
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full p-1.5 bg-gradient-to-b from-amber-300 via-amber-500 to-emerald-500 shadow-2xl">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center p-2.5">
                      <img
                        src={settings.logoUrl}
                        alt="የፖሊስ ኮሚሽን ሎጎ"
                        className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(251,191,36,0.35)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Styled Motto directly below Logo */}
                <div className="space-y-1.5">
                  {hasSplitMotto ? (
                    <>
                      <p className="text-xl sm:text-2xl lg:text-[26px] font-black font-serif leading-snug bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(245,158,11,0.35)]">
                        በሰብዓዊነት ማገልገል
                      </p>
                      <p className="text-xl sm:text-2xl lg:text-[26px] font-black font-serif leading-snug bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]">
                        በጀግንነት መጠበቅ
                      </p>
                    </>
                  ) : (
                    <p className="text-xl sm:text-2xl lg:text-[26px] font-black font-serif leading-snug bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent">
                      {mottoRaw}
                    </p>
                  )}

                  {/* Subtle Ethiopian Flag Accent Bar under Motto */}
                  <div className="pt-2 flex items-center justify-center">
                    <div className="h-1 w-32 rounded-full overflow-hidden flex shadow-md">
                      <div className="w-1/3 h-full bg-emerald-500" />
                      <div className="w-1/3 h-full bg-amber-400" />
                      <div className="w-1/3 h-full bg-rose-500" />
                    </div>
                  </div>
                </div>

                {/* Bottom Vertical Luminous Divider Line */}
                <div className="hidden md:block w-px h-14 lg:h-20 bg-gradient-to-t from-transparent via-emerald-400/70 to-emerald-300 mt-5" />
              </div>

              {/* RIGHT: LARGE VISITOR QR CODE */}
              <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 text-emerald-400 font-black text-lg sm:text-xl lg:text-2xl font-serif tracking-wide">
                    <Users className="w-6 h-6 text-emerald-400 shrink-0" />
                    <span>የባለጉዳዮች መስተንግዶና አስተያየት</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
                    {fullscreenDept.name}
                    {fullscreenDept.roomNumber ? ` • ${fullscreenDept.roomNumber}` : ''}
                  </p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-3xl border-4 border-emerald-400 shadow-[0_0_55px_rgba(16,185,129,0.22)]">
                  <img
                    src={fsVisitorQr}
                    alt="የባለጉዳዮች መስተንግዶና አስተያየት QR ኮድ"
                    className="w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-[360px] xl:h-[360px] object-contain"
                  />
                </div>

                <p className="mt-4 text-xs sm:text-sm font-bold text-emerald-300/90 tracking-wide">
                  በስልክዎ ካሜራ ስካን ያድርጉ
                </p>
              </div>
            </div>

            {/* Bottom Ethiopian Tricolor Accent Hairline */}
            <div className="relative z-10 h-1.5 w-full flex shrink-0">
              <div className="h-full w-1/3 bg-emerald-500" />
              <div className="h-full w-1/3 bg-amber-400" />
              <div className="h-full w-1/3 bg-rose-600" />
            </div>
          </div>
        );
      })()}

      {/* Non-printable Control Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              የኪው አር ኮድ ስክሪን እና የግድግዳ ፖስተሮች (Wall QR Posters)
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            የሰራተኛውንና የባለጉዳዩን ኪው አር ኮድ ጎን ለጎን በአንድ ስክሪን ወይም በሙሉ ስክሪን (QR ብቻ) ማሳየት እንዲሁም ለግድግዳ ፖስተር ማተም ይችላሉ።
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTargetDept && (
            <button
              onClick={() => enterQrFullscreen(activeTargetDept)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-sm shadow-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Maximize2 className="w-4 h-4" />
              <span>ሙሉ ስክሪን (QR ብቻ)</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm shadow-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>ፖስተሮችን ፕሪንት አድርግ (A4)</span>
          </button>
        </div>
      </div>

      {/* Control filters - Non-printable */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs sm:text-sm">
        <div>
          <label className="block text-slate-300 font-bold mb-1">
            የስራ ክፍል ይምረጡ፡
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">ሁሉም የስራ ክፍሎች ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.roomNumber ? `(${d.roomNumber})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1">
            የአቀማመጥ እና የፖስተር ዓይነት፡
          </label>
          <select
            value={posterType}
            onChange={(e) => setPosterType(e.target.value as 'side_by_side' | 'both' | 'staff' | 'visitor')}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
          >
            <option value="side_by_side">ጎን ለጎን በአንድ ስክሪን (የሰራተኛ + ሎጎ + የባለጉዳይ)</option>
            <option value="both">ሁለቱንም ፖስተሮች በተናጠል (Print A4)</option>
            <option value="staff">የሰራተኞች መግቢያ እና መውጫ ብቻ</option>
            <option value="visitor">የባለጉዳዮች መስተንግዶ እና አስተያየት ብቻ</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>በአንድ ስክሪን ጎን ለጎን ወይም «ሙሉ ስክሪን» ሲደረግ ሁለቱ ኪው አር ኮዶችና ሎጎው ብቻ በትልቁ ይታያሉ!</span>
          </div>
        </div>
      </div>

      {/* Posters / Side-by-Side Display Canvas */}
      <div className="space-y-10">
        {filteredDepts.map((dept) => {
          const staffPortalUrl = `${baseUrl}?portal=staff&dept=${dept.id}`;
          const visitorPortalUrl = `${baseUrl}?portal=visitor&dept=${dept.id}`;

          const staffQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&margin=12&data=${encodeURIComponent(staffPortalUrl)}`;
          const visitorQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&margin=12&data=${encodeURIComponent(visitorPortalUrl)}`;

          return (
            <div key={dept.id} className="space-y-8">
              {/* MODE A: SIDE-BY-SIDE ON ONE SCREEN (Staff QR | Police Logo + Motto | Visitor QR) */}
              {posterType === 'side_by_side' && (
                <div className="bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl break-after-page print:bg-white print:text-slate-950 print:border-2 print:border-slate-900 print:shadow-none">
                  {/* Top Ethiopian Tricolor Accent */}
                  <div className="h-2 w-full flex">
                    <div className="h-full w-1/3 bg-emerald-600" />
                    <div className="h-full w-1/3 bg-yellow-400" />
                    <div className="h-full w-1/3 bg-rose-600" />
                  </div>

                  {/* Card Top Department Bar + Quick Fullscreen Trigger */}
                  <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-slate-100 print:border-slate-300">
                    <div className="flex items-center gap-3">
                      <Columns2 className="w-5 h-5 text-amber-400 shrink-0 print:text-slate-800" />
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-white font-serif print:text-slate-950">
                          {dept.name}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono print:text-slate-600">
                          {settings.commissionName} • ኮድ: {dept.code}
                          {dept.roomNumber ? ` • ${dept.roomNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => enterQrFullscreen(dept)}
                      className="print:hidden flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>ይህን ክፍል በሙሉ ስክሪን ክፈት (QR ብቻ)</span>
                    </button>
                  </div>

                  {/* 3-Column Side-by-Side QR Stage */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-11 items-center gap-6">
                    {/* LEFT: STAFF QR CODE */}
                    <div className="lg:col-span-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 flex flex-col items-center text-center print:bg-slate-50 print:border-slate-300">
                      <div className="flex items-center gap-2 text-amber-400 font-black text-base sm:text-lg font-serif mb-1 print:text-slate-900">
                        <Shield className="w-5 h-5 shrink-0" />
                        <span>የሰራተኞች መግቢያና መውጫ</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 print:text-slate-600">
                        STAFF ATTENDANCE PORTAL QR
                      </p>

                      <div className="bg-white p-3.5 rounded-2xl border-2 border-amber-400 shadow-lg">
                        <img
                          src={staffQrUrl}
                          alt="Staff Attendance QR Code"
                          className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                        />
                      </div>

                      <p className="text-xs text-slate-300 mt-3 font-medium print:text-slate-700">
                        ሰራተኞች በስልካቸው ካሜራ ስካን በማድረግ መግቢያና መውጫ ያስመዝግቡ
                      </p>

                      <div className="print:hidden mt-4 pt-3 border-t border-slate-800 w-full flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => onOpenMobilePortal && onOpenMobilePortal('staff', dept.id)}
                          className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ሞክር</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(staffPortalUrl)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white font-mono cursor-pointer"
                        >
                          {copiedUrl === staffPortalUrl ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>ሊንክ ኮፒ</span>
                        </button>
                      </div>
                    </div>

                    {/* CENTER: POLICE COMMISSION LOGO + VIBRANT MOTTO */}
                    <div className="lg:col-span-3 flex flex-col items-center justify-center text-center py-4 px-2">
                      <div className="hidden lg:block w-px h-10 bg-gradient-to-b from-transparent to-amber-400/60 mb-4" />

                      <div className="relative mb-4">
                        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-emerald-500/20 via-amber-400/25 to-rose-500/20 blur-lg print:hidden" />
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-b from-amber-300 via-amber-500 to-emerald-500 shadow-xl">
                          <div className="w-full h-full rounded-full bg-slate-950 print:bg-white flex items-center justify-center p-2">
                            <img
                              src={settings.logoUrl}
                              alt="Commission Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        {hasSplitMotto ? (
                          <>
                            <p className="text-lg sm:text-xl font-black font-serif bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent print:text-amber-700 print:bg-none">
                              በሰብዓዊነት ማገልገል
                            </p>
                            <p className="text-lg sm:text-xl font-black font-serif bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent print:text-emerald-700 print:bg-none">
                              በጀግንነት መጠበቅ
                            </p>
                          </>
                        ) : (
                          <p className="text-lg sm:text-xl font-black font-serif bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent print:text-slate-900 print:bg-none">
                            {mottoRaw}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 h-1 w-24 rounded-full overflow-hidden flex">
                        <div className="w-1/3 h-full bg-emerald-500" />
                        <div className="w-1/3 h-full bg-amber-400" />
                        <div className="w-1/3 h-full bg-rose-500" />
                      </div>

                      <div className="hidden lg:block w-px h-10 bg-gradient-to-t from-transparent to-emerald-400/60 mt-4" />
                    </div>

                    {/* RIGHT: VISITOR QR CODE */}
                    <div className="lg:col-span-4 bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center text-center print:bg-slate-50 print:border-slate-300">
                      <div className="flex items-center gap-2 text-emerald-400 font-black text-base sm:text-lg font-serif mb-1 print:text-emerald-900">
                        <Users className="w-5 h-5 shrink-0" />
                        <span>የባለጉዳዮች መስተንግዶና አስተያየት</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-4 print:text-slate-600">
                        VISITOR SERVICE & FEEDBACK QR
                      </p>

                      <div className="bg-white p-3.5 rounded-2xl border-2 border-emerald-400 shadow-lg">
                        <img
                          src={visitorQrUrl}
                          alt="Visitor Reception QR Code"
                          className="w-52 h-52 sm:w-60 sm:h-60 object-contain"
                        />
                      </div>

                      <p className="text-xs text-slate-300 mt-3 font-medium print:text-slate-700">
                        ክቡራን ባለጉዳዮች በስልክዎ ካሜራ ስካን በማድረግ ይመዝገቡና አስተያየት ይስጡ
                      </p>

                      <div className="print:hidden mt-4 pt-3 border-t border-slate-800 w-full flex items-center justify-between gap-2 text-xs">
                        <button
                          onClick={() => onOpenMobilePortal && onOpenMobilePortal('visitor', dept.id)}
                          className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>ሞክር</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(visitorPortalUrl)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white font-mono cursor-pointer"
                        >
                          {copiedUrl === visitorPortalUrl ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>ሊንክ ኮፒ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* POSTER 1: STAFF ATTENDANCE (የሰራተኞች መግቢያና መውጫ ፖስተር) */}
              {(posterType === 'both' || posterType === 'staff') && (
                <div className="bg-white text-slate-950 rounded-3xl p-8 border-4 border-slate-900 shadow-2xl max-w-3xl mx-auto break-after-page print:p-6 print:border-2 print:shadow-none print:m-0 print:w-full">
                  {/* Top Ethiopian Tricolor */}
                  <div className="h-2 w-full flex rounded-full overflow-hidden mb-4">
                    <div className="h-full w-1/3 bg-emerald-600"></div>
                    <div className="h-full w-1/3 bg-yellow-400"></div>
                    <div className="h-full w-1/3 bg-rose-600"></div>
                  </div>

                  {/* Header with Logos & Commission Name */}
                  <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={settings.logoUrl}
                        alt="Commission Logo"
                        className="w-16 h-16 object-contain"
                      />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif leading-tight">
                          {settings.commissionName}
                        </h2>
                        <p className="text-xs font-bold text-slate-600 font-sans tracking-wide">
                          BENISHANGUL GUMUZ REGION POLICE COMMISSION
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {settings.flagUrl && (
                        <img
                          src={settings.flagUrl}
                          alt="Ethiopia Flag"
                          className="h-8 w-12 object-contain shadow-sm border border-slate-200"
                        />
                      )}
                      {settings.regionalFlagUrl && (
                        <img
                          src={settings.regionalFlagUrl}
                          alt="BGR Flag"
                          className="h-8 w-12 object-contain shadow-sm border border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Department & Purpose Badge */}
                  <div className="text-center space-y-2 mb-6">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-slate-950 text-amber-400 text-xs font-extrabold uppercase tracking-wider font-mono">
                      የሰራተኞች መግቢያ እና መውጫ ፖስተር
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                      {dept.name}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 font-bold">
                      <span>የክፍል ኮድ፡ {dept.code}</span>
                      {dept.roomNumber && (
                        <>
                          <span>•</span>
                          <span className="text-slate-900">የቢሮ ቁጥር፡ {dept.roomNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Center QR Code and Instructions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-slate-50 border-2 border-slate-300 rounded-3xl p-6 mb-6">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-3 rounded-2xl border-2 border-slate-900 shadow-md">
                        <img
                          src={staffQrUrl}
                          alt="Staff Attendance QR Code"
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-700 mt-2">
                        STAFF ATTENDANCE QR CODE
                      </span>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="space-y-3.5 max-w-xs text-left">
                      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                        <Smartphone className="w-5 h-5 text-amber-600 shrink-0" />
                        <span>በስልክዎ ስካን ሲያደርጉ የሚከተሉ ደረጃዎች፡</span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">1</span>
                          <span>በስልክዎ ካሜራ ግድግዳው ላይ ያለውን ኪው አር ኮድ ስካን ያድርጉ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">2</span>
                          <span>የመታወቂያ ቁጥርዎን አስገብተው ኔክስት (Next) ይበሉ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">3</span>
                          <span>የዲጂታል መታወቂያ ካርድዎን የፊትና የኋላ ገጽ ይመልከቱ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[11px] shrink-0">4</span>
                          <span>ወደ ስራ ሲገቡ <strong>«መግቢያ»</strong>፤ ስራ ጨርሰው ሲወጡ <strong>«መውጫ»</strong> የሚለውን ይጫኑ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notice */}
                  <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span className="italic font-bold text-slate-800">«{settings.motto}»</span>
                    <span className="font-mono text-slate-500">በየክፍሉ ግድግዳ ላይ የሚለጠፍ ህጋዊ ሰነድ</span>
                  </div>

                  {/* Simulator Quick Action (Non-printable) */}
                  <div className="print:hidden mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => onOpenMobilePortal && onOpenMobilePortal('staff', dept.id)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>የሰራተኛ ሞባይል ገጽን በስክሪን ላይ ሞክረው ይመልከቱ</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(staffPortalUrl)}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-mono"
                    >
                      {copiedUrl === staffPortalUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      <span>የሊንኩን አድራሻ ኮፒ አድርግ</span>
                    </button>
                  </div>
                </div>
              )}

              {/* POSTER 2: VISITOR RECEPTION & FEEDBACK (የባለጉዳዮች መስተንግዶ እና አስተያየት ፖስተር) */}
              {(posterType === 'both' || posterType === 'visitor') && (
                <div className="bg-white text-slate-950 rounded-3xl p-8 border-4 border-emerald-950 shadow-2xl max-w-3xl mx-auto break-after-page print:p-6 print:border-2 print:shadow-none print:m-0 print:w-full">
                  {/* Top Ethiopian Tricolor */}
                  <div className="h-2 w-full flex rounded-full overflow-hidden mb-4">
                    <div className="h-full w-1/3 bg-emerald-600"></div>
                    <div className="h-full w-1/3 bg-yellow-400"></div>
                    <div className="h-full w-1/3 bg-rose-600"></div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={settings.logoUrl}
                        alt="Commission Logo"
                        className="w-16 h-16 object-contain"
                      />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-serif leading-tight">
                          {settings.commissionName}
                        </h2>
                        <p className="text-xs font-bold text-slate-600 font-sans tracking-wide">
                          BENISHANGUL GUMUZ REGION POLICE COMMISSION
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {settings.flagUrl && (
                        <img
                          src={settings.flagUrl}
                          alt="Ethiopia Flag"
                          className="h-8 w-12 object-contain shadow-sm border border-slate-200"
                        />
                      )}
                      {settings.regionalFlagUrl && (
                        <img
                          src={settings.regionalFlagUrl}
                          alt="BGR Flag"
                          className="h-8 w-12 object-contain shadow-sm border border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Department & Purpose Badge */}
                  <div className="text-center space-y-2 mb-6">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-extrabold uppercase tracking-wider font-mono">
                      የባለጉዳዮች መስተንግዶ እና አስተያየት መስጫ ፖስተር
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif">
                      {dept.name}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600 font-bold">
                      <span>የክፍል ኮድ፡ {dept.code}</span>
                      {dept.roomNumber && (
                        <>
                          <span>•</span>
                          <span className="text-slate-900">የቢሮ ቁጥር፡ {dept.roomNumber}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Center QR Code and Instructions */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-emerald-50/50 border-2 border-emerald-300 rounded-3xl p-6 mb-6">
                    {/* QR Code Container */}
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-3 rounded-2xl border-2 border-emerald-900 shadow-md">
                        <img
                          src={visitorQrUrl}
                          alt="Visitor Reception QR Code"
                          className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-900 mt-2">
                        VISITOR SERVICE & FEEDBACK QR
                      </span>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="space-y-3.5 max-w-xs text-left">
                      <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                        <Smartphone className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>ክቡር ባለጉዳይ በስልክዎ ስካን ያድርጉ፡</span>
                      </div>

                      <div className="space-y-2 text-xs text-slate-700">
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">1</span>
                          <span>በስልክዎ ካሜራ ይህንን ኪው አር ኮድ ስካን ያድርጉ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">2</span>
                          <span><strong>«አገልግሎት ፈልጌ»</strong> የሚለውን በመምረጥ ስምዎንና ስልክዎን ይሙሉ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">3</span>
                          <span>የመታወቂያዎን የፊትና የኋላ ገጽ ፎቶ አንስተው ያስገቡ</span>
                        </div>
                        <div className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">4</span>
                          <span>ጉዳይዎን ሲጨርሱ <strong>«አስተያየት ለመስጠት»</strong> በሚለው ደረጃ ይስጡን</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Notice */}
                  <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 font-medium">
                    <span className="italic font-bold text-slate-800">«{settings.motto}»</span>
                    <span className="font-mono text-emerald-800 font-bold">የህዝብ እርካታ የፖሊስ ኮሚሽኑ ቀዳሚ ግብ ነው</span>
                  </div>

                  {/* Simulator Quick Action (Non-printable) */}
                  <div className="print:hidden mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => onOpenMobilePortal && onOpenMobilePortal('visitor', dept.id)}
                      className="flex items-center gap-1.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>የባለጉዳይ ሞባይል ገጽን በስክሪን ላይ ሞክረው ይመልከቱ</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(visitorPortalUrl)}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-mono"
                    >
                      {copiedUrl === visitorPortalUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                      <span>የሊንኩን አድራሻ ኮፒ አድርግ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
