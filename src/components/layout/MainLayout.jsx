import { Outlet } from 'react-router-dom';
import { useAppStore } from '../../store';
import { cn } from '../../utils/cn';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { user, sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-hidden p-2 md:p-4 lg:p-6 gap-4 lg:gap-6">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm rounded-none"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Island */}
      <div className={cn(
          "fixed inset-y-2 md:inset-y-4 left-2 md:left-4 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:inset-0 lg:translate-x-0 w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
      )}>
        <Sidebar className="h-full w-full rounded-2xl shadow-2xl lg:shadow-xl border border-white/5 bg-slate-900 overflow-hidden" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-1rem)] md:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] overflow-hidden gap-4 lg:gap-6 relative">
        {/* Header Island */}
        <div className="rounded-2xl shadow-xl border border-white/5 overflow-hidden flex-shrink-0 bg-slate-900/80 backdrop-blur-md">
           <Header />
        </div>
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto scroll-smooth rounded-2xl pb-4">
          <div className="w-full mx-auto 3xl:max-w-[1800px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
