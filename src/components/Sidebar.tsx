import { 
  Building2, 
  BarChart4, 
  FolderUp, 
  ShieldCheck, 
  GraduationCap, 
  UserSquare, 
  LogOut, 
  ArrowLeftRight,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  user: any;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
  onRoleMockToggle: (targetRole: UserRole) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, currentView, onViewChange, onLogout, onRoleMockToggle, isOpen, onClose }: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Stats', icon: BarChart4, role: ['admin', 'teacher', 'student'] },
    { id: 'reports', label: 'Archive Reports', icon: FolderUp, role: ['admin', 'teacher', 'student'] },
    { id: 'admin', label: 'Admin Workspace', icon: ShieldCheck, role: ['admin'] },
    { id: 'teacher', label: 'Educator Center', icon: GraduationCap, role: ['admin', 'teacher'] },
    { id: 'student', label: 'Student Gate', icon: UserSquare, role: ['student'] }
  ];

  return (
    <>
      {/* Backdrop overlay for mobile drawer */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose} 
      />

      {/* Off-canvas collapsible aside menu */}
      <aside className={`fixed md:sticky top-0 left-0 z-45 md:z-auto w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 flex flex-col hover:shadow-2xl transition-all duration-300 select-none flex-shrink-0 h-screen font-sans transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Brand logo header */}
        <div className="px-6 py-5.5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0058be] text-white flex justify-center items-center font-bold tracking-wider shadow-sm font-display">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-805 dark:text-slate-100 font-display text-sm leading-tight">CHRONOS</span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">Link Portal</span>
            </div>
          </div>

          {/* Close button inside sidebar on mobile screens */}
          <button 
            type="button"
            onClick={onClose}
            className="md:hidden p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            title="Close menu drawer"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
        </div>

      {/* Navigation options list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar">
        <span className="text-[10px] font-mono tracking-widest font-bold text-slate-400 dark:text-slate-500 uppercase px-2 block mb-2">Systems Navigation</span>
        {navItems.map(item => {
          // Check role permissions limits before rendering
          if (!item.role.includes(user.role)) return null;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                if (onClose) onClose();
              }}
              className={`w-full text-xs font-semibold px-4.5 py-3 rounded-xl flex items-center gap-3 transition-all ${
                currentView === item.id 
                  ? 'bg-[#0058be] text-white font-bold shadow-md shadow-blue-500/10 scale-[1.01]' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              } cursor-pointer`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Role Mocking Simulator panel */}
      <div className="p-4 border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold tracking-wider uppercase mb-2.5">
          <ArrowLeftRight className="w-3.5 h-3.5 animate-pulse" />
          <span>Profile Role Simulator</span>
        </div>

        <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed mb-3">
          Surgically swap profiles on the fly to test dashboard role boundaries instantly:
        </p>

        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center">
          {[
            { id: 'admin', label: 'Admin', activeColor: 'bg-purple-50 text-purple-700 border-purple-500 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-500' },
            { id: 'teacher', label: 'Teacher', activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-500' },
            { id: 'student', label: 'Student', activeColor: 'bg-blue-50 text-[#0058be] border-blue-500 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-500' }
          ].map(roleItem => (
            <button
              key={roleItem.id}
              type="button"
              onClick={() => onRoleMockToggle(roleItem.id as UserRole)}
              className={`py-1.5 border rounded-lg hover:border-slate-400 dark:hover:border-slate-500 cursor-pointer text-[9px] transition-all ${
                user.role === roleItem.id 
                  ? roleItem.activeColor
                  : 'border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500'
              }`}
            >
              {roleItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Logout buttons */}
      <div className="p-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between bg-slate-50/20 dark:bg-slate-950/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex justify-center items-center text-xs font-mono font-bold border border-slate-20s dark:border-slate-700">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex flex-col text-[11px] truncate max-w-[110px]">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">{user.name}</span>
            <span className="text-[9px] text-slate-400 truncate">{user.email}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-705 text-slate-505 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-xl transition-all cursor-pointer bg-white dark:bg-slate-900"
          title="Sign Out Account"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  </>
  );
}
