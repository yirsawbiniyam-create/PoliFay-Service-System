import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Department,
  Staff,
  AttendanceRecord,
  VisitorRecord,
  FeedbackRecord,
  Announcement,
  CommissionSettings,
  DepartmentScoreSummary,
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_STAFF,
  DEFAULT_COMMISSION_SETTINGS,
  INITIAL_ANNOUNCEMENTS,
} from '../data/initialData';
import {
  evaluateCheckInPunctuality,
  evaluateCheckOutPunctuality,
  getFormattedDateLabels,
  toEthiopianTime,
} from '../utils/ethiopianTime';

// Collection references
const DEPTS_COL = 'departments';
const STAFF_COL = 'staff';
const ATTENDANCE_COL = 'attendance';
const VISITORS_COL = 'visitors';
const FEEDBACKS_COL = 'feedbacks';
const ANNOUNCEMENTS_COL = 'announcements';
const SETTINGS_COL = 'settings';

const LOCAL_STORAGE_SETTINGS_KEY = 'polifay_commission_settings';

export function getCachedSettings(): CommissionSettings {
  if (typeof window === 'undefined') return DEFAULT_COMMISSION_SETTINGS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_COMMISSION_SETTINGS,
        ...parsed,
      };
    }
  } catch {
    // Ignore error
  }
  return DEFAULT_COMMISSION_SETTINGS;
}

export function saveCachedSettings(settings: CommissionSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore error
  }
}

const POLICE_IDS_COL = 'ids';

export function mapIdRecordToStaff(data: any, defaultDeptId?: string, defaultDeptName?: string): Staff {
  return {
    id: data.id_number || data.id || `BGR-POL-${Date.now()}`,
    idNumber: data.id_number || data.id,
    badgeNumber: data.badge_number || data.id_number || 'POL-0000',
    fullName: data.full_name_am || data.fullName || 'የፖሊስ አባል',
    fullNameEn: data.full_name_en || data.fullNameEn || '',
    rank: data.rank_am || data.rank || 'ኮንስታብል',
    rankEn: data.rank_en || data.rankEn || '',
    departmentId: data.department_id || data.departmentId || defaultDeptId || 'special_office',
    departmentName: data.responsibility_am || data.departmentName || defaultDeptName || 'የኮሚሽኑ ልዩ ጽ/ቤት',
    responsibilityAm: data.responsibility_am || data.departmentName,
    responsibilityEn: data.responsibility_en || '',
    phone: data.phone || '',
    photoUrl: data.photo_url || data.photoUrl || '',
    bloodType: data.blood_type || data.bloodType || 'O+',
    gender: data.gender || 'ወ / M',
    height: data.height || '1.75m',
    complexion: data.complexion || 'ጠይም (Brown)',
    emergencyContactName: data.emergency_contact_name || '',
    emergencyContactPhone: data.emergency_contact_phone || '',
    issuedAt: data.issued_at || data.issuedAt || '2026-01-10',
    expiresAt: data.expires_at || data.expiresAt || '2028-01-10',
    commissionerSignature: data.commissioner_signature,
    memberSignature: data.member_signature,
    status: data.status === 'on_duty' ? 'on_duty' : 'off_duty',
    lastCheckIn: data.lastCheckIn,
    lastCheckOut: data.lastCheckOut,
    active: true,
    registeredAt: data.created_at || data.registeredAt || '2026-01-10',
  };
}

