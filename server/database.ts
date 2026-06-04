import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  User, 
  UserRole, 
  ClassDepartment, 
  Subject, 
  AttendanceSession, 
  AttendanceRecord, 
  LeaveRequest, 
  Notification, 
  AuditLog,
  AttendanceStatus,
  AttendanceSessionType,
  LeaveStatus
} from '../src/types';

export interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  classes: ClassDepartment[];
  subjects: Subject[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  leaves: LeaveRequest[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: {
    minAttendanceThreshold: number; // default e.g. 75
    lateThresholdMins: number; // default e.g. 10
    gpsLatitude: number;
    gpsLongitude: number;
    gpsRadius: number; // default e.g. 100 meters
  };
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to format Date objects as YYYY-MM-DD
export function formatDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

class DatabaseManager {
  private data!: DatabaseSchema;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        try {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          this.data = JSON.parse(raw);
          console.log('[DATABASE] Database loaded successfully from file.');
          return;
        } catch (err) {
          console.error('[DATABASE ERRROR] Error loading database file, using seed fallback:', err);
        }
      }
    } catch (err) {
      console.warn('[DATABASE WARNING] Read-only or inaccessible filesystem during initialization. Operating in memory only.', err);
    }

    this.seedFreshData();
  }

  private save() {
    try {
      // Safely check if directory exists/can be created before writing
      let canWrite = true;
      if (!fs.existsSync(DB_DIR)) {
        try {
          fs.mkdirSync(DB_DIR, { recursive: true });
        } catch {
          canWrite = false;
        }
      }
      if (canWrite) {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
        console.log('[DATABASE] Changes successfully flushed to disk.');
      } else {
        console.warn('[DATABASE] Write skipped due to inaccessible filesystem directory.');
      }
    } catch (err) {
      console.warn('[DATABASE WARNING] Failed to write database state to file. Changes persist in-memory.', err);
    }
  }

  private seedFreshData() {
    console.log('Seeding database with fresh professional records...');

    // Hash passwords
    const adminHash = bcrypt.hashSync('adminPassword', 10);
    const teacherHash = bcrypt.hashSync('teacherPassword', 10);
    const studentHash = bcrypt.hashSync('studentPassword', 10);

    const users: Array<User & { passwordHash: string }> = [
      {
        id: 'u-1',
        name: 'System Admin',
        email: 'admin@attendance.co',
        role: 'admin',
        department: 'Administration',
        leaveBalance: 15,
        createdAt: new Date().toISOString(),
        passwordHash: adminHash
      },
      {
        id: 'u-2',
        name: 'Emma Thompson',
        email: 'emma.t@attendance.co',
        role: 'teacher',
        department: 'Computer Science',
        leaveBalance: 12,
        createdAt: new Date().toISOString(),
        passwordHash: teacherHash
      },
      {
        id: 'u-3',
        name: 'David Harris',
        email: 'david.h@attendance.co',
        role: 'teacher',
        department: 'Business Administration',
        leaveBalance: 12,
        createdAt: new Date().toISOString(),
        passwordHash: teacherHash
      },
      {
        id: 'u-4',
        name: 'Alex Mercer',
        email: 'alex.m@attendance.co',
        role: 'student',
        department: 'Computer Science',
        leaveBalance: 8,
        createdAt: new Date().toISOString(),
        passwordHash: studentHash
      },
      {
        id: 'u-5',
        name: 'Sarah Jenkins',
        email: 'sarah.j@attendance.co',
        role: 'student',
        department: 'Computer Science',
        leaveBalance: 8,
        createdAt: new Date().toISOString(),
        passwordHash: studentHash
      },
      {
        id: 'u-6',
        name: 'James Wilson',
        email: 'james.w@attendance.co',
        role: 'student',
        department: 'Business Administration',
        leaveBalance: 8,
        createdAt: new Date().toISOString(),
        passwordHash: studentHash
      },
      {
        id: 'u-7',
        name: 'Lily Chen',
        email: 'lily.c@attendance.co',
        role: 'student',
        department: 'Computer Science',
        leaveBalance: 8,
        createdAt: new Date().toISOString(),
        passwordHash: studentHash
      }
    ];

    const classes: ClassDepartment[] = [
      { id: 'c-1', name: 'Computer Science', code: 'CS-DEPT' },
      { id: 'c-2', name: 'Business Administration', code: 'BA-DEPT' }
    ];

    const subjects: Subject[] = [
      { id: 's-1', name: 'Software Engineering', code: 'CS-301', classId: 'c-1' },
      { id: 's-2', name: 'Database Systems', code: 'CS-302', classId: 'c-1' },
      { id: 's-3', name: 'Financial Accounting', code: 'BA-101', classId: 'c-2' },
      { id: 's-4', name: 'Microeconomics', code: 'BA-102', classId: 'c-2' }
    ];

    const sessions: AttendanceSession[] = [];
    const records: AttendanceRecord[] = [];

    // Settings
    const settings = {
      minAttendanceThreshold: 75,
      lateThresholdMins: 10,
      gpsLatitude: 37.7749, // San Francisco/Standard Mock Coordinates
      gpsLongitude: -122.4194,
      gpsRadius: 150 // 150 meters
    };

    // Let's seed historic sessions and records for the last 10 days to make charts look brilliant
    const today = new Date();
    const studentsByDept: Record<string, string[]> = {
      'CS-DEPT': ['u-4', 'u-5', 'u-7'],
      'BA-DEPT': ['u-6']
    };

    let sessionCounter = 1;
    let recordCounter = 1;

    // CS class history
    for (let i = 10; i >= 1; i--) {
      const sessionDate = new Date(today);
      sessionDate.setDate(today.getDate() - i);
      const isWeekend = sessionDate.getDay() === 0 || sessionDate.getDay() === 6;
      if (isWeekend) continue;

      const dateStr = formatDateString(sessionDate);

      // Session 1: Software Engineering (Emma)
      const listCS = studentsByDept['CS-DEPT'];
      const sId = `sess-${sessionCounter++}`;
      sessions.push({
        id: sId,
        classId: 'c-1',
        className: 'Computer Science',
        subjectId: 's-1',
        subjectName: 'Software Engineering',
        teacherId: 'u-2',
        teacherName: 'Emma Thompson',
        date: dateStr,
        timeSlot: '09:00 AM - 10:30 AM',
        type: i % 3 === 0 ? 'gps' : i % 3 === 1 ? 'qr' : 'manual',
        qrCodeSecret: i % 3 === 1 ? 'QR-SECRET-SOFTENG-' + dateStr : undefined,
        gpsLatitude: settings.gpsLatitude,
        gpsLongitude: settings.gpsLongitude,
        gpsRadius: settings.gpsRadius,
        lateThresholdMins: settings.lateThresholdMins,
        createdAt: new Date(sessionDate).toISOString()
      });

      // Records for Session 1
      listCS.forEach(studentId => {
        const student = users.find(u => u.id === studentId)!;
        // Random status (mostly present, some late, rare absent)
        const rand = Math.random();
        let status: AttendanceStatus = 'present';
        if (rand < 0.08) status = 'absent';
        else if (rand < 0.22) status = 'late';

        records.push({
          id: `rec-${recordCounter++}`,
          sessionId: sId,
          userId: studentId,
          userName: student.name,
          userEmail: student.email,
          status,
          markedAt: new Date(sessionDate.setHours(9, status === 'late' ? 15 : 2, 0)).toISOString(),
          isLate: status === 'late',
          comment: status === 'late' ? 'Traffic delay' : undefined
        });
      });

      // Session 2: Financial Accounting (David Harris) for Business Admin
      const listBA = studentsByDept['BA-DEPT'];
      const sId2 = `sess-${sessionCounter++}`;
      sessions.push({
        id: sId2,
        classId: 'c-2',
        className: 'Business Administration',
        subjectId: 's-3',
        subjectName: 'Financial Accounting',
        teacherId: 'u-3',
        teacherName: 'David Harris',
        date: dateStr,
        timeSlot: '11:00 AM - 12:30 PM',
        type: 'manual',
        lateThresholdMins: settings.lateThresholdMins,
        createdAt: new Date(sessionDate).toISOString()
      });

      listBA.forEach(studentId => {
        const student = users.find(u => u.id === studentId)!;
        const rand = Math.random();
        let status: AttendanceStatus = 'present';
        if (rand < 0.15) status = 'absent';

        records.push({
          id: `rec-${recordCounter++}`,
          sessionId: sId2,
          userId: studentId,
          userName: student.name,
          userEmail: student.email,
          status,
          markedAt: new Date(sessionDate.setHours(11, 4, 0)).toISOString(),
          isLate: false
        });
      });
    }

    // Seed Leave requests
    const leaves: LeaveRequest[] = [
      {
        id: 'lv-1',
        userId: 'u-4',
        userName: 'Alex Mercer',
        userEmail: 'alex.m@attendance.co',
        startDate: formatDateString(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
        endDate: formatDateString(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
        reason: 'Family event out of town',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      {
        id: 'lv-2',
        userId: 'u-5',
        userName: 'Sarah Jenkins',
        userEmail: 'sarah.j@attendance.co',
        startDate: formatDateString(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
        endDate: formatDateString(new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)),
        reason: 'Medical wisdom tooth removal',
        status: 'approved',
        comment: 'Get well soon. Make up for CS database lab.',
        approvedBy: 'Emma Thompson',
        createdAt: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'lv-3',
        userId: 'u-6',
        userName: 'James Wilson',
        userEmail: 'james.w@attendance.co',
        startDate: formatDateString(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
        endDate: formatDateString(new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000)),
        reason: 'Going to music concert',
        status: 'rejected',
        comment: 'Concerts are not acceptable reasons for official leave requests during mid-term prep.',
        approvedBy: 'David Harris',
        createdAt: new Date().toISOString()
      }
    ];

    // Seed notifications
    const notifications: Notification[] = [
      {
        id: 'not-1',
        userId: 'u-4',
        message: 'Welcome Alex! Your CS-301 attendance rate is currently at 88%. Keep it up!',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'not-2',
        userId: 'u-2',
        message: 'New leave request received from Alex Mercer for family event.',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'not-3',
        userId: 'u-5',
        message: 'Your leave request for Wisdom Tooth removal was Approved by Emma Thompson.',
        isRead: true,
        createdAt: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Audit logs
    const auditLogs: AuditLog[] = [
      {
        id: 'log-1',
        userId: 'u-1',
        userName: 'System Admin',
        role: 'admin',
        action: 'System Initialized',
        details: 'Initial databases and mock data successfully deployed.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'log-2',
        userId: 'u-1',
        userName: 'System Admin',
        role: 'admin',
        action: 'Configured Rules',
        details: 'Default min attendance threshold set to 75%, late threshold set to 10 minutes.',
        timestamp: new Date().toISOString()
      }
    ];

    this.data = {
      users,
      classes,
      subjects,
      sessions,
      records,
      leaves,
      notifications,
      auditLogs,
      settings
    };

    this.save();
  }

  // --- QUERY APIS ---

  public getUsers() {
    return this.data.users;
  }

  public addUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  public deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.records = this.data.records.filter(r => r.userId !== id);
    this.data.leaves = this.data.leaves.filter(l => l.userId !== id);
    this.data.notifications = this.data.notifications.filter(n => n.userId !== id);
    this.save();
    return true;
  }

  public getClasses() {
    return this.data.classes;
  }

  public addClass(cls: ClassDepartment) {
    this.data.classes.push(cls);
    this.save();
    return cls;
  }

  public deleteClass(id: string) {
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    this.data.subjects = this.data.subjects.filter(s => s.classId !== id);
    const deletedSessionIds = this.data.sessions.filter(s => s.classId === id).map(s => s.id);
    this.data.sessions = this.data.sessions.filter(s => s.classId !== id);
    this.data.records = this.data.records.filter(r => !deletedSessionIds.includes(r.sessionId));
    this.save();
    return true;
  }

  public getSubjects() {
    return this.data.subjects;
  }

  public addSubject(sub: Subject) {
    this.data.subjects.push(sub);
    this.save();
    return sub;
  }

  public deleteSubject(id: string) {
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    const deletedSessionIds = this.data.sessions.filter(s => s.subjectId === id).map(s => s.id);
    this.data.sessions = this.data.sessions.filter(s => s.subjectId !== id);
    this.data.records = this.data.records.filter(r => !deletedSessionIds.includes(r.sessionId));
    this.save();
    return true;
  }

  public getSessions() {
    return this.data.sessions;
  }

  public addSession(session: AttendanceSession) {
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public deleteSession(id: string) {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.data.records = this.data.records.filter(r => r.sessionId !== id);
    this.save();
    return true;
  }

  public getRecords() {
    return this.data.records;
  }

  public addOrUpdateRecord(record: Omit<AttendanceRecord, 'id'>) {
    const existingIdx = this.data.records.findIndex(
      r => r.sessionId === record.sessionId && r.userId === record.userId
    );

    if (existingIdx !== -1) {
      this.data.records[existingIdx] = { 
        ...this.data.records[existingIdx], 
        ...record,
        markedAt: new Date().toISOString()
      };
      this.save();
      return this.data.records[existingIdx];
    } else {
      const newRec: AttendanceRecord = {
        id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...record
      };
      this.data.records.push(newRec);
      this.save();
      return newRec;
    }
  }

  public bulkAddRecords(newRecords: AttendanceRecord[]) {
    newRecords.forEach(rec => {
      const existingIdx = this.data.records.findIndex(
        r => r.sessionId === rec.sessionId && r.userId === rec.userId
      );
      if (existingIdx !== -1) {
        this.data.records[existingIdx] = rec;
      } else {
        this.data.records.push(rec);
      }
    });
    this.save();
  }

  public getLeaves() {
    return this.data.leaves;
  }

  public addLeave(leave: LeaveRequest) {
    this.data.leaves.push(leave);
    this.save();
    return leave;
  }

  public updateLeaveStatus(id: string, status: LeaveStatus, comment?: string, approvedBy?: string) {
    const idx = this.data.leaves.findIndex(l => l.id === id);
    if (idx !== -1) {
      const targetLeave = this.data.leaves[idx];
      targetLeave.status = status;
      if (comment) targetLeave.comment = comment;
      if (approvedBy) targetLeave.approvedBy = approvedBy;

      // Adjust leave balance of student if approved
      if (status === 'approved') {
        const studentIdx = this.data.users.findIndex(u => u.id === targetLeave.userId);
        if (studentIdx !== -1) {
          // calculate days
          const start = new Date(targetLeave.startDate);
          const end = new Date(targetLeave.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          this.data.users[studentIdx].leaveBalance = Math.max(0, this.data.users[studentIdx].leaveBalance - diffDays);
        }
      }

      this.save();
      return targetLeave;
    }
    return null;
  }

  public getNotifications() {
    return this.data.notifications;
  }

  public addNotification(userId: string, message: string) {
    const not: Notification = {
      id: `not-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(not);
    this.save();
    return not;
  }

  public markNotificationsAsRead(userId: string) {
    this.data.notifications = this.data.notifications.map(n => {
      if (n.userId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.save();
  }

  public getAuditLogs() {
    return this.data.auditLogs;
  }

  public addAuditLog(userId: string, userName: string, role: UserRole, action: string, details: string) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      userName,
      role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log); // newest first
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop(); // Cap history
    }
    this.save();
    return log;
  }

  public getSettings() {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }
}

export const db = new DatabaseManager();
