import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Building2,
  Users,
  HeartHandshake,
  Smartphone,
  ExternalLink,
  Download,
  Check,
  Eye,
  Info,
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
  const [posterType, setPosterType] = useState<'both' | 'staff' | 'visitor'>('both');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  const filteredDepts = selectedDeptId === 'all'
    ? departments
    : departments.filter((d) => d.id === selectedDeptId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Non-printable Control Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Printer className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white font-serif">
              በግድግዳ ላይ የሚለጠፉ የኪው አር ኮድ ፖስተሮች ማተሚያ (Wall QR Posters)
            </h1>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            ቀደም ሲል በታብሌት ስካን ይደረግ የነበረው ተቀይሮ አድሚኑ ለእያንዳንዱ የስራ ክፍል የሚለጠፉ ፖስተሮችን ፕሪንት ያደርጋል። ሰራተኞችና ባለጉዳዮች በስልካቸው ካሜራ ስካን ያደርጋሉ።
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm shadow-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ፖስተሮችን ፕሪንት አድርግ (Print A4)</span>
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
            የሚታተመው የፖስተር ዓይነት፡
          </label>
          <select
            value={posterType}
            onChange={(e) => setPosterType(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
          >
            <option value="both">ሁለቱንም ፖስተሮች (የሰራተኞች + የባለጉዳዮች)</option>
            <option value="staff">የሰራተኞች መግቢያ እና መውጫ ብቻ</option>
            <option value="visitor">የባለጉዳዮች መስተንግዶ እና አስተያየት ብቻ</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <div className="text-[11px] text-amber-300/80 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>በቀጥታ በስልክ ካሜራ ስካን ሲያደርጉ ወደ ትክክለኛው ፖርታል ይወስዳል!</span>
          </div>
        </div>
      </div>

      {/* Printable Posters Canvas */}
      <div className="space-y-12">
        {filteredDepts.map((dept) => {
          const staffPortalUrl = `${baseUrl}?portal=staff&dept=${dept.id}`;
          const visitorPortalUrl = `${baseUrl}?portal=visitor&dept=${dept.id}`;

          const staffQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(staffPortalUrl)}`;
          const visitorQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=12&data=${encodeURIComponent(visitorPortalUrl)}`;

          return (
            <div key={dept.id} className="space-y-8">
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