/**
 * Seed initial data if Firestore is empty
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    // 1. Settings
    const settingsSnap = await getDocs(collection(db, SETTINGS_COL));
    if (settingsSnap.empty) {
      const current = getCachedSettings();
      await setDoc(doc(db, SETTINGS_COL, 'config'), current, { merge: true });
    }

    // 2. Departments
    const deptsSnap = await getDocs(collection(db, DEPTS_COL));
    if (deptsSnap.empty) {
      for (const dept of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, DEPTS_COL, dept.id), dept);
      }
    }

    // 3. Staff & Police Digital IDs (Synced)
    const staffSnap = await getDocs(collection(db, STAFF_COL));
    if (staffSnap.empty) {
      for (const st of INITIAL_STAFF) {
        await setDoc(doc(db, STAFF_COL, st.id), st);
      }
    }

    // 4. Police Digital ID Registry collection ('ids')
    const idsSnap = await getDocs(collection(db, POLICE_IDS_COL));
    if (idsSnap.empty) {
      for (const st of INITIAL_STAFF) {
        const idDoc = {
          id: st.id,
          id_number: st.idNumber || st.id,
          full_name_am: st.fullName,
          full_name_en: st.fullNameEn || st.fullName,
          rank_am: st.rank,
          rank_en: st.rankEn || st.rank,
          responsibility_am: st.responsibilityAm || st.departmentName,
          responsibility_en: st.responsibilityEn || '',
          phone: st.phone || '',
          photo_url: st.photoUrl || '',
          blood_type: st.bloodType || 'O+',
          badge_number: st.badgeNumber,
          gender: st.gender || 'ወ / M',
          complexion: st.complexion || 'ጠይም (Brown)',
          height: st.height || '1.75m',
          emergency_contact_name: st.emergencyContactName || '',
          emergency_contact_phone: st.emergencyContactPhone || '',
          issued_at: st.issuedAt || '2026-01-10',
          expires_at: st.expiresAt || '2028-01-10',
          created_at: new Date().toISOString(),
          status: 'approved',
          department_id: st.departmentId,
        };
        await setDoc(doc(db, POLICE_IDS_COL, st.id), idDoc);
      }
    }

    // 5. Announcements
    const annSnap = await getDocs(collection(db, ANNOUNCEMENTS_COL));
    if (annSnap.empty) {
      for (const ann of INITIAL_ANNOUNCEMENTS) {
        await setDoc(doc(db, ANNOUNCEMENTS_COL, ann.id), ann);
      }
    }
  } catch (error) {
    console.warn('Initial seeding encountered an error (using local fallbacks if offline):', error);
  }
}

/**
 * Listeners for real-time updates
 */
export function subscribeToSettings(onData: (settings: CommissionSettings) => void): () => void {
  // 1. Emit cached immediately
  const initial = getCachedSettings();
  onData(initial);

  // 2. Listen to in-memory broadcast
  const handleLocalUpdate = (e: Event) => {
    const custom = e as CustomEvent<CommissionSettings>;
    if (custom.detail) {
      onData(custom.detail);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('settings_updated', handleLocalUpdate);
  }

  // 3. Listen to Firestore
  try {
    const unsub = onSnapshot(
      doc(db, SETTINGS_COL, 'config'),
      (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data() as CommissionSettings;
          saveCachedSettings(remoteData);
          onData(remoteData);
        }
      },
      (error) => {
        console.warn('Firestore settings snapshot warning (using cached):', error);
      }
    );

    return () => {
      unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('settings_updated', handleLocalUpdate);
      }
    };
  } catch {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('settings_updated', handleLocalUpdate);
      }
    };
  }
}

export function subscribeToDepartments(onData: (depts: Department[]) => void): () => void {
  try {
    const q = query(collection(db, DEPTS_COL), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Department);
          onData(list);
        } else {
          onData(INITIAL_DEPARTMENTS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, DEPTS_COL);
      }
    );
  } catch {
    onData(INITIAL_DEPARTMENTS);
    return () => {};
  }
}

export function subscribeToStaff(onData: (staff: Staff[]) => void): () => void {
  try {
    return onSnapshot(
      collection(db, STAFF_COL),
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Staff);
          onData(list);
        } else {
          onData(INITIAL_STAFF);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, STAFF_COL);
      }
    );
  } catch {
    onData(INITIAL_STAFF);
    return () => {};
  }
}

