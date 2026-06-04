import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClassDepartment, Subject, AttendanceSession, LeaveRequest, AttendanceStatus } from '../types';
import { 
  Plus, 
  Layers, 
  QrCode, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  ExternalLink 
} from 'lucide-react';

interface TeacherPanelProps {
  user: any;
}

export default function TeacherPanel({ user }: TeacherPanelProps) {
  const [classes, setClasses] = useState<ClassDepartment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Class session wizard state
  const [wizard, setWizard] = useState({
    classId: '',
    subjectId: '',
    type: 'manual' as any,
    timeSlot: '09:00 AM - 10:30 AM',
    lateThresholdMins: 10,
    gpsLatitude: 37.7749,
    gpsLongitude: -122.4194,
    gpsRadius: 150
  });

  // Current session sheet under moderation
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [sheetDetails, setSheetDetails] = useState<{ session: AttendanceSession; records: any[] } | null>(null);

  // Moderator comment list
  const [comments, setComments] = useState<Record<string, string>>({}); // userId -> comment

  // Leave approval states
  const [moderatingLeave, setModeratingLeave] = useState<LeaveRequest | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);
  const [reasonComment, setReasonComment] = useState('');

  useEffect(() => {
    loadAcademics();
    loadLeaves();
  }, []);

  const loadAcademics = async () => {
    setLoading(true);
    try {
      const [c, s, reportsData] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getReport({}) // Fetch matching records to find active sessions in database
      ]);
      setClasses(c);
      setSubjects(s);

      // Extract unique active sessions created by this teacher
      const allSessions = await api.getReport({}); // Or parse from report endpoints
      // We can also trigger specific custom mock arrays if report list is still compiling
      const sessionsMap = await fetchActiveSessions();
      setActiveSessions(sessionsMap);
    } catch (err) {
      console.error('Error fetching teacher layouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async (): Promise<AttendanceSession[]> => {
    try {
      // In a real DB we fetch from /api/sessions, but we can filter from academic report dates
      const reports = await api.getReport({});
      // return unique session objects
      const uniqueSessions: AttendanceSession[] = [];
      const seenIds = new Set();
      
      reports.records.forEach((rec: any) => {
        if (!seenIds.has(rec.sessionId)) {
          seenIds.add(rec.sessionId);
          if (rec.teacherName.toLowerCase() === user.name.toLowerCase()) {
            uniqueSessions.push({
              id: rec.sessionId,
              classId: 'c-1',
              className: rec.className,
              subjectId: 's-1',
              subjectName: rec.subjectName,
              teacherId: user.id,
              teacherName: rec.teacherName,
              date: rec.date,
              timeSlot: rec.timeSlot,
              type: rec.type.toLowerCase(),
              createdAt: rec.markedAt
            });
          }
        }
      });
      return uniqueSessions;
    } catch {
      return [];
    }
  };

  const loadLeaves = async () => {
    try {
      const allLeaves = await api.getAllLeaves();
      // Filter leaves matching our departments or show all if general manager
      setLeaves(allLeaves);
    } catch (err) {
      console.error('Error load leaves:', err);
    }
  };

  // --- SESSION LAUNCHER ---
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizard.classId || !wizard.subjectId) {
      alert('Must select a specific Department and Subject mapping.');
      return;
    }

    try {
      const res = await api.createSession(wizard);
      alert(`Attendance session launched! Enrolled ${res.studentsCount} students dynamically.`);
      
      // select launched session sheet and open dashboard right away
      handleOpenSheet(res.session.id);
      
      // reload sessions
      const currentSess = await fetchActiveSessions();
      setActiveSessions(currentSess);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- ATTENDANCE SHEET CHECKLISTS ---
  const handleOpenSheet = async (sessId: string) => {
    setActiveSheetId(sessId);
    try {
      const details = await api.getSessionDetails(sessId);
      setSheetDetails(details);
      
      // pre-fill comments
      const comms: Record<string, string> = {};
      details.records.forEach((r: any) => {
        if (r.comment) comms[r.userId] = r.comment;
      });
      setComments(comms);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = (userId: string, status: AttendanceStatus) => {
    if (!sheetDetails) return;
    const updatedRecs = sheetDetails.records.map(r => {
      if (r.userId === userId) {
        return { ...r, status };
      }
      return r;
    });
    setSheetDetails({ ...sheetDetails, records: updatedRecs });
  };

  const handleSaveAttendanceDraft = async () => {
    if (!sheetDetails) return;
    try {
      const payloadRecords = sheetDetails.records.map(r => ({
        userId: r.userId,
        status: r.status,
        comment: comments[r.userId] || ''
      }));

      await api.markAttendance(sheetDetails.session.id, payloadRecords);
      alert('Attendance checklist saved to database ledger successfully!');
      handleOpenSheet(sheetDetails.session.id); // reload
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- LEAVE MODERATIONS ---
  const handleLeaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingLeave || !moderationAction) return;

    if (moderationAction === 'reject' && !reasonComment.trim()) {
      alert('Rejection feedback comment is strictly required.');
      return;
    }

    try {
      if (moderationAction === 'approve') {
        await api.approveLeave(moderatingLeave.id, reasonComment);
      } else {
        await api.rejectLeave(moderatingLeave.id, reasonComment);
      }
      
      alert(`Leave request starting ${moderatingLeave.startDate} has been successfully ${moderationAction}d.`);
      setModeratingLeave(null);
      setModerationAction(null);
      setReasonComment('');
      loadLeaves();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid layouts for launch controls & active lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
        
        {/* SESSION INITIATOR FORM */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm transition-colors space-y-4 font-sans">
          <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-855 pb-3">
            <Plus className="w-4 h-4 text-[#0058be]" />
            <h3 className="text-sm font-semibold text-slate-805 dark:text-slate-100 font-sans">Launch Class Session</h3>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4.5">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Select Department Class</label>
              <select
                required
                value={wizard.classId}
                onChange={(e) => setWizard({ ...wizard, classId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-704 dark:text-slate-200 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] focus:outline-none transition-all"
              >
                <option value="">Choose Class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Select Subject Lesson</label>
              <select
                required
                value={wizard.subjectId}
                onChange={(e) => setWizard({ ...wizard, subjectId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-704 dark:text-slate-200 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] focus:outline-none transition-all"
              >
                <option value="">Choose Subject...</option>
                {subjects.filter(s => !wizard.classId || s.classId === wizard.classId).map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Verification Modality</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'manual', label: 'Manual Check', icon: Layers },
                  { id: 'qr', label: 'QR Scan', icon: QrCode },
                  { id: 'gps', label: 'GPS Fence', icon: MapPin }
                ].map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setWizard({ ...wizard, type: mode.id as any })}
                      className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        wizard.type === mode.id 
                          ? 'border-[#0058be] bg-blue-50/60 text-[#0058be] dark:bg-blue-955/20 dark:border-[#0058be] font-bold' 
                          : 'border-slate-150 dark:border-slate-850 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-950'
                      } cursor-pointer`}
                    >
                      <Icon className="w-4 h-4 text-[#0058be]" />
                      <span className="text-[10px] font-semibold">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If GPS mode selected */}
            {wizard.type === 'gps' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">Fence Coordinates (SF Mock Site)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={wizard.gpsLatitude}
                    onChange={(e) => setWizard({ ...wizard, gpsLatitude: Number(e.target.value) })}
                    placeholder="Lat"
                    className="p-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                  />
                  <input
                    type="number"
                    step="any"
                    value={wizard.gpsLongitude}
                    onChange={(e) => setWizard({ ...wizard, gpsLongitude: Number(e.target.value) })}
                    placeholder="Lon"
                    className="p-1.5 text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Late Limit (Mins)</label>
                <input
                  type="number"
                  min={1}
                  value={wizard.lateThresholdMins}
                  onChange={(e) => setWizard({ ...wizard, lateThresholdMins: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Hour Schedule</label>
                <select
                  value={wizard.timeSlot}
                  onChange={(e) => setWizard({ ...wizard, timeSlot: e.target.value })}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl focus:border-[#0058be] focus:outline-none font-sans"
                >
                  <option>09:00 AM - 10:30 AM</option>
                  <option>11:00 AM - 12:30 PM</option>
                  <option>02:00 PM - 03:30 PM</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0058be] hover:bg-[#2563eb] text-white font-semibold rounded-xl transition-all shadow-sm shadow-[#0058be]/10 cursor-pointer text-center"
            >
              Start Attendance Record Sheet
            </button>
          </form>
        </div>

        {/* ACTIVE LIST SESSIONS */}
        <div className="lg:col-span-2 space-y-6 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm transition-colors">
            <h3 className="text-sm font-semibold text-slate-805 dark:text-slate-105 font-sans border-b border-slate-150 dark:border-slate-850 pb-3 flex items-center justify-between">
              <span>Active Attendance Rosters</span>
              <span className="text-[10px] font-mono uppercase bg-blue-50 dark:bg-blue-950/40 text-[#0058be] px-2 py-0.5 rounded-full font-bold">
                {activeSessions.length} active
              </span>
            </h3>

            {activeSessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <p>No active sessions found for today.</p>
                <p className="text-[10px]">Use the launcher on the left to fire up checks!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {activeSessions.map(sess => (
                  <div 
                    key={sess.id}
                    onClick={() => handleOpenSheet(sess.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative ${
                      activeSheetId === sess.id 
                        ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs' 
                        : 'border-slate-150 dark:border-slate-800 bg-slate-50/40 hover:bg-slate-50 dark:hover:bg-slate-950/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-[9px] font-bold text-blue-600 dark:text-blue-400 rounded-md font-mono uppercase">
                        {sess.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{sess.timeSlot.split(' ')[0]}</span>
                    </div>

                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs mt-2.5">{sess.subjectName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{sess.className}</p>
                    
                    <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-3.5">
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED ATTENDANCE MODERATION GRID SHEET */}
      {activeSheetId && sheetDetails && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs space-y-5 animate-fade-in">
          
          <div className="flex flex-col lg:flex-row justify-between lg:items-center border-b border-slate-100 dark:border-slate-800 pb-5 gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Interactive Sheet Editor</span>
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100">
                {sheetDetails.session.subjectName} — Class Checklist ({sheetDetails.session.date})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Time: {sheetDetails.session.timeSlot} | Style: {sheetDetails.session.type.toUpperCase()}</p>
            </div>

            <div className="flex items-center gap-3">
              {sheetDetails.session.type === 'qr' && (
                <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2.5 bg-slate-50 dark:bg-slate-950 max-w-sm">
                  <div className="w-12 h-12 bg-white p-1 rounded border border-slate-200 inline-block flex justify-center items-center">
                    {/* SVG patterned visual QR code mock representation */}
                    <svg className="w-10 h-10 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="6" height="6" />
                      <rect x="16" y="2" width="6" height="6" />
                      <rect x="2" y="16" width="6" height="6" />
                      <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.1" />
                      <line x1="9" y1="2" x2="13" y2="2" />
                      <line x1="9" y1="6" x2="13" y2="6" />
                      <line x1="22" y1="12" x2="22" y2="15" />
                      <line x1="12" y1="16" x2="12" y2="22" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">Dynamic QR is Live</div>
                    <div className="text-[10px] text-slate-400 font-mono select-all font-semibold text-blue-500 underline">{sheetDetails.session.qrCodeSecret}</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveAttendanceDraft}
                className="py-2.5 px-4 bg-[#0058be] hover:bg-[#2563eb] text-white font-semibold rounded-xl shadow-sm transition-all cursor-pointer font-sans"
              >
                Commit Compliance updates
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5 text-center">Status (Manual Action)</th>
                  <th className="px-5 py-3.5">Checked At</th>
                  <th className="px-5 py-3.5">Location Tracking</th>
                  <th className="px-5 py-3.5">Teacher comment / Late Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {sheetDetails.records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-55/40 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[125px] sm:max-w-[185px]" title={rec.userName}>{rec.userName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[125px] sm:max-w-[185px]" title={rec.userEmail}>{rec.userEmail}</div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-800">
                        {[
                          { id: 'present', label: 'Present', colorClass: 'bg-emerald-500 text-white' },
                          { id: 'late', label: 'Late', colorClass: 'bg-amber-500 text-white' },
                          { id: 'absent', label: 'Absent', colorClass: 'bg-rose-500 text-white' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleStatusChange(rec.userId, st.id as any)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              rec.status === st.id 
                                ? st.colorClass 
                                : 'text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400">
                      {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : '—'}
                    </td>

                    <td className="px-5 py-4">
                      {rec.latitude && rec.longitude ? (
                        <div className="flex flex-col text-[10px]">
                          <span className="font-mono text-slate-500">[{rec.latitude.toFixed(4)}, {rec.longitude.toFixed(4)}]</span>
                          <span className="text-emerald-500 font-semibold">{rec.distanceMetres ? `${rec.distanceMetres.toFixed(0)}m radius` : 'valid inline'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-sans text-[11px]">No GPS tag</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="relative max-w-xs">
                        <MessageSquare className="absolute left-2.5 top-2 ml-0.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={comments[rec.userId] || ''}
                          onChange={(e) => setComments({ ...comments, [rec.userId]: e.target.value })}
                          placeholder="late reason, doctor note..."
                          className="w-full text-[11px] pl-8 pr-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL LEAVES PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display border-b border-slate-100 dark:border-slate-800/60 pb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" /> Leave Authorizations Queue ({leaves.filter(l => l.status === 'pending').length} pending)
        </h3>

        {leaves.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No institutional leave requests logged.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Leave Duration Calendar</th>
                  <th className="px-5 py-3.5">Student Reason Description</th>
                  <th className="px-5 py-3.5">Status Badge</th>
                  <th className="px-5 py-3.5">Teacher comment</th>
                  <th className="px-5 py-3.5 text-right">Moderations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaves.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10 text-slate-600 dark:text-slate-300">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{l.userName}</div>
                      <div className="text-[10px] text-slate-400">{l.userEmail}</div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {l.startDate} <span className="text-slate-300">to</span> {l.endDate}
                    </td>

                    <td className="px-5 py-4 max-w-sm truncate text-slate-500 font-sans" title={l.reason}>
                      {l.reason}
                    </td>

                    <td className="px-5 py-4">
                      {l.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
                          Pending
                        </span>
                      )}
                      {l.status === 'approved' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Approved
                        </span>
                      )}
                      {l.status === 'rejected' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          Rejected
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-400 italic truncate max-w-[120px]" title={l.comment}>
                      {l.comment ? `"${l.comment}"` : '—'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {l.status === 'pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setModeratingLeave(l);
                              setModerationAction('approve');
                              setReasonComment('');
                            }}
                            className="p-1 px-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded cursor-pointer"
                            title="Approve Leave"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setModeratingLeave(l);
                              setModerationAction('reject');
                              setReasonComment('');
                            }}
                            className="p-1 px-1.5 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 rounded cursor-pointer"
                            title="Reject Leave"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Signed by {l.approvedBy || 'Admin'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LEAVE DECISION MODAL APPROVAL / REJECTION */}
      {moderatingLeave && moderationAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 py-6 overflow-y-auto animate-fade-in text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-xl my-auto max-h-[90vh] overflow-y-auto animate-scale-up space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              {moderationAction === 'approve' ? (
                <><CheckCircle className="w-4 h-4 text-emerald-500" /> Approve student leaves requests</>
              ) : (
                <><AlertCircle className="w-4 h-4 text-rose-500" /> Reject student leaves requests</>
              )}
            </h3>

            <div className="space-y-1 text-slate-500 font-sans">
              <p>Student: <strong>{moderatingLeave.userName}</strong></p>
              <p>Duration: {moderatingLeave.startDate} to {moderatingLeave.endDate}</p>
              <p className="italic">Reason: "{moderatingLeave.reason}"</p>
            </div>

            <form onSubmit={handleLeaveAction} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400">
                  {moderationAction === 'reject' ? 'Rejection Feedback (Strictly Required)' : 'Academics Notes Feedback (Optional)'}
                </label>
                <textarea
                  required={moderationAction === 'reject'}
                  value={reasonComment}
                  onChange={(e) => setReasonComment(e.target.value)}
                  placeholder={moderationAction === 'reject' ? 'Provide explicit educational reason for rejection...' : 'Medical note acknowledged. Hope you feel better.'}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModeratingLeave(null);
                    setModerationAction(null);
                    setReasonComment('');
                  }}
                  className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white font-semibold rounded-xl cursor-pointer ${
                    moderationAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-750' : 'bg-rose-600 hover:bg-rose-750'
                  }`}
                >
                  Confirm {moderationAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
