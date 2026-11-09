import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { WallPostersPrintCenter } from './components/WallPostersPrintCenter';
import { MobileStaffPortal } from './components/MobileStaffPortal';
import { MobileVisitorPortal } from './components/MobileVisitorPortal';
import { Dashboard } from './components/Dashboard';
import { StaffManager } from './components/StaffManager';
import { DepartmentManager } from './components/DepartmentManager';
import { AnnouncementsManager } from './components/AnnouncementsManager';
import { SettingsManager } from './components/SettingsManager';
import { DigitalIdCards } from './components/DigitalIdCards';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import {
  Department,
  Staff,
  AttendanceRecord,
  VisitorRecord,
  FeedbackRecord,
  Announcement,
  CommissionSettings,
} from './types';
import {
  seedInitialDataIfNeeded,
  subscribeToSettings,
  subscribeToDepartments,
  subscribeToStaff,
  subscribeToAttendance,
  subscribeToVisitors,
  subscribeToFeedbacks,
  subscribeToAnnouncements,
} from './services/dbService';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  DEFAULT_COMMISSION_SETTINGS,
  INITIAL_ANNOUNCEMENTS,
} from './data/initialData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('wall_posters');
  const [settings, setSettings] = useState<CommissionSettings>(DEFAULT_COMMISSION_SETTINGS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  // Department ID when scanned from a wall QR code
  const [activeDeptId, setActiveDeptId] = useState<string | undefined>(undefined);
  const [isMobileDirectView, setIsMobileDirectView] = useState(false);

  // Global gallery modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Selected staff for card viewer
  const [cardStaff, setCardStaff] = useState<Staff | null>(null);

  useEffect(() => {
    // Check if opened via Wall QR code scan URL parameter (?portal=staff&dept=... or ?portal=visitor&dept=...)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const portal = urlParams.get('portal');
      const dept = urlParams.get('dept');
      if (dept) setActiveDeptId(dept);

      if (portal === 'staff') {
        setCurrentTab('mobile_staff');
        setIsMobileDirectView(true);
      } else if (portal === 'visitor') {
        setCurrentTab('mobile_visitor');
        setIsMobileDirectView(true);
      }
    }

    // Seed initial data to Firestore if empty
    seedInitialDataIfNeeded();

    // Subscribe to real-time Firestore updates
    const unsubSettings = subscribeToSettings(setSettings);
    const unsubDepts = subscribeToDepartments(setDepartments);
    const unsubStaff = subscribeToStaff(setStaffList);
    const unsubAtt = subscribeToAttendance(setAttendanceList);
    const unsubVis = subscribeToVisitors(setVisitors);
    const unsubFb = subscribeToFeedbacks(setFeedbacks);
    const unsubAnn = subscribeToAnnouncements(setAnnouncements);

    return () => {
      unsubSettings();
      unsubDepts();
      unsubStaff();
      unsubAtt();
      unsubVis();
      unsubFb();
      unsubAnn();
    };
  }, []);

  const handleOpenStaffCard = (staff: Staff) => {
    setCardStaff(staff);
    setCurrentTab('cards');
  };

  const handleOpenMobilePortalFromPoster = (portal: 'staff' | 'visitor', deptId: string) => {
    setActiveDeptId(deptId);
    if (portal === 'staff') {
      setCurrentTab('mobile_staff');
    } else {
      setCurrentTab('mobile_visitor');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Navigation - Hidden during print */}
      <div className="print:hidden">
        {/* If in direct mobile scan mode, show a small discreet switch to admin */}
        {isMobileDirectView && (
          <div className="bg-slate-900 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] font-mono text-amber-400">
              📱 የስልክ ካሜራ ስካን ፖርታል (Mobile Web Portal)
            </span>
            <button
              onClick={() => {
                setIsMobileDirectView(false);
                setCurrentTab('dashboard');
              }}
              className="text-amber-300 hover:text-white underline font-bold cursor-pointer"
            >
              ወደ አድሚን ዳሽቦርድ ግባ →
            </button>
          </div>
        )}

        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          settings={settings}
          announcements={announcements}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {/* Wall QR Posters Center (Replaces old tablet kiosk) */}
        {currentTab === 'wall_posters' && (
          <WallPostersPrintCenter
            departments={departments}
            settings={settings}
            onOpenMobilePortal={handleOpenMobilePortalFromPoster}
          />
        )}

        {/* Staff Mobile Portal */}
        {currentTab === 'mobile_staff' && (
          <MobileStaffPortal
            staffList={staffList}
            departments={departments}
            settings={settings}
            initialDeptId={activeDeptId}
          />
        )}

        {/* Visitor Mobile Portal */}
        {currentTab === 'mobile_visitor' && (
          <MobileVisitorPortal
            departments={departments}
            settings={settings}
            visitors={visitors}
            initialDeptId={activeDeptId}
          />
        )}

        {/* Admin Dashboard */}
        {currentTab === 'dashboard' && (
          <Dashboard
            departments={departments}
            staffList={staffList}
            attendanceList={attendanceList}
            visitors={visitors}
            feedbacks={feedbacks}
            settings={settings}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Staff Manager (3-Step Registration by Department) */}
        {currentTab === 'staff' && (
          <StaffManager
            departments={departments}
            staffList={staffList}
            onOpenCard={handleOpenStaffCard}
          />
        )}

        {/* Departments & Score Summary */}
        {currentTab === 'departments' && (
          <DepartmentManager
            departments={departments}
            staffList={staffList}
            visitors={visitors}
            feedbacks={feedbacks}
            attendanceList={attendanceList}
          />
        )}

        {/* Digital ID Cards Viewer */}
        {currentTab === 'cards' && (
          <DigitalIdCards
            staffList={staffList}
            settings={settings}
            preselectedStaff={cardStaff}
            onSimulateScan={() => {
              setCurrentTab('mobile_staff');
            }}
          />
        )}

        {/* Announcements */}
        {currentTab === 'announcements' && (
          <AnnouncementsManager announcements={announcements} />
        )}

        {/* Commission Settings */}
        {currentTab === 'settings' && (
          <SettingsManager
            settings={settings}
            onOpenGallery={() => setIsGalleryOpen(true)}
          />
        )}
      </main>

      {/* Global Media Gallery Modal for Logos and Flags */}
      <MediaGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        settings={settings}
      />
    </div>
  );
}
