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
}

export default function Sidebar({ user, currentView, onViewChange, onLogout, onRoleMockToggle }: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Stats', icon: BarChart4, role: ['admin', 'teacher', 'student'] },
    { id: 'reports', label: 'Archive Reports', icon: FolderUp, role: ['admin', 'teacher', 'student'] },
    { id: 'admin', label: 'Admin Workspace', icon: ShieldCheck, role: ['admin'] },
    { id: 'teacher', label: 'Educator Center', icon: GraduationCap, role: ['admin', 'teacher'] },
    { id: 'student', label: 'Student Gate', icon: UserSquare, role: ['student'] }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col hover:shadow-2xl transition-all duration-300 select-none flex-shrink-0 h-screen font-display">
      
      {/* Brand logo header */}
      <div className="px-6 py-5.5 border-b border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex justify-center items-center font-bold tracking-wider shadow-lg shadow-blue-500/20 font-display">
          A
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-white font-display text-sm leading-tight">CHRONOS</span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#94a3b8] font-bold">Attendance v2.0</span>
        </div>
      </div>

      {/* Navigation options list */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar">
        <span className="text-[10px] font-mono tracking-widest font-bold text-[#475569] uppercase px-2 block mb-2">Systems Navigation</span>
        {navItems.map(item => {
          // Check role permissions limits before rendering
          if (!item.role.includes(user.role)) return null;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full text-xs font-semibold px-4.5 py-3 rounded-xl flex items-center gap-3 transition-all ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/10 scale-[1.02]' 
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              } cursor-pointer`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Role Mocking Simulator panel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
        <div className="flex items-center gap-1.5 text-[10px] text-[#475569] font-mono font-bold tracking-wider uppercase mb-2.5">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Profile Role Simulator</span>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
          Surgically swap profiles on the fly to test dashboard role boundaries instantly:
        </p>

        <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center">
          {[
            { id: 'admin', label: 'Admin', activeColor: 'bg-purple-600/20 text-purple-400 border-purple-500' },
            { id: 'teacher', label: 'Teacher', activeColor: 'bg-emerald-600/20 text-emerald-400 border-emerald-500' },
            { id: 'student', label: 'Student', activeColor: 'bg-blue-600/20 text-blue-400 border-blue-500' }
          ].map(roleItem => (
            <button
              key={roleItem.id}
              type="button"
              onClick={() => onRoleMockToggle(roleItem.id as UserRole)}
              className={`py-1.5 border rounded-lg hover:border-slate-500 cursor-pointer text-[9px] ${
                user.role === roleItem.id 
                  ? roleItem.activeColor
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              {roleItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Logout buttons */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-800 text-white flex justify-center items-center text-xs font-mono font-bold">
            {user.name.slice(0, 1)}
          </div>
          <div className="flex flex-col text-[11px] truncate max-w-[110px]">
            <span className="font-semibold text-slate-200 truncate leading-tight">{user.name}</span>
            <span className="text-[9px] text-slate-500 truncate">{user.email}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 border border-slate-800 hover:border-slate-600 text-slate-400 hover:text-rose-500 rounded-xl transition-all cursor-pointer"
          title="Sign Out Account"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
}
