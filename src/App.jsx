import { useEffect, Suspense, lazy } from 'react';
import { MemoryRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from './core/firebase';
import { useAppStore } from './store';
import { CheckCircle, XCircle, Info, X, BellRinging } from '@phosphor-icons/react';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Lazy load pages for ultimate performance
const Portal = lazy(() => import('./features/home/Portal'));
const Home = lazy(() => import('./features/home/Home'));
const Login = lazy(() => import('./features/auth/Login'));
const NotFound = lazy(() => import('./features/error/NotFound'));
const CouncilManage = lazy(() => import('./features/council/CouncilManage'));
const GeneralService = lazy(() => import('./features/services/GeneralService'));
const Welfare = lazy(() => import('./features/services/Welfare'));
const WelfareTrade = lazy(() => import('./features/services/WelfareTrade'));
const RegisterOrg = lazy(() => import('./features/services/RegisterOrg'));
const EditOrg = lazy(() => import('./features/services/EditOrg'));
const GroupManager = lazy(() => import('./features/council/GroupManager'));
const TicketManager = lazy(() => import('./features/tickets/TicketManager'));
const TicketStore = lazy(() => import('./features/tickets/TicketStore'));
const StoryCalendar = lazy(() => import('./features/services/StoryCalendar'));
const DutySystem = lazy(() => import('./features/council/DutySystem'));
const AdminDutyHistory = lazy(() => import('./features/council/AdminDutyHistory'));
const TransactionHistory = lazy(() => import('./features/admin/TransactionHistory'));

function GlobalAlert() {
  const { alert, hideAlert } = useAppStore();
  if (!alert) return null;

  const isError = alert.type === 'error';
  const isSuccess = alert.type === 'success';
  const isInfo = alert.type === 'info';

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border bg-slate-900 ${
        isError ? 'border-red-500/50 text-red-400' :
        isSuccess ? 'border-emerald-500/50 text-emerald-400' :
        'border-blue-500/50 text-blue-400'
      }`}>
        {isError && <XCircle size={24} weight="fill" />}
        {isSuccess && <CheckCircle size={24} weight="fill" />}
        {isInfo && <BellRinging size={24} weight="duotone" className="text-blue-400 animate-pulse" />}
        {!isError && !isSuccess && !isInfo && <Info size={24} weight="fill" />}
        <p className="font-medium text-sm">{alert.message}</p>
        <button onClick={hideAlert} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
          <X size={16} weight="bold" />
        </button>
      </div>
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

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

function ProtectedRoute({ children }) {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, showAlert } = useAppStore();
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showAlert('error', 'ไม่มีสิทธิ์เข้าถึง: เฉพาะระดับ Admin เท่านั้น');
    }
  }, [user, showAlert]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { setUser, setCouncilUsername, isAuthLoaded } = useAppStore();

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
            }
          }
        } catch (e) {
          console.error("Error fetching council user:", e);
        }
        setUser(firebaseUser);
      } else {
        const localUserStr = localStorage.getItem('council_user');
        if (localUserStr) {
          try {
            setUser(JSON.parse(localUserStr));
          } catch(e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <GlobalAlert />
      <LiveNotifications />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Portal />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes (Wrapped in MainLayout) */}
          <Route element={<MainLayout />}>
            <Route path="home" element={<Home />} />
            
            {/* Council Only Routes */}
            <Route path="/council_manage" element={<AdminRoute><CouncilManage /></AdminRoute>} />
            <Route path="/admin/duty_history" element={<AdminRoute><AdminDutyHistory /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><TransactionHistory /></AdminRoute>} />
            <Route path="cs4" element={<ProtectedRoute><GroupManager /></ProtectedRoute>} />
            <Route path="cs3" element={<ProtectedRoute><TicketManager /></ProtectedRoute>} />

            {/* Map the service id from models.js to this component for all basic general services */}
            <Route path="register_org" element={<RegisterOrg />} />
            <Route path="ps1" element={<GeneralService />} />
            <Route path="edit_org" element={<EditOrg />} />
            
            <Route path="welfare" element={<Welfare />} />
            <Route path="welfare_trade" element={<WelfareTrade />} />
            <Route path="ps5" element={<TicketStore />} />
            
            <Route path="cs5" element={<StoryCalendar />} />
            <Route path="cs6" element={<ProtectedRoute><DutySystem /></ProtectedRoute>} />
            {/* We will add more routes here later */}
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
