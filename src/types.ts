/**
 * Shared Type Definitions for Attendance Management System
 */

export type UserRole = 'admin' | 'teacher' | 'student';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceSessionType = 'manual' | 'qr' | 'gps';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  leaveBalance: number;
  createdAt: string;
}

export interface ClassDepartment {
  id: string;
  name: string;
  code: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO date YYYY-MM-DD
  timeSlot: string;
  type: AttendanceSessionType;
  qrCodeSecret?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsRadius?: number; // Meters
  lateThresholdMins?: number; // threshold after start in minutes
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: AttendanceStatus;
  markedAt: string;
  latitude?: number;
  longitude?: number;
  distanceMetres?: number;
  isLate: boolean;
  comment?: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  comment?: string;
  approvedBy?: string; // Teacher's name or admin's name
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendancePercent: number;
  presentCountToday: number;
  absentCountToday: number;
  lateCountToday: number;
  departmentStats: { department: string; rate: number }[];
  weeklyTrends: { name: string; present: number; absent: number; late: number }[];
  leavePendingCount: number;
}