export function subscribeToAttendance(onData: (records: AttendanceRecord[]) => void): () => void {
  try {
    const q = query(collection(db, ATTENDANCE_COL), orderBy('timestamp', 'desc'), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as AttendanceRecord);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ATTENDANCE_COL);
      }
    );
  } catch {
    onData([]);
    return () => {};
  }
}

export function subscribeToVisitors(onData: (visitors: VisitorRecord[]) => void): () => void {
  try {
    const q = query(collection(db, VISITORS_COL), orderBy('checkInTime', 'desc'), limit(200));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as VisitorRecord);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, VISITORS_COL);
      }
    );
  } catch {
    onData([]);
    return () => {};
  }
}

export function subscribeToFeedbacks(onData: (feedbacks: FeedbackRecord[]) => void): () => void {
  try {
    const q = query(collection(db, FEEDBACKS_COL), orderBy('timestamp', 'desc'), limit(300));
    return onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as FeedbackRecord);
        onData(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, FEEDBACKS_COL);
      }
    );
  } catch {
    onData([]);
    return () => {};
  }
}

export function subscribeToAnnouncements(onData: (announcements: Announcement[]) => void): () => void {
  try {
    const q = query(collection(db, ANNOUNCEMENTS_COL), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs.map((d) => d.data() as Announcement);
          onData(list);
        } else {
          onData(INITIAL_ANNOUNCEMENTS);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, ANNOUNCEMENTS_COL);
      }
    );
  } catch {
    onData(INITIAL_ANNOUNCEMENTS);
    return () => {};
  }
}

/**
 * Staff Scanning Actions
 */

export interface StaffScanResult {
  action: 'check_in' | 'check_out';
  staff: Staff;
  record: AttendanceRecord;
  punctualityLabel: string;
  ethiopianTime: string;
  isDepartmentMember: boolean;
  doorDepartmentName: string;
}

/**
 * Scans Police Digital ID barcode/QR code
 * Automatically determines if staff is checking in or checking out,
 * and verifies whether the officer belongs to this specific department and is a commission member!
 */
