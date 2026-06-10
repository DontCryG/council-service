import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './core/firebase';
import { useAppStore } from './store';
import { CheckCircle, XCircle, Info, X } from '@phosphor-icons/react';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Lazy load pages for ultimate performance
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

function GlobalAlert() {
  const { alert, hideAlert } = useAppStore();
  if (!alert) return null;

  const isError = alert.type === 'error';
  const isSuccess = alert.type === 'success';

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-4">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border bg-slate-900 ${
        isError ? 'border-red-500/50 text-red-400' :
        isSuccess ? 'border-emerald-500/50 text-emerald-400' :
        'border-blue-500/50 text-blue-400'
      }`}>
        {isError && <XCircle size={24} weight="fill" />}
        {isSuccess && <CheckCircle size={24} weight="fill" />}
        {!isError && !isSuccess && <Info size={24} weight="fill" />}
        <p className="font-medium text-sm">{alert.message}</p>
        <button onClick={hideAlert} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
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
  const { setUser, isAuthLoaded } = useAppStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
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
    return () => unsubscribe();
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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes (Wrapped in MainLayout) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            
            {/* Council Only Routes */}
            <Route path="/council_manage" element={<AdminRoute><CouncilManage /></AdminRoute>} />
            <Route path="/admin/duty_history" element={<AdminRoute><AdminDutyHistory /></AdminRoute>} />
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
