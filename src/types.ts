export type StaffStatus = 'on_duty' | 'off_duty';

export type PunctualityIn = 'high' | 'low'; // ከፍተኛ (08:30-09:00 / 2:30-3:00) vs ዝቅተኛ (after 3:01 / 09:01)
export type PunctualityOut = 'very_high' | 'low' | 'pending'; // በጣም ከፍተኛ (after 11:00 / 17:00) vs ዝቅተኛ (before 11:00)

export interface Department {
  id: string;
  name: string;
  code: string;
  icon?: string;
  roomNumber?: string;
  active: boolean;
  order: number;
}

export interface PoliceIDRecord {
  id: string; // Document ID / id_number
  id_number: string; // e.g. BGR-POL-1600000
  full_name_am: string;
  full_name_en: string;
  rank_am: string;
  rank_en: string;
  responsibility_am: string;
  responsibility_en: string;
  phone: string;
  photo_url: string;
  blood_type: string;
  badge_number: string;
  gender: string; // M / F
  complexion: string;
  height: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  commissioner_signature?: string;
  member_signature?: string;
  created_at: string;
  issued_at: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'rejected';
  department_id?: string;
}

export interface Staff {
  id: string;
  badgeNumber: string; // Used for police ID back barcode
  idNumber?: string; // e.g. BGR-POL-1600001
  fullName: string;
  fullNameEn?: string;
  rank: string; // ኮንስታብል፣ ሳጅን፣ ዋና ሳጅን፣ ረዳት ኢንስፔክተር፣ ኢንስፔክተር፣ ዋና ኢንስፔክተር፣ ኮማንደር
  rankEn?: string;
  departmentId: string;
  departmentName: string;
  responsibilityAm?: string;
  responsibilityEn?: string;
  phone?: string;
  photoUrl?: string;
  bloodType?: string;
  gender?: string;
  height?: string;
  complexion?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  issuedAt?: string;
  expiresAt?: string;
  commissionerSignature?: string;
  memberSignature?: string;
  status: StaffStatus;
  lastCheckIn?: string;
  lastCheckOut?: string;
  active: boolean;
  registeredAt?: string;
  idRecord?: PoliceIDRecord;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  badgeNumber: string;
  rank: string;
  departmentId: string;
  departmentName: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM or Ethiopian month
  checkInTime: string; // HH:MM:SS
  checkOutTime?: string | null;
  punctualityCheckIn: PunctualityIn;
  punctualityCheckOut?: PunctualityOut;
  timestamp: string; // ISO
}

export interface VisitorRecord {
  id: string;
  faydaId: string; // FIN or Fayda ID
  fullName: string;
  phone?: string;
  photoUrl?: string;
  gender?: string; // ወንድ / ሴት
  address?: string; // ከተማ / ዞን e.g. አሶሳ፣ ባምባሲ
  nationalId?: string; // FIN/UIN
  departmentId: string;
  departmentName: string;
  purpose: string;
  checkInTime: string;
  checkOutTime?: string | null;
  date: string;
  status: 'active' | 'completed';
  rating?: number | null; // 1 to 5
  ratingText?: string | null;
}

export interface FeedbackRecord {
  id: string;
  visitorLogId: string;
  faydaId: string;
  departmentId: string;
  departmentName: string;
  score: number; // 1 to 5
  label: string; // e.g. "እጅግ በጣም ረክቻለሁ"
  timestamp: string;
  date: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'urgent' | 'broadcast';
  active: boolean;
  createdAt: string;
}

export interface CommissionSettings {
  commissionName: string;
  logoUrl: string;
  flagUrl: string;
  regionalFlagUrl?: string;
  motto: string;
  morningStart: string; // "08:30" (2:30 Ethiopian)
  morningDeadline: string; // "09:00" (3:00 Ethiopian)
  eveningExitTime: string; // "17:00" (11:00 Ethiopian)
  updatedAt?: string;
}

export interface DepartmentScoreSummary {
  departmentId: string;
  departmentName: string;
  visitorCount: number;
  averageRating: number; // 1 to 5
  satisfactionScore: number; // 0 to 100%
  staffCount: number;
  onDutyStaffCount: number;
  punctualityScore: number; // 0 to 100%
  overallScore: number; // 0 to 100%
  rank?: number;
}
