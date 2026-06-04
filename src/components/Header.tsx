import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Notification } from '../types';
import { Bell, CheckSquare, Sun, Moon, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  user: any;
  currentView: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export default function Header({ user, currentView, isDarkMode, onThemeToggle }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [lowAttendanceWarning, setLowAttendanceWarning] = useState(false);

  useEffect(() => {
    loadNotifications();
    checkComplianceWarning();
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error('Error load notifications:', err);
    }
  };

  const checkComplianceWarning = async () => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await api.getReport({ userId: user.id });
      if (res.summary.total > 0 && res.summary.presentRate < 75) {
        setLowAttendanceWarning(true);
      }
    } catch (err) {
      console.error('Error evaluating student metrics:', err);
    }
  };

  const handleReadAll = async () => {
    try {
      await api.readAllNotifications();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setShowDrawer(false);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Format visual path
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Visual Analytics Panel';
      case 'reports': return 'Ledger Logs & Reports';
      case 'admin': return 'Administration Console';
      case 'teacher': return 'Teacher Classroom Console';
      case 'student': return 'Student Portal Panel';
      default: return 'Attendance Management System';
    }
  };

  return (
    <header className="space-y-4 font-display">
      
      {/* Dynamic threshold warnings */}
      {lowAttendanceWarning && (
        <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 text-xs px-4 py-3 rounded-2xl border border-rose-100 dark:border-rose-900/20 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span className="font-semibold text-[11px] sm:text-xs">
              🔒 IMMINENT DROPOUT RISK: Your average presence rate is below the institutional 75% limit. Self-mark current sessions immediately.
            </span>
          </div>
          <button 
            onClick={() => setLowAttendanceWarning(false)} 
            className="text-[10px] uppercase font-mono tracking-wider text-rose-400 hover:text-rose-600 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Header bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4.5 flex justify-between items-center shadow-xs transition-all relative">
        <div>
          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold select-all">
            Institution Location: PORT 3000 DEV GATEWAY
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">
            {getViewTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          
          {/* THEME SWITCHER */}
          <button
            onClick={onThemeToggle}
            className="p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer"
            title={isDarkMode ? 'Switch light coordinates' : 'Switch twilight dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* BELL NOTIFICATIONS TRIGGER */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDrawer(!showDrawer);
                if (!showDrawer) loadNotifications();
              }}
              className="p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-500 dark:text-slate-450 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer relative"
              title="Recent alerts logs"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex justify-center items-center text-[8px] font-bold text-white font-mono animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION FLUTTER DRAWER */}
            {showDrawer && (
              <div className="absolute right-0 mt-3.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-80 shadow-2xl overflow-hidden animate-scale-up text-xs font-sans">
                <div className="px-5 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-805">Activities Inbox</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleReadAll}
                      className="text-[10px] font-mono text-blue-500 hover:underline cursor-pointer font-semibold uppercase"
                    >
                      Sweep All
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Notifications mailbox is swept. Let's start!
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 leading-relaxed transition-colors ${
                          n.isRead ? 'bg-white opacity-80' : 'bg-blue-50/20 dark:bg-blue-950/10'
                        }`}
                      >
                        <p className="text-slate-650 dark:text-slate-300 font-sans">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-2 block">
                          {new Date(n.createdAt).toLocaleTimeString()} · {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QUICK INITIAL USER DISCOVERY AVATAR */}
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex justify-center items-center font-bold text-xs shadow-md shadow-blue-500/10 font-mono uppercase">
              {user.name.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
              <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">{user.role} badge</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
