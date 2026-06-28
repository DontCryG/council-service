import { useEffect, Suspense, lazy } from 'react';
// Force rebuild cache bust
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from './core/firebase';
import { useAppStore } from './store';
import { CheckCircle, XCircle, Info, X, BellRinging, Desktop } from '@phosphor-icons/react';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Routes
import { ServiceRoutes } from './routes/ServiceRoutes';
import { CouncilRoutes } from './routes/CouncilRoutes';
import { AdminRoutes } from './routes/AdminRoutes';

// Lazy load public pages
const Portal = lazy(() => import('./features/home/Portal'));
const Home = lazy(() => import('./features/home/Home'));
const Login = lazy(() => import('./features/auth/Login'));
const NotFound = lazy(() => import('./features/error/NotFound'));
const LoanPublic = lazy(() => import('./features/services/LoanPublic'));

function GlobalAlert() {
  const { alerts, hideAlert } = useAppStore();
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      {alerts.map((alert) => {
        const isError = alert.type === 'error';
        const isSuccess = alert.type === 'success';
        const isInfo = alert.type === 'info';

        return (
          <div key={alert.id} className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-xl bg-slate-900/90 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300 ease-out ${
            isError ? 'border-red-500/50 text-red-400 shadow-[0_10px_40px_rgba(239,68,68,0.25)]' :
            isSuccess ? 'border-emerald-500/50 text-emerald-400 shadow-[0_10px_40px_rgba(16,185,129,0.25)]' :
            'border-[#5865F2]/50 text-[#5865F2] shadow-[0_10px_40px_rgba(88,101,242,0.25)]'
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isError ? 'bg-red-500/20' : 
              isSuccess ? 'bg-emerald-500/20' : 
              'bg-[#5865F2]/20'
            }`}>
              {isError && <XCircle size={20} weight="fill" />}
              {isSuccess && <CheckCircle size={20} weight="fill" />}
              {isInfo && <BellRinging size={20} weight="duotone" className="animate-pulse" />}
              {!isError && !isSuccess && !isInfo && <Info size={20} weight="fill" />}
            </div>
            <p className="font-bold text-sm tracking-wide text-white">{alert.message}</p>
            <button onClick={() => hideAlert(alert.id)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity bg-white/5 rounded-full p-1 hover:bg-white/10">
              <X size={14} weight="bold" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function LiveNotifications() {
  const { user, showAlert } = useAppStore();

  useEffect(() => {
    // Only listen for admins
    if (!user || user.role !== 'admin') return;

    // Set listener for documents created AFTER this component mounts
    const startTime = Timestamp.now();
    const q = query(
      collection(db, 'transaction_logs'),
      where('createdAt', '>', startTime)
    );

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return; // Ignore existing documents on first load
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const log = change.doc.data();
          // Don't notify if the admin themselves just triggered it
          if (log.createdBy?.uid === user.uid) return;

          let msg = '';
          switch (log.type) {
            case 'welfare': msg = `🚨 แก๊ง ${log.data.orgName || ''} ยื่นเบิกสวัสดิการใหม่!`; break;
            case 'welfare_trade': msg = `🔄 แก๊ง ${log.data.orgName || ''} แจ้งขอแลกเปลี่ยน!`; break;
            case 'edit_org': msg = `📝 แก๊ง ${log.data.orgName || ''} ขอแก้ไขข้อมูลองค์กร!`; break;
            case 'register_org': msg = `🆕 มีการลงทะเบียนแก๊งใหม่: ${log.data.name || ''}`; break;
            case 'general_service': msg = `⚙️ บริการทั่วไป: ${log.data.groupName || ''} ส่งคำขอเข้ามา!`; break;
            default: msg = `🔔 มีรายการใหม่เข้าสู่ระบบ!`;
          }

          showAlert('info', msg);
        }
      });
    });

    return () => unsubscribe();
  }, [user, showAlert]);

  return null;
}


import LoadingScreen from './components/ui/LoadingScreen';

function App() {
  const { setUser, setCouncilUsername, isAuthLoaded, theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'app_state', 'council_members');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const members = docSnap.data().members || [];
            const member = members.find(m => m.username === firebaseUser.email);
            if (member && member.name) {
              setCouncilUsername(member.name);
              // Attach custom fields
              firebaseUser.role = member.role;
              firebaseUser.customName = member.name;
            }
          }
        } catch (e) {
          console.error("Error fetching council user:", e);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    
    // Global block for non-numeric characters in number inputs
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' && e.target.type === 'number') {
        const isDigit = /^\d$/.test(e.key);
        const isControl = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Enter', 'Escape'].includes(e.key);
        const isAction = e.ctrlKey || e.metaKey;
        
        if (!isDigit && !isControl && !isAction) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setUser]);

  if (!isAuthLoaded) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์การเข้าถึง..." />;
  }

  const initialEntries = window.location.pathname === '/loan_public' 
    ? [window.location.pathname + window.location.search] 
    : ['/'];

  return (
    <div className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30">
      
      {/* Mobile Blocker (Visible only on phones < 768px) */}
      <div className="flex md:hidden flex-col items-center justify-center min-h-[100dvh] p-8 text-center absolute inset-0 z-[10000] overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/30 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <Desktop size={48} className="text-red-500" weight="duotone" />
          </div>
          
          <h1 className="text-4xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600 drop-shadow-lg">
            NOT SUPPORTED
          </h1>
          
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
            ระบบ <strong className="text-white">COUNCIL SERVICE</strong><br/>
            ไม่อนุญาตให้ใช้งานผ่านโทรศัพท์มือถือ<br/><br/>
            กรุณาเข้าใช้งานผ่าน<br/>
            <strong className="text-emerald-400">คอมพิวเตอร์ (PC)</strong> หรือ <strong className="text-emerald-400">iPad</strong><br/>
            เพื่อประสิทธิภาพสูงสุดครับ
          </p>
        </div>
      </div>

      {/* Main App (Visible only on Desktop/Tablet >= 768px) */}
      <div className="hidden md:block min-h-screen w-full">
        <Router initialEntries={initialEntries}>
      <GlobalAlert />
      <LiveNotifications />
      <Suspense fallback={<LoadingScreen message="กำลังโหลดข้อมูล..." />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Portal />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes (Wrapped in MainLayout) */}
          <Route element={<MainLayout />}>
            {/* Public/Unprotected inside MainLayout */}
            <Route path="loan_public" element={<LoanPublic />} />
            <Route path="home" element={<Home />} />
            
            {/* Modular Split Routes */}
            {ServiceRoutes}
            {CouncilRoutes}
            {AdminRoutes}
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
        </Router>
      </div>
    </div>
  );
}

export default App;