export async function processStaffScan(
  badgeOrId: string,
  staffList: Staff[],
  currentDoorDeptId?: string,
  currentDoorDeptName?: string
): Promise<StaffScanResult> {
  let cleanId = badgeOrId.trim();

  // 1. If scanned from a verification URL like .../verify/BGR-POL-1600001
  if (cleanId.includes('/verify/')) {
    const parts = cleanId.split('/verify/');
    if (parts[1]) {
      cleanId = parts[1].split('?')[0].split('#')[0].trim();
    }
  }

  // 2. If it's a JSON string payload from a custom QR
  if (cleanId.startsWith('{') && cleanId.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleanId);
      cleanId =
        parsed.id_number ||
        parsed.id ||
        parsed.badge_number ||
        parsed.badgeNumber ||
        cleanId;
    } catch {}
  }

  // Find in provided staffList
  let found = staffList.find(
    (s) =>
      s.id.toLowerCase() === cleanId.toLowerCase() ||
      (s.idNumber && s.idNumber.toLowerCase() === cleanId.toLowerCase()) ||
      s.badgeNumber.toLowerCase() === cleanId.toLowerCase() ||
      cleanId.toLowerCase().includes(s.badgeNumber.toLowerCase()) ||
      (s.idNumber && cleanId.toLowerCase().includes(s.idNumber.toLowerCase()))
  );

  // If not in staffList, query Firestore 'ids' collection directly
  if (!found) {
    try {
      // Check doc by ID
      const idDocRef = doc(db, POLICE_IDS_COL, cleanId);
      const idDocSnap = await getDoc(idDocRef);
      if (idDocSnap.exists()) {
        found = mapIdRecordToStaff(idDocSnap.data(), currentDoorDeptId, currentDoorDeptName);
      } else {
        // Query by id_number
        const qSnap = await getDocs(
          query(collection(db, POLICE_IDS_COL), where('id_number', '==', cleanId), limit(1))
        );
        if (!qSnap.empty) {
          found = mapIdRecordToStaff(qSnap.docs[0].data(), currentDoorDeptId, currentDoorDeptName);
        } else {
          // Query by badge_number
          const qBadge = await getDocs(
            query(collection(db, POLICE_IDS_COL), where('badge_number', '==', cleanId), limit(1))
          );
          if (!qBadge.empty) {
            found = mapIdRecordToStaff(qBadge.docs[0].data(), currentDoorDeptId, currentDoorDeptName);
          }
        }
      }

      // Sync into staff collection
      if (found) {
        await setDoc(doc(db, STAFF_COL, found.id), found, { merge: true });
      }
    } catch (err) {
      console.warn('Direct lookup in ids collection warning:', err);
    }
  }

  if (!found) {
    throw new Error(
      `የፖሊስ ዲጂታል መታወቂያው "${badgeOrId}" በፖሊስ ኮሚሽኑ አባላት መዝገብ ውስጥ አልተገኘም! እባክዎ በአድሚን ገጽ ይመዝገቡ።`
    );
  }

  const isDepartmentMember = currentDoorDeptId ? found.departmentId === currentDoorDeptId : true;
  const doorName = currentDoorDeptName || found.departmentName;

  const now = new Date();
  const ethTime = toEthiopianTime(now);
  const dateLabels = getFormattedDateLabels(now);

  if (found.status === 'off_duty') {
    // Check In: 2:30 to 3:00 is High, after 3:01 is Low
    const punctuality = evaluateCheckInPunctuality(now);
    const attendanceId = `att-${found.id}-${dateLabels.gregorianDate}-${Date.now()}`;

    const newAttendance: AttendanceRecord = {
      id: attendanceId,
      staffId: found.id,
      staffName: found.fullName,
      badgeNumber: found.badgeNumber,
      rank: found.rank,
      departmentId: found.departmentId,
      departmentName: found.departmentName,
      date: dateLabels.gregorianDate,
      month: dateLabels.monthString,
      checkInTime: ethTime.formatted,
      checkOutTime: null,
      punctualityCheckIn: punctuality.status,
      punctualityCheckOut: 'pending',
      timestamp: now.toISOString(),
    };

    // Save attendance
    await setDoc(doc(db, ATTENDANCE_COL, attendanceId), newAttendance);

    // Update staff status to on_duty
    const updatedStaff: Staff = {
      ...found,
      status: 'on_duty',
      lastCheckIn: ethTime.formatted,
    };
    await updateDoc(doc(db, STAFF_COL, found.id), {
      status: 'on_duty',
      lastCheckIn: ethTime.formatted,
    });

    return {
      action: 'check_in',
      staff: updatedStaff,
      record: newAttendance,
      punctualityLabel: punctuality.label,
      ethiopianTime: ethTime.formatted,
      isDepartmentMember,
      doorDepartmentName: doorName,
    };
  } else {
    // Check Out
    const punctuality = evaluateCheckOutPunctuality(now);

    const attSnap = await getDocs(
      query(collection(db, ATTENDANCE_COL), orderBy('timestamp', 'desc'), limit(15))
    );
    const openRecord = attSnap.docs
      .map((d) => d.data() as AttendanceRecord)
      .find((r) => r.staffId === found.id && (!r.checkOutTime || r.checkOutTime === null));

    let attendanceId = openRecord?.id;
    if (attendanceId) {
      await updateDoc(doc(db, ATTENDANCE_COL, attendanceId), {
        checkOutTime: ethTime.formatted,
        punctualityCheckOut: punctuality.status,
      });
    } else {
      attendanceId = `att-out-${found.id}-${dateLabels.gregorianDate}-${Date.now()}`;
      const record: AttendanceRecord = {
        id: attendanceId,
        staffId: found.id,
        staffName: found.fullName,
        badgeNumber: found.badgeNumber,
        rank: found.rank,
        departmentId: found.departmentId,
        departmentName: found.departmentName,
        date: dateLabels.gregorianDate,
        month: dateLabels.monthString,
        checkInTime: found.lastCheckIn || ethTime.formatted,
        checkOutTime: ethTime.formatted,
        punctualityCheckIn: 'high',
        punctualityCheckOut: punctuality.status,
        timestamp: now.toISOString(),
      };
      await setDoc(doc(db, ATTENDANCE_COL, attendanceId), record);
    }

    // Update staff status to off_duty
    const updatedStaff: Staff = {
      ...found,
      status: 'off_duty',
      lastCheckOut: ethTime.formatted,
    };
    await updateDoc(doc(db, STAFF_COL, found.id), {
      status: 'off_duty',
      lastCheckOut: ethTime.formatted,
    });

    const finalRecord: AttendanceRecord = {
      id: attendanceId,
      staffId: found.id,
      staffName: found.fullName,
      badgeNumber: found.badgeNumber,
      rank: found.rank,
      departmentId: found.departmentId,
      departmentName: found.departmentName,
      date: dateLabels.gregorianDate,
      month: dateLabels.monthString,
      checkInTime: found.lastCheckIn || ethTime.formatted,
      checkOutTime: ethTime.formatted,
      punctualityCheckIn: 'high',
      punctualityCheckOut: punctuality.status,
      timestamp: now.toISOString(),
    };

    return {
      action: 'check_out',
      staff: updatedStaff,
      record: finalRecord,
      punctualityLabel: punctuality.label,
      ethiopianTime: ethTime.formatted,
      isDepartmentMember,
      doorDepartmentName: doorName,
    };
  }
}

