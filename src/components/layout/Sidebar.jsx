import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store';
import { cn } from '../../utils/cn';
import { 
  House, 
  UsersThree, 
  ShieldCheck, 
  FileText,
  Calendar,
  Ticket,
  SignIn,
  ClockClockwise
} from '@phosphor-icons/react';

export default function Sidebar({ className }) {
  const { user } = useAppStore();

  const MENU_ITEMS = [
    { path: '/', label: 'หน้าแรก', icon: House, isPublic: true },
    { path: '/ps1', label: 'คำร้องทั่วไป', icon: FileText, isPublic: true },
    { path: '/ps5', label: 'เบิกทิคเก็ต', icon: Ticket, isPublic: true },
    { path: '/cs5', label: 'ตารางเดินสตอรี่', icon: Calendar, isPublic: true },
    
    // Council Only
    { path: '/council_manage', label: 'จัดการสภา', icon: ShieldCheck, isPublic: false, adminOnly: true },
    { path: '/admin/duty_history', label: 'ประวัติรวม (Admin)', icon: ClockClockwise, isPublic: false, adminOnly: true },
    { path: '/cs4', label: 'จัดการแก๊ง/แฟม', icon: UsersThree, isPublic: false },
    { path: '/cs3', label: 'จัดการทิคเก็ต', icon: Ticket, isPublic: false },
    { path: '/cs6', label: 'ระบบเข้าเวรสภา', icon: ClockClockwise, isPublic: false },
  ];

  return (
    <aside className={cn("w-64 bg-slate-900 border-r border-slate-800 flex flex-col", className)}>
      <div className="p-6 border-b border-slate-800 flex items-center justify-center">
        <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          COUNCIL<span className="text-white">V2</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          เมนูหลัก
        </div>
        <ul className="space-y-1">
          {MENU_ITEMS.filter(item => {
            if (item.isPublic) return true;
            if (!user) return false;
            if (item.adminOnly && user.role !== 'admin') return false;
            return true;
          }).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-blue-600/10 text-blue-500" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  )}
                >
                  <Icon size={20} weight="duotone" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
          
          {/* Login Button for Guests */}
          {!user && (
            <li className="pt-4 mt-4 border-t border-slate-800">
              <NavLink
                to="/login"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              >
                <SignIn size={20} weight="duotone" />
                เข้าสู่ระบบ (สำหรับสภา)
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-center text-slate-500">
          © 2026 Council Service
        </div>
      </div>
    </aside>
  );
}
