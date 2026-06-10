import { useAppStore } from '../../store';
import { auth } from '../../core/firebase';
import { signOut } from 'firebase/auth';
import { SignOut, User, List } from '@phosphor-icons/react';
import Button from '../ui/Button';

export default function Header() {
  const { user, councilUsername, toggleSidebar } = useAppStore();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
    localStorage.removeItem('council_user');
    useAppStore.getState().setUser(null);
  };

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <List size={24} />
        </button>
        <h2 className="text-lg font-semibold text-white hidden sm:block">Dashboard</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
            <User size={18} weight="bold" />
          </div>
          <span className="text-sm font-medium text-slate-300">
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
