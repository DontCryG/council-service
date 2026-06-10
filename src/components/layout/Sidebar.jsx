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

  const MENU_CATEGORIES = [
    {
      title: 'บริการทั่วไป',
      items: [
        { path: '/home', label: 'หน้าแรก', icon: House, isPublic: true },
        { path: '/ps1', label: 'คำร้องทั่วไป', icon: FileText, isPublic: true },
        { path: '/ps5', label: 'เบิกทิคเก็ต', icon: Ticket, isPublic: true },
        { path: '/cs5', label: 'ตารางเดินสตอรี่', icon: Calendar, isPublic: true },
      ]
    },
    {
      title: 'สำหรับเจ้าหน้าที่สภา',
      items: [
        { path: '/cs6', label: 'ระบบเข้าเวรสภา', icon: ClockClockwise, isPublic: false },
        { path: '/cs4', label: 'ระบบจัดการ GANG/FAMILY', icon: UsersThree, isPublic: false },
        { path: '/cs3', label: 'จัดการทิคเก็ต', icon: Ticket, isPublic: false },
      ]
    },
    {
      title: 'จัดการระบบ (Admin)',
      items: [
        { path: '/council_manage', label: 'จัดการสภา', icon: ShieldCheck, isPublic: false, adminOnly: true },
        { path: '/admin/duty_history', label: 'ประวัติรวม (Admin)', icon: ClockClockwise, isPublic: false, adminOnly: true },
      ]
    }
  ];

  return (
    <aside className={cn("w-64 bg-slate-900 border-r border-slate-800 flex flex-col", className)}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-center">
          <img src="/logo.png" alt="COUNCIL SYSTEM" className="h-20 object-contain drop-shadow-md" />
        </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {MENU_CATEGORIES.map((category, idx) => {
          const visibleItems = category.items.filter(item => {
            if (item.isPublic) return true;
            if (!user) return false;
            if (item.adminOnly && user.role !== 'admin') return false;
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="mb-6 animate-fade-in-up opacity-0" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                {category.title}
              </div>
              <ul className="space-y-1">
                {visibleItems.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${(idx * 100) + (itemIdx * 50) + 100}ms` }}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 group",
                          isActive 
                            ? "bg-blue-600/15 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/20" 
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                        )}
                      >
                        <Icon size={20} weight="duotone" className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300" />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        
        <ul className="space-y-1">
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
        <div className="text-xs text-center text-slate-500 tracking-widest font-mono">
          &copy; {new Date().getFullYear()} THE COUNCIL OFFICE
        </div>
      </div>
    </aside>
  );
}
