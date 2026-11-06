import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ScannerKiosk } from './components/ScannerKiosk';
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
  const [currentTab, setCurrentTab] = useState<string>('kiosk');
  const [settings, setSettings] = useState<CommissionSettings>(DEFAULT_COMMISSION_SETTINGS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  // Global gallery modal state
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Selected staff for card viewer
  const [cardStaff, setCardStaff] = useState<Staff | null>(null);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header & Navigation */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        announcements={announcements}
        onOpenGallery={() => setIsGalleryOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-8">
        {currentTab === 'kiosk' && (
          <ScannerKiosk
            departments={departments}
            staffList={staffList}
            visitors={visitors}
            settings={settings}
          />
        )}

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

        {currentTab === 'staff' && (
          <StaffManager
            departments={departments}
            staffList={staffList}
            onOpenCard={handleOpenStaffCard}
          />
        )}

        {currentTab === 'departments' && (
          <DepartmentManager
            departments={departments}
            staffList={staffList}
            visitors={visitors}
            feedbacks={feedbacks}
            attendanceList={attendanceList}
          />
        )}

        {currentTab === 'cards' && (
          <DigitalIdCards
            staffList={staffList}
            settings={settings}
            preselectedStaff={cardStaff}
            onSimulateScan={() => {
              setCurrentTab('kiosk');
            }}
          />
        )}

        {currentTab === 'announcements' && (
          <AnnouncementsManager announcements={announcements} />
        )}

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
