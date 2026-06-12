import { Outlet } from 'react-router-dom';
import { useAppStore } from '../../store';
import { cn } from '../../utils/cn';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { user, sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )} 
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="w-full mx-auto 3xl:max-w-[1800px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