/**
 * Visitor Fayda Scan Actions
 */

export interface VisitorScanResult {
  action: 'entry' | 'exit_prompt_feedback';
  visitor: VisitorRecord;
  ethiopianTime: string;
}

/**
 * Scans Fayda Digital ID
 * If visitor has an active unchecked visit today -> returns 'exit_prompt_feedback' to collect rating!
 * If visitor is new or already completed previous visit -> registers new entry!
 */
export async function processVisitorScan(
  faydaPayload: {
    faydaId: string;
    fullName?: string;
    phone?: string;
    photoUrl?: string;
    gender?: string;
    address?: string;
    nationalId?: string;
    departmentId: string;
    departmentName: string;
    purpose?: string;
  },
  existingVisitors: VisitorRecord[]
): Promise<VisitorScanResult> {
  const cleanFaydaId = faydaPayload.faydaId.trim();
  const now = new Date();
  const ethTime = toEthiopianTime(now);
  const dateLabels = getFormattedDateLabels(now);

  // Check if there is an active (uncompleted) visit for this Fayda ID
  const activeVisit = existingVisitors.find(
    (v) => v.faydaId.toLowerCase() === cleanFaydaId.toLowerCase() && v.status === 'active'
  );

  if (activeVisit) {
    // Visitor is leaving: return exit_prompt_feedback so UI asks for 1-5 rating!
    return {
      action: 'exit_prompt_feedback',
      visitor: activeVisit,
      ethiopianTime: ethTime.formatted,
    };
  }

  // Register new visitor entry
  const visitorId = `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Safe display name without overflowing document field size
  const safeFullName =
    faydaPayload.fullName && faydaPayload.fullName.trim()
      ? faydaPayload.fullName.trim().substring(0, 150)
      : cleanFaydaId.length <= 25
      ? `ባለጉዳይ (${cleanFaydaId})`
      : `ባለጉዳይ (${cleanFaydaId.substring(0, 16)}...)`;

  const newVisitor: VisitorRecord = {
    id: visitorId,
    faydaId: cleanFaydaId.substring(0, 1000),
    fullName: safeFullName,
    phone: (faydaPayload.phone || '').substring(0, 50),
    photoUrl: faydaPayload.photoUrl || undefined,
    gender: faydaPayload.gender || undefined,
    address: faydaPayload.address || undefined,
    nationalId: faydaPayload.nationalId || undefined,
    departmentId: faydaPayload.departmentId,
    departmentName: faydaPayload.departmentName,
    purpose: (faydaPayload.purpose || 'አጠቃላይ አገልግሎት').substring(0, 250),
    checkInTime: ethTime.formatted,
    checkOutTime: null,
    date: dateLabels.gregorianDate,
    status: 'active',
  };

  try {
    await setDoc(doc(db, VISITORS_COL, visitorId), newVisitor);
  } catch (err) {
    console.warn('Visitor Firestore write fallback:', err);
    // Even if remote write faces transient delay, proceed with visitor state
  }

  return {
    action: 'entry',
    visitor: newVisitor,
    ethiopianTime: ethTime.formatted,
  };
}

/**
 * Submit Visitor Rating & Complete Exit
 * Options:
 * 5: "እጅግ በጣም ረክቻለሁ"
 * 4: "በጣም ረክቻለሁ"
 * 3: "ረክቻለሁ"
 * 2: "አልረካሁም"
 * 1: "አልተስተናገድኩም"
 */
export async function submitVisitorFeedback(
  visitorId: string,
  score: number,
  scoreLabel: string
): Promise<FeedbackRecord> {
  const now = new Date();
  const ethTime = toEthiopianTime(now);
  const dateLabels = getFormattedDateLabels(now);

  // Update visitor record to completed
  try {
    await updateDoc(doc(db, VISITORS_COL, visitorId), {
      status: 'completed',
      checkOutTime: ethTime.formatted,
      rating: score,
      ratingText: scoreLabel,
    });
  } catch (err) {
    console.warn('Visitor status update warning:', err);
  }

  // Create feedback record with direct getDoc lookup
  const feedbackId = `fb-${visitorId}-${Date.now()}`;
  let vFaydaId = '';
  let vDeptId = 'unknown';
  let vDeptName = 'አጠቃላይ';

  try {
    const vDoc = await getDoc(doc(db, VISITORS_COL, visitorId));
    if (vDoc.exists()) {
      const v = vDoc.data() as VisitorRecord;
      vFaydaId = v.faydaId || '';
      vDeptId = v.departmentId || 'unknown';
      vDeptName = v.departmentName || 'አጠቃላይ';
    }
  } catch (e) {
    console.warn('Feedback doc lookup fallback:', e);
  }

  const fbRecord: FeedbackRecord = {
    id: feedbackId,
    visitorLogId: visitorId,
    faydaId: vFaydaId,
    departmentId: vDeptId,
    departmentName: vDeptName,
    score,
    label: scoreLabel,
    timestamp: now.toISOString(),
    date: dateLabels.gregorianDate,
  };

  try {
    await setDoc(doc(db, FEEDBACKS_COL, feedbackId), fbRecord);
  } catch (err) {
    console.warn('Feedback write warning:', err);
  }

  return fbRecord;
}

/**
 * Department Performance Calculation
 * "ይህ ሲሰተም በአስተያየቱ መሰረት ለየክፍሉ ደረጃ ይሰጣል፡፡ ከመቶ ያስቀምጣል፡፡
 * በአመት ዉስጥ 1 ሰዉም ይምጣ 100 ሰዉ ይምጣ በተሰጠዉ አስተያየት መሰረት ደረጃ ይሰጣል፡፡
 * ሰራተኞችን የስራ ሰዓት ጋር ጨምሮ ደረጃዉን ይሰጣል፡፡"
 */
export function calculateDepartmentScores(
  departments: Department[],
  visitors: VisitorRecord[],
  feedbacks: FeedbackRecord[],
  staffList: Staff[],
  attendanceList: AttendanceRecord[]
): DepartmentScoreSummary[] {
  const summaries: DepartmentScoreSummary[] = departments.map((dept) => {
    // 1. Visitor feedbacks for this department
    const deptFeedbacks = feedbacks.filter((f) => f.departmentId === dept.id);
    const feedbackCount = deptFeedbacks.length;
    let avgRating = 0;
    let satisfactionScore = 0;

    if (feedbackCount > 0) {
      const sum = deptFeedbacks.reduce((acc, curr) => acc + curr.score, 0);
      avgRating = sum / feedbackCount;
      satisfactionScore = Math.round((avgRating / 5) * 100);
    } else {
      // If no feedbacks yet, show 100% or baseline
      satisfactionScore = 90;
      avgRating = 4.5;
    }

    // 2. Staff punctuality in this department
    const deptStaff = staffList.filter((s) => s.departmentId === dept.id && s.active);
    const onDutyStaff = deptStaff.filter((s) => s.status === 'on_duty');
    const deptAttendance = attendanceList.filter((a) => a.departmentId === dept.id);

    let punctualityScore = 95;
    if (deptAttendance.length > 0) {
      const highPunctualityCount = deptAttendance.filter((a) => a.punctualityCheckIn === 'high').length;
      punctualityScore = Math.round((highPunctualityCount / deptAttendance.length) * 100);
    }

    // 3. Combined Overall Score: 60% visitor satisfaction + 40% staff punctuality
    const overallScore = Math.min(100, Math.round(satisfactionScore * 0.6 + punctualityScore * 0.4));

    const totalVisitors = visitors.filter((v) => v.departmentId === dept.id).length;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      visitorCount: totalVisitors,
      averageRating: Number(avgRating.toFixed(1)),
      satisfactionScore,
      staffCount: deptStaff.length,
      onDutyStaffCount: onDutyStaff.length,
      punctualityScore,
      overallScore,
    };
  });

  // Sort descending by overallScore and assign ranks
  summaries.sort((a, b) => b.overallScore - a.overallScore);
  return summaries.map((s, idx) => ({ ...s, rank: idx + 1 }));
}

/**
 * CRUD Operations for Departments, Staff, Announcements, Settings
 */

export async function addDepartment(dept: Omit<Department, 'id'>): Promise<void> {
  const id = `dept-${Date.now()}`;
  await setDoc(doc(db, DEPTS_COL, id), { ...dept, id });
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
  await updateDoc(doc(db, DEPTS_COL, id), updates);
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, DEPTS_COL, id));
}

export async function addStaff(st: Omit<Staff, 'id'>): Promise<void> {
  const id = st.badgeNumber.trim() || `POL-${Date.now().toString().slice(-4)}`;
  await setDoc(doc(db, STAFF_COL, id), { ...st, id, registeredAt: new Date().toISOString() });
}

export async function updateStaff(id: string, updates: Partial<Staff>): Promise<void> {
  await updateDoc(doc(db, STAFF_COL, id), updates);
}

export async function deleteStaff(id: string): Promise<void> {
  await deleteDoc(doc(db, STAFF_COL, id));
}

export async function addAnnouncement(ann: Omit<Announcement, 'id'>): Promise<void> {
  const id = `ann-${Date.now()}`;
  await setDoc(doc(db, ANNOUNCEMENTS_COL, id), { ...ann, id });
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  await updateDoc(doc(db, ANNOUNCEMENTS_COL, id), updates);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, ANNOUNCEMENTS_COL, id));
}

export async function updateSettings(settings: Partial<CommissionSettings>): Promise<void> {
  const current = getCachedSettings();
  const merged: CommissionSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately cache in localStorage
  saveCachedSettings(merged);

  // 2. Dispatch custom event for immediate UI reaction in all open components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings_updated', { detail: merged }));
  }

  // 3. Write to Firestore using setDoc with merge: true (so it creates or updates without failure)
  try {
    await setDoc(doc(db, SETTINGS_COL, 'config'), merged, { merge: true });
  } catch (err) {
    console.warn('Firestore setDoc settings warning (persisted locally):', err);
  }
}
