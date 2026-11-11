import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  ScanLine,
  Users,
  Building2,
  Megaphone,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  Calendar,
  Sparkles,
  Lock,
} from 'lucide-react';
import { CommissionSettings, Announcement } from '../types';
import { toEthiopianTime, getFormattedDateLabels, isWorkingDay } from '../utils/ethiopianTime';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: CommissionSettings;
  announcements: Announcement[];
  onOpenGallery?: () => void;
  onLockAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  announcements,
  onOpenGallery,
  onLockAdmin,
}) => {
  const [timeInfo, setTimeInfo] = useState(toEthiopianTime());
  const [dateInfo, setDateInfo] = useState(getFormattedDateLabels());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(toEthiopianTime());
      setDateInfo(getFormattedDateLabels());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const activeAnnouncements = announcements.filter((a) => a.active);
  const isWorkDay = isWorkingDay();

  return (
    <header className="bg-slate-900 border-b border-amber-500/30 text-white shadow-xl relative z-40 select-none">
      {/* Ethiopian Flag colored accent bar at very top */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/3 bg-emerald-600"></div>
        <div className="h-full w-1/3 bg-yellow-400"></div>
        <div className="h-full w-1/3 bg-rose-600"></div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Logo & Commission Branding */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => setCurrentTab('kiosk')}>
            <div className="relative w-13 h-13 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-amber-200 shadow-md shadow-amber-500/20 shrink-0">
              <img
                src={settings.logoUrl}
                alt="Police Commission Logo"
                className="w-full h-full rounded-full object-contain bg-slate-950 p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=100&auto=format&fit=crop&q=80';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-amber-400 drop-shadow-sm font-serif">
                  {settings.commissionName || 'የኢትዮጵያ ፖሊስ ኮሚሽን'}
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  ዲጂታል መስተንግዶ
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <span className="text-amber-300 italic font-semibold">«{settings.motto}»</span>
              </p>
            </div>
          </div>

          {/* Ethiopian Clock & Workday Status */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{timeInfo.formatted}</span>
                <span className="text-slate-400 font-normal">({timeInfo.rawTime})</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{dateInfo.formattedAmharic}</span>
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800"></div>

            <div className="flex flex-col items-center">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isWorkDay
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {isWorkDay ? 'የስራ ቀን (ሰኞ - አርብ)' : 'የእረፍት ቀን'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                የስራ ሰዓት: 2፡30 - 11፡00
              </span>
            </div>
          </div>

          {/* Ethiopian & Benishangul-Gumuz Flags & Quick Actions */}
          <div className="flex items-center gap-3">
            {/* Visual Flag Display */}
            <div
              onClick={onOpenGallery}
              className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 hover:border-amber-500/50 p-1.5 px-2.5 rounded-xl cursor-pointer transition-colors shadow-inner"
              title="የሰንደቅ ዓላማ እና ሎጎ ጋለሪን ይክፈቱ"
            >
              {settings.flagUrl && (
                <div className="flex flex-col items-center">
                  <img
                    src={settings.flagUrl}
                    alt="National Flag"
                    className="h-5 w-8 object-contain rounded shadow"
                  />
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5">ኢትዮጵያ</span>
                </div>
              )}

              {settings.regionalFlagUrl && (
                <div className="flex flex-col items-center border-l border-slate-800 pl-2">
                  <img
                    src={settings.regionalFlagUrl}
                    alt="Benishangul Gumuz Flag"
                    className="h-5 w-8 object-contain rounded shadow"
                  />
                  <span className="text-[9px] text-amber-300 font-bold mt-0.5">ቤ/ጉሙዝ</span>
                </div>
              )}
            </div>

            {onOpenGallery && (
              <button
                onClick={onOpenGallery}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">የሎጎና ሰንደቅ ጋለሪ</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'ከሙሉ ስክሪን ውጣ' : 'ሙሉ ስክሪን አድርግ'}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700/60 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-amber-400" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                title="አድሚን ዝጋ (Lock Admin)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">አድሚን ዝጋ</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 border-t border-slate-800/80 mt-2">
          <button
            onClick={() => setCurrentTab('wall_posters')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'wall_posters'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>የግድግዳ ፖስተር ማተሚያ (Wall Posters)</span>
          </button>

          <button
            onClick={() => setCurrentTab('mobile_staff')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'mobile_staff'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>የሰራተኛ ሞባይል ፖርታል</span>
          </button>

          <button
            onClick={() => setCurrentTab('mobile_visitor')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'mobile_visitor'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>የባለጉዳይ ሞባይል ፖርታል</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>አድሚን ዳሽቦርድ</span>
          </button>

          <button
            onClick={() => setCurrentTab('staff')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'staff'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>የሰራተኞች በየክፍሉ መዝገብ</span>
          </button>

          <button
            onClick={() => setCurrentTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'departments'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>የስራ ክፍሎች ደረጃ (100%)</span>
          </button>

          <button
            onClick={() => setCurrentTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'cards'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ዲጂታል መታወቂያ ካርዶች</span>
          </button>

          <button
            onClick={() => setCurrentTab('announcements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'announcements'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>ማስታወቂያዎች</span>
            {activeAnnouncements.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeAnnouncements.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 cursor-pointer ${
              currentTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ማስተካከያ</span>
          </button>
        </nav>
      </div>

      {/* Live Announcement Marquee / Ticker if active announcements exist */}
      {activeAnnouncements.length > 0 && (
        <div className="bg-amber-500/10 border-t border-b border-amber-500/30 px-4 py-1.5 flex items-center gap-3 overflow-hidden text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0 bg-amber-500/20 px-2 py-0.5 rounded">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>ማስታወቂያ:</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-[marquee_25s_linear_infinite] text-amber-200 font-medium">
              {activeAnnouncements.map((a, i) => (
                <span key={a.id} className="mr-12">
                  <span className="font-bold text-amber-300">[{a.title}]</span> {a.message}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
