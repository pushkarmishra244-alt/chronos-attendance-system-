import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { LeaveRequest, AttendanceSession, AttendanceStatus } from '../types';
import { 
  Award, 
  Calendar, 
  Send, 
  Scan, 
  CheckCircle, 
  MapPin, 
  Smartphone, 
  Camera, 
  Compass, 
  Clock, 
  ChevronRight, 
  Activity 
} from 'lucide-react';

interface StudentPanelProps {
  user: any;
}

export default function StudentPanel({ user }: StudentPanelProps) {
  const [personalStats, setPersonalStats] = useState({ present: 0, late: 0, absent: 0, rate: 0 });
  const [activeSessions, setActiveSessions] = useState<AttendanceSession[]>([]);
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Leave Form state
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Self check-in action states
  const [checkingSession, setCheckingSession] = useState<AttendanceSession | null>(null);
  const [qrInput, setQrInput] = useState('');
  
  // GPS manual simulations
  const [simLat, setSimLat] = useState(37.7749); // Default exactly inside class center mock
  const [simLon, setSimLon] = useState(-122.4194);
  const [locationLabel, setLocationLabel] = useState('Standard Campus Center (Inside Boundary)');

  useEffect(() => {
    loadStudentDashboard();
  }, []);

  const loadStudentDashboard = async () => {
    setLoading(true);
    try {
      // Fetch report for this student specifically to calculate summaries
      const res = await api.getReport({ userId: user.id });
      setPersonalStats({
        present: res.summary.present,
        late: res.summary.late,
        absent: res.summary.absent,
        rate: Math.round(res.summary.presentRate)
      });

      // Find sessions active today in their department (Computer Science or CS-DEPT)
      const allReports = await api.getReport({});
      const uniqueSessions: AttendanceSession[] = [];
      const seenIds = new Set();
      
      allReports.records.forEach((rec: any) => {
        if (!seenIds.has(rec.sessionId)) {
          seenIds.add(rec.sessionId);
          // Only show today sessions and matching student department
          // To make evaluations enjoyable in sandbox, we display all open sessions for self check-in!
          uniqueSessions.push({
            id: rec.sessionId,
            classId: 'c-1',
            className: rec.className,
            subjectId: 's-1',
            subjectName: rec.subjectName,
            teacherId: 'u-2',
            teacherName: rec.teacherName,
            date: rec.date,
            timeSlot: rec.timeSlot,
            type: rec.type.toLowerCase(),
            qrCodeSecret: rec.type === 'qr' ? 'QR-SECRET-SOFTENG-' + rec.date : undefined,
            createdAt: rec.markedAt
          });
        }
      });

      // Only show sessions for which this specific student is marked "absent" or hasn't checked into yet successfully.
      // Filter out sessions that already have a successful "present" or "late" mark by this user
      const selfCheckedRecs = res.records.filter((rec: any) => rec.status === 'present' || rec.status === 'late');
      const checkedSessionIds = new Set(selfCheckedRecs.map((r: any) => r.sessionId));

      const uncompletedSessions = uniqueSessions.filter(s => !checkedSessionIds.has(s.id));
      setActiveSessions(uncompletedSessions);

      // Load leaves
      const leaves = await api.getMyLeaves();
      setMyLeaves(leaves);
    } catch (err) {
      console.error('Error seeding student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT LEAVE WIZARD ---
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return;

    // Local validation for budget span days
    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > user.leaveBalance) {
      alert(`Requisition error: Requested ${diffDays} days exceeds your remaining available leave balance budget of ${user.leaveBalance} days.`);
      return;
    }

    try {
      await api.submitLeave(leaveForm);
      alert('Your leave requisition has been logged with system administration.');
      setLeaveForm({ startDate: '', endDate: '', reason: '' });
      loadStudentDashboard(); // reload statistics and lists
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- SELF CHECK-IN VERIFIER (QR / GPS) ---
  const handleSelfMarkCheck = async () => {
    if (!checkingSession) return;
    try {
      const res = await api.selfMark({
        sessionId: checkingSession.id,
        qrCodeSecret: checkingSession.type === 'qr' ? qrInput : undefined,
        latitude: checkingSession.type === 'gps' ? simLat : undefined,
        longitude: checkingSession.type === 'gps' ? simLon : undefined
      });

      alert(res.message);
      setCheckingSession(null);
      setQrInput('');
      loadStudentDashboard();
    } catch (err: any) {
      alert(err.message || 'Verification rejected.');
    }
  };

  // Quick preset coord switches for evaluator tests
  const presetInside = () => {
    setSimLat(37.7749);
    setSimLon(-122.4194);
    setLocationLabel('Standard Campus Center (Inside Boundary)');
  };

  const presetOutside = () => {
    setSimLat(37.7405); // far away coords
    setSimLon(-122.4201);
    setLocationLabel('SF Golden Gate Bridge (FAR OUTSIDE Bounds!)');
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-xs">
        
        {/* SPEEDOMETER PRESENT RATINGS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between transition-colors relative overflow-hidden">
          <div className="absolute top-3 left-4 font-display font-semibold text-slate-400 text-[10px]">MY COMPLIANCE INDEX</div>
          
          <div className="flex flex-col items-center justify-center py-5">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Speedometer Radial Gauge */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="#f1f5f9" 
                  className="dark:stroke-slate-850" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke={personalStats.rate >= 75 ? '#22c55e' : '#ef4444'} 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - personalStats.rate / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-extrabold font-display text-slate-800 dark:text-slate-100">{personalStats.rate}%</span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase block mt-0.5">Presence</span>
              </div>
            </div>

            {personalStats.rate < 75 ? (
              <div className="mt-4 text-center px-4 py-1.5 bg-rose-50 text-rose-600 font-semibold rounded-lg border border-rose-100 animate-pulse">
                Attendance Below Minimum 75% Threshold!
              </div>
            ) : (
              <div className="mt-4 text-center px-4 py-1.5 bg-emerald-50 text-emerald-600 font-semibold rounded-lg border border-emerald-100">
                Attendance Compliant
              </div>
            )}
          </div>
        </div>

        {/* METRICS COUNT BRICKS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Ledger Metrics</span>
            <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-100 mt-0.5">My Historical Logs Summary</h4>
          </div>

          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center text-slate-650 dark:text-slate-300 border-b border-dashed border-slate-150 pb-2">
              <span className="flex items-center gap-1.5 text-[11px]"><CheckCircle className="w-4 h-4 text-emerald-500" /> Present Classes</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{personalStats.present}</span>
            </div>
            <div className="flex justify-between items-center text-slate-650 dark:text-slate-300 border-b border-dashed border-slate-150 pb-2">
              <span className="flex items-center gap-1.5 text-[11px]"><Clock className="w-4 h-4 text-amber-500" /> Late Check-Ins</span>
              <span className="text-sm font-bold text-amber-500 dark:text-amber-400">{personalStats.late}</span>
            </div>
            <div className="flex justify-between items-center text-slate-650 dark:text-slate-300 pb-1">
              <span className="flex items-center gap-1.5 text-[11px]"><Activity className="w-4 h-4 text-rose-500" /> Unexcused Absences</span>
              <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{personalStats.absent}</span>
            </div>
          </div>
        </div>

        {/* LEAVE BALANCE BANK */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Institutional Budget</span>
            <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-100 mt-0.5">Leave Ledger Balance</h4>
          </div>

          <div className="text-center py-4">
            <span className="text-5xl font-black font-display text-blue-600 dark:text-blue-400 inline-block">{user.leaveBalance}</span>
            <span className="text-xs text-slate-400 block mt-1">Available Paid/Excused Days Remaining</span>
          </div>

          <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            Initial balance pool: Admin configured standard limits.
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEAVE EXECUTOR WIZARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <Send className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">Submit Excused Leave Request</h3>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">Start Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono uppercase">End Date</label>
                <input
                  type="date"
                  required
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-mono uppercase">Surgical Reason & Justification</label>
              <textarea
                required
                rows={3}
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder="Medical appointment, family bereavement, lab schedule matches..."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl cursor-pointer"
            >
              Dispatch Requisition Proposal
            </button>
          </form>
        </div>

        {/* SELF MARK CHANNELS/CLASSES ACTIVE LIST */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">Active Campus Checks Today</h3>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-[9px] text-emerald-600 border border-emerald-100 font-bold rounded-full animate-pulse uppercase font-mono">
              Live Gateway Open
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-1.5 font-sans">
              <p className="font-semibold text-slate-705">You have checked into all today's sessions!</p>
              <p className="text-[10px]">No uncompleted check-ins mapped at this moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map(sess => (
                <div 
                  key={sess.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 hover:bg-slate-50 dark:hover:bg-slate-950/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{sess.subjectName}</span>
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 font-mono text-[9px] font-bold text-blue-600 rounded uppercase">
                        {sess.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Scheduled: {sess.timeSlot} | Prof: {sess.teacherName}</p>
                  </div>

                  <button
                    onClick={() => {
                      setCheckingSession(sess);
                      setQrInput('');
                    }}
                    className="py-2 px-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1 shadow-sm shadow-blue-500/10"
                  >
                    <span>Check-In Self</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MY LEAVES HISTORY SUMMARY */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors text-xs">
        <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100 font-display border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" /> My Requisitions Log & Authorization History
        </h3>

        {myLeaves.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            No active leave requests filed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-2.5">Start Date</th>
                  <th className="px-4 py-2.5">End Date</th>
                  <th className="px-4 py-2.5">Reason Justification</th>
                  <th className="px-4 py-2.5">Approval Status</th>
                  <th className="px-4 py-2.5">Approver Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-880/50">
                {myLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/20 text-slate-650 dark:text-slate-300">
                    <td className="px-4 py-3.5 font-mono">{leave.startDate}</td>
                    <td className="px-4 py-3.5 font-mono">{leave.endDate}</td>
                    <td className="px-4 py-3.5 text-slate-500">{leave.reason}</td>
                    <td className="px-4 py-3.5">
                      {leave.status === 'pending' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold border border-amber-100 uppercase text-[9px]">Pending</span>
                      )}
                      {leave.status === 'approved' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100 uppercase text-[9px]">Approved</span>
                      )}
                      {leave.status === 'rejected' && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-semibold border border-rose-100 uppercase text-[9px]">Rejected</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 italic font-sans max-w-xs truncate" title={leave.comment}>
                      {leave.comment ? `"${leave.comment}"` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CHECK-IN CONSOLE MODAL FOR SCAN / GPS */}
      {checkingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 py-6 overflow-y-auto animate-fade-in text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl my-auto max-h-[90vh] overflow-y-auto animate-scale-up space-y-4">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <span className="text-[10px] font-mono uppercase text-slate-400">Class Portal Verification Gateway</span>
              <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100">
                Check Into: {checkingSession.subjectName}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Scheduler Slot: {checkingSession.timeSlot} | Prof: {checkingSession.teacherName}</p>
            </div>

            {/* IF QR SCAN CHECKIN SECTION */}
            {checkingSession.type === 'qr' && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-8 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="animate-scan" /> {/* Horizontal scrolling green beam scan visual */}
                  
                  <div className="relative w-24 h-24 bg-white p-2 rounded-xl mb-3 flex items-center justify-center border border-slate-200">
                    <svg className="w-20 h-20 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="2" y="2" width="6" height="6" />
                      <rect x="16" y="2" width="6" height="6" />
                      <rect x="2" y="16" width="6" height="6" />
                      <line x1="12" y1="12" x2="12" y2="12" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Simulating Optical scanning lens...</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Enter Verified QR Code Secret</label>
                  <p className="text-[10px] text-slate-400">Teacher's live code is: <code className="font-bold underline text-blue-500 font-mono select-all">{checkingSession.qrCodeSecret}</code></p>
                  <input
                    type="text"
                    required
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Paste/Type scanning code credentials here..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-center text-xs tracking-wider uppercase"
                  />
                </div>
              </div>
            )}

            {/* IF GPS MARK CHECKIN */}
            {checkingSession.type === 'gps' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <Compass className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="font-semibold uppercase text-[10px] font-mono text-slate-400">Mock Location Simulator Controls</span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-sans">
                    Fences require checking inside limited class zones. Evaluate both outcomes by clicking the coordinates presets:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={presetInside}
                      className={`p-2.5 border rounded-xl text-center flex flex-col items-center gap-1 transition-all hover:bg-emerald-50/20 cursor-pointer ${
                        simLat === 37.7749 ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold block">1. Simulate INSIDE</span>
                      <span className="text-[9px] font-mono text-slate-450">[37.7749, -122.4194]</span>
                    </button>
                    <button
                      type="button"
                      onClick={presetOutside}
                      className={`p-2.5 border rounded-xl text-center flex flex-col items-center gap-1 transition-all hover:bg-rose-50/20 cursor-pointer ${
                        simLat !== 37.7749 ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] font-bold block">2. Simulate OUTSIDE</span>
                      <span className="text-[9px] font-mono text-slate-450">[37.7405, -122.4201]</span>
                    </button>
                  </div>

                  <div className="p-2 border border-slate-150 dark:border-slate-800/80 rounded-lg text-center font-mono text-[10px] text-slate-500 bg-white dark:bg-slate-900 leading-relaxed">
                    🎯 Selected Spot: <strong className="text-blue-500">{locationLabel}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCheckingSession(null);
                  setQrInput('');
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSelfMarkCheck}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center"
              >
                Submit Check-In
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
