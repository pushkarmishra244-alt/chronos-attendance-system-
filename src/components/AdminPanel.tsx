import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassDepartment, Subject, AuditLog } from '../types';
import { 
  Users, 
  Settings, 
  History, 
  UserPlus, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  FileSpreadsheet, 
  MapPin, 
  Sliders, 
  Plus, 
  GraduationCap, 
  BookOpen 
} from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'settings' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassDepartment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Forms states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'student' as any,
    department: 'Computer Science',
    leaveBalance: 8,
    password: ''
  });

  const [csvText, setCsvText] = useState('');
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // Class & Sub forms
  const [newClass, setNewClass] = useState({ name: '', code: '' });
  const [newSub, setNewSub] = useState({ name: '', code: '', classId: '' });

  // Settings state
  const [settings, setSettings] = useState({
    minAttendanceThreshold: 75,
    lateThresholdMins: 10,
    gpsLatitude: 37.7749,
    gpsLongitude: -122.4194,
    gpsRadius: 150
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [u, c, s, l, set] = await Promise.all([
        api.getUsers(),
        api.getClasses(),
        api.getSubjects(),
        api.getAuditLogs(),
        api.getSettings()
      ]);
      setUsers(u);
      setClasses(c);
      setSubjects(s);
      setLogs(l);
      setSettings(set);
    } catch (err) {
      console.error('Error seeding data into admin panel:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- USER HANDLERS ---
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // update
        const updated = await api.updateUser(editingUser.id, userForm);
        setUsers(users.map(u => u.id === editingUser.id ? updated : u));
      } else {
        // create
        const created = await api.createUser(userForm);
        setUsers([...users, created]);
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'student', department: 'Computer Science', leaveBalance: 8, password: '' });
      loadAllData(); // reload log activity
    } catch (err: any) {
      alert(err.message || 'Error occurred handling user metrics.');
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      leaveBalance: u.leaveBalance,
      password: '' // empty means no password change
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user "${name}"? This handles critical cleanups.`)) return;
    try {
      await api.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- CSV BULK HANDLER ---
  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      alert('Please provide valid CSV text rows.');
      return;
    }
    try {
      const res = await api.bulkImport(csvText);
      setCsvResult(res.message);
      setCsvText('');
      loadAllData();
    } catch (err: any) {
      setCsvResult(`Error: ${err.message}`);
    }
  };

  // --- CLASS & SUB HANDLERS ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name || !newClass.code) return;
    try {
      const created = await api.createClass(newClass);
      setClasses([...classes, created]);
      setNewClass({ name: '', code: '' });
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Warning: Deleting a department cleans up all mapped subjects, sessions, and records. Continue?')) return;
    try {
      await api.deleteClass(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.name || !newSub.code || !newSub.classId) return;
    try {
      const created = await api.createSubject(newSub);
      setSubjects([...subjects, created]);
      setNewSub({ name: '', code: '', classId: '' });
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Delete this academic subject?')) return;
    try {
      await api.deleteSubject(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      alert('System-wide compliance and coordinates configuration saved successfully.');
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const SAMPLE_CSV = `name,email,role,department,password
Franklin Drake,franklin.d@attendance.co,student,Computer Science,studentPassword
Grace Hopper,grace.h@attendance.co,student,Computer Science,studentPassword
Charles Babbage,charles.b@attendance.co,student,Computer Science,studentPassword`;

  return (
    <div className="space-y-6">
      {/* Admin tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto select-none font-display">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 hover:text-blue-600 transition-all ${
            activeTab === 'users' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-transparent text-slate-500'
          } whitespace-nowrap cursor-pointer`}
        >
          <Users className="w-4 h-4" /> System Users CRUD
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 hover:text-blue-600 transition-all ${
            activeTab === 'classes' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-transparent text-slate-500'
          } whitespace-nowrap cursor-pointer`}
        >
          <GraduationCap className="w-4 h-4" /> Classes & Subjects
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 hover:text-blue-600 transition-all ${
            activeTab === 'settings' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-transparent text-slate-500'
          } whitespace-nowrap cursor-pointer`}
        >
          <Settings className="w-4 h-4" /> Compliance Rules & GPS Fences
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 border-b-2 hover:text-blue-600 transition-all ${
            activeTab === 'logs' 
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-950/20' 
              : 'border-transparent text-slate-500'
          } whitespace-nowrap cursor-pointer`}
        >
          <History className="w-4 h-4" /> Chronological Security Audit Logs
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Restructured query logs and databases indexing...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* USER TAB CONTENT */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                  <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">User Records List</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Edit or delete institutional user credentials securely.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingUser(null);
                        setUserForm({ name: '', email: '', role: 'student', department: 'Computer Science', leaveBalance: 8, password: 'studentPassword' });
                        setShowUserModal(true);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Register User
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-3">Name</th>
                          <th className="px-6 py-3">Role</th>
                          <th className="px-6 py-3">Department</th>
                          <th className="px-6 py-3 whitespace-nowrap">Leave Balance</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10 text-slate-600 dark:text-slate-300">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[125px] sm:max-w-[190px]" title={u.name}>{u.name}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[125px] sm:max-w-[190px]" title={u.email}>{u.email}</div>
                            </td>
                            <td className="px-6 py-4 capitalize">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                                u.role === 'admin' 
                                  ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 border-purple-100 dark:border-purple-900/30' 
                                  : u.role === 'teacher'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'
                                  : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border-blue-100 dark:border-blue-900/30'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">{u.department}</td>
                            <td className="px-6 py-4 text-center font-mono">{u.leaveBalance} days</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="p-1 px-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 cursor-pointer"
                                  title="Edit User Info"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="p-1 px-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 rounded border border-rose-100 dark:border-rose-900/10 cursor-pointer"
                                  title="Remove User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bulk import tool */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">CSV Bulk Student Import</h3>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Import multiple students dynamically in seconds. Format coordinates listed inside the header block below.
                  </p>

                  <div className="mt-4">
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-400 font-mono mb-2">
                      <span>Header coordinates template</span>
                      <button
                        onClick={() => setCsvText(SAMPLE_CSV)}
                        className="text-blue-500 hover:underline cursor-pointer"
                      >
                        Insert Demo CSV
                      </button>
                    </div>

                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      placeholder={SAMPLE_CSV}
                      rows={6}
                      className="w-full text-xs font-mono p-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 focus:outline-none transition-colors scrollbar"
                    />
                  </div>

                  <button
                    onClick={handleBulkImport}
                    className="w-full text-xs font-semibold py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-sm hover:from-emerald-700 hover:to-emerald-800 transition-all cursor-pointer mt-3"
                  >
                    Deploy CSV Upload
                  </button>

                  {csvResult && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono rounded-xl mt-4 max-h-[150px] overflow-y-auto scrollbar">
                      {csvResult}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CLASSES & ACADEMICS TAB */}
          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              {/* Classes Department Creator */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">Manage Departments / Classes</h3>
                </div>

                <form onSubmit={handleCreateClass} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Class Name</label>
                    <input
                      type="text"
                      value={newClass.name}
                      onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                      placeholder="e.g. Electrical Engineering"
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Code Tag</label>
                    <input
                      type="text"
                      value={newClass.code}
                      onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                      placeholder="e.g. EE-DEPT"
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full text-xs font-semibold py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Class
                  </button>
                </form>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] tracking-wider uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Class/Dept Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {classes.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.name}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{c.code}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteClass(c.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subject Creator Mappings */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">Manage Subjects</h3>
                </div>

                <form onSubmit={handleCreateSubject} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Subject Name</label>
                    <input
                      type="text"
                      value={newSub.name}
                      onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                      placeholder="e.g. Signal Processing"
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Code</label>
                    <input
                      type="text"
                      value={newSub.code}
                      onChange={(e) => setNewSub({ ...newSub, code: e.target.value })}
                      placeholder="CS-202"
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Class Mapping</label>
                    <select
                      value={newSub.classId}
                      onChange={(e) => setNewSub({ ...newSub, classId: e.target.value })}
                      required
                      className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    >
                      <option value="">Select Target Class...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full text-xs font-semibold py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                  >
                    Add Sub
                  </button>
                </form>

                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] tracking-wider uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Subject Name</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Class</th>
                        <th className="px-4 py-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {subjects.map(s => {
                        const targetCls = classes.find(c => c.id === s.classId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-600 dark:text-slate-300">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{s.name}</td>
                            <td className="px-4 py-3 font-mono text-slate-400">{s.code}</td>
                            <td className="px-4 py-3 text-slate-500">{targetCls ? targetCls.name : 'N/A'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteSubject(s.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer p-1 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RULES AND COMPLIANCE CONFIG TAB */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors animate-fade-in space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                <Sliders className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">University Compliance Controls</h3>
              </div>

              <form onSubmit={handleUpdateSettings} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Minimum Required Attendance (% Threshold)</label>
                  <p className="text-[10px] text-slate-400">Triggers alert notifications if attendance falls below this rate.</p>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={settings.minAttendanceThreshold}
                    onChange={(e) => setSettings({ ...settings, minAttendanceThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Late Attendance Threshold (Minutes)</label>
                  <p className="text-[10px] text-slate-400">Lessons starting after these minutes are marked as Late.</p>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.lateThresholdMins}
                    onChange={(e) => setSettings({ ...settings, lateThresholdMins: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-[11px] font-mono tracking-wider uppercase text-slate-400">Class GPS Fencing Zones</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Fencing Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={settings.gpsLatitude}
                        onChange={(e) => setSettings({ ...settings, gpsLatitude: Number(e.target.value) })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Fencing Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={settings.gpsLongitude}
                        onChange={(e) => setSettings({ ...settings, gpsLongitude: Number(e.target.value) })}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Allowed Check-In Radius Radius (Metres)</label>
                    <input
                      type="number"
                      value={settings.gpsRadius}
                      onChange={(e) => setSettings({ ...settings, gpsRadius: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Save Global Threshold Settings
                </button>
              </form>
            </div>
          )}

          {/* AUDIT Tab LOGS */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors animate-fade-in">
              <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 font-display">System Integrity & Audit Trail</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Chronologically records all admin panel operations and user authentications.</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 font-mono text-[10px] tracking-widest text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-3">Timestamp</th>
                      <th className="px-6 py-3">Operator</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Operation Action</th>
                      <th className="px-6 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {logs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10">
                        <td className="px-6 py-3.5 text-slate-450 whitespace-nowrap">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-slate-800 dark:text-slate-100">{l.userName}</td>
                        <td className="px-6 py-3.5 uppercase text-[10px] font-bold text-slate-400">{l.role}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap text-blue-600 dark:text-blue-400">{l.action}</td>
                        <td className="px-6 py-3.5 font-sans text-xs text-slate-500 max-w-sm truncate" title={l.details}>
                          {l.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* USER ADMIN MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs px-4 py-6 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl relative my-auto max-h-[90vh] overflow-y-auto animate-scale-up text-xs">
            <h3 className="text-base font-bold font-display text-slate-800 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              {editingUser ? 'Modify Institutional User Account' : 'Register New Institutional User'}
            </h3>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Alan Turing"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="alan@attendance.co"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">User Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setUserForm({ 
                        ...userForm, 
                        role: newRole as any,
                        leaveBalance: newRole === 'student' ? 8 : 12 
                      });
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    <option value="student">Student/Employee</option>
                    <option value="teacher">Teacher/Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">Department / Class</label>
                  <select
                    value={userForm.department}
                    onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Business Administration">Business Administration</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">Leave Balance (Days)</label>
                  <input
                    type="number"
                    value={userForm.leaveBalance}
                    onChange={(e) => setUserForm({ ...userForm, leaveBalance: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wide uppercase text-slate-400">Password</label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder={editingUser ? '•••••••• (Leave blank to keep same)' : 'studentPassword'}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer font-semibold text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer font-semibold text-center"
                >
                  {editingUser ? 'Save Updates' : 'Deploy User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
