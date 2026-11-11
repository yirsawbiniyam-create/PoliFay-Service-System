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
import { AdminSecurityGate } from './components/AdminSecurityGate';
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
import { Shield, Lock } from 'lucide-react';

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
  // Whether the page was directly opened via mobile QR scan (?portal=staff or ?portal=visitor)
  const [isMobileDirectView, setIsMobileDirectView] = useState(false);

  // Admin authentication state gatekeeper
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bgr_police_admin_auth') === 'true';
    }
    return false;
  });

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

    // Subscribe to public data: settings, departments, announcements
    const unsubSettings = subscribeToSettings(setSettings);
    const unsubDepts = subscribeToDepartments(setDepartments);
    const unsubAnn = subscribeToAnnouncements(setAnnouncements);

    return () => {
      unsubSettings();
      unsubDepts();
      unsubAnn();
    };
  }, []);

  // Subscribe to sensitive admin-only collections only when Admin is authenticated
  useEffect(() => {
    if (!isAdminAuthenticated) {
      return;
    }

    const unsubStaff = subscribeToStaff(setStaffList);
    const unsubAtt = subscribeToAttendance(setAttendanceList);
    const unsubVis = subscribeToVisitors(setVisitors);
    const unsubFb = subscribeToFeedbacks(setFeedbacks);

    return () => {
      unsubStaff();
      unsubAtt();
      unsubVis();
      unsubFb();
    };
  }, [isAdminAuthenticated]);

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

  const handleLockAdmin = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bgr_police_admin_auth');
    }
  };

  // 1. ISOLATED MOBILE QR SCAN VIEW
  // When a staff or visitor scans a wall poster QR code, they are strictly locked into their portal.
  // No Admin header, no navigation bars, no roster access, and no switch to the admin dashboard.
  if (isMobileDirectView) {
    const activeDept = departments.find((d) => d.id === activeDeptId);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        {/* Secure Isolated Mobile Topbar */}
        <header className="bg-slate-900 border-b border-amber-500/30 px-4 py-3 sticky top-0 z-30 shadow-lg">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 to-amber-200 shrink-0">
                <img
                  src={settings.logoUrl}
                  alt="Commission Crest"
                  className="w-full h-full rounded-full object-contain bg-slate-950 p-1"
                />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-amber-400 font-serif leading-tight">
                  {settings.commissionName}
                </h1>
                <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  <span>ይፋዊ የሞባይል ስካነር መስመር</span>
                </p>
              </div>
            </div>

            {/* Department Badge if set */}
            {activeDept && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ክፍል {activeDept.roomNumber}
                </span>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px] mt-0.5">
                  {activeDept.name}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Isolated Mobile Portal Content */}
        <main className="flex-1 w-full max-w-md mx-auto p-3">
          {currentTab === 'mobile_staff' ? (
            <MobileStaffPortal
              departments={departments}
              settings={settings}
              initialDeptId={activeDeptId}
            />
          ) : (
            <MobileVisitorPortal
              departments={departments}
              settings={settings}
              initialDeptId={activeDeptId}
            />
          )}
        </main>
      </div>
    );
  }

  // 2. ADMIN ACCESS GATEKEEPER
  // If the user is trying to access the admin system without valid admin authentication, show the security gate.
  if (!isAdminAuthenticated) {
    return (
      <AdminSecurityGate
        settings={settings}
        onAuthenticated={() => setIsAdminAuthenticated(true)}
        onNavigateToStaffPortal={() => {
          setIsMobileDirectView(true);
          setCurrentTab('mobile_staff');
        }}
        onNavigateToVisitorPortal={() => {
          setIsMobileDirectView(true);
          setCurrentTab('mobile_visitor');
        }}
      />
    );
  }

  // 3. AUTHENTICATED ADMIN DASHBOARD & WORKSTATION
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Navigation - Hidden during print */}
      <div className="print:hidden">
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          settings={settings}
          announcements={announcements}
          onOpenGallery={() => setIsGalleryOpen(true)}
          onLockAdmin={handleLockAdmin}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {/* Wall QR Posters Center */}
        {currentTab === 'wall_posters' && (
          <WallPostersPrintCenter
            departments={departments}
            settings={settings}
            onOpenMobilePortal={handleOpenMobilePortalFromPoster}
          />
        )}

        {/* Staff Mobile Portal Preview (Within Admin) */}
        {currentTab === 'mobile_staff' && (
          <MobileStaffPortal
            departments={departments}
            settings={settings}
            initialDeptId={activeDeptId}
          />
        )}

        {/* Visitor Mobile Portal Preview (Within Admin) */}
        {currentTab === 'mobile_visitor' && (
          <MobileVisitorPortal
            departments={departments}
            settings={settings}
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
            settings={settings}
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
