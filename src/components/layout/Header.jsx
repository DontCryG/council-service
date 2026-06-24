import { useAppStore } from '../../store';
import { auth } from '../../core/firebase';
import { signOut } from 'firebase/auth';
import { SignOut, User, List, Sun, Moon } from '@phosphor-icons/react';
import Button from '../ui/Button';

export default function Header() {
  const { user, councilUsername, toggleSidebar, theme, setTheme } = useAppStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
    localStorage.removeItem('council_user');
    useAppStore.getState().setUser(null);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 relative z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <List size={24} />
        </button>
        <h2 className="text-lg font-semibold text-white hidden sm:block">Dashboard</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">

        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">System Online</span>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
            <User size={18} weight="bold" />
          </div>
          <span className="text-sm font-medium text-slate-300 hidden sm:block">
            {user ? (councilUsername || user.councilUsername || user.displayName || (user.email?.includes('@') ? user.email.split('@')[0] : user.email) || 'User') : 'Guest'}
          </span>
        </div>
        
        {user && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            title="ออกจากระบบ"
            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <SignOut size={20} weight="bold" />
          </Button>
        )}
      </div>
    </header>
  );
}
