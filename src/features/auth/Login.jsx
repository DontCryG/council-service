import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { auth, db } from '../../core/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { LockKey, EnvelopeSimple, User, ArrowLeft } from '@phosphor-icons/react';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { user, isAuthLoaded, setUser } = useAppStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to home
  if (isAuthLoaded && user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('กรุณากรอกชื่อผู้ใช้งานหรืออีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // 1. Try to login with Council Member username & password
      const docRef = doc(db, 'app_state', 'council_members');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const members = docSnap.data().members || [];
        const member = members.find(m => m.username === email && m.password === password);
        if (member) {
          const localUser = {
            uid: member.id,
            email: member.username, // spoof email to keep UI working
            displayName: member.name,
            role: member.role,
            isCustomAuth: true
          };
          localStorage.setItem('council_user', JSON.stringify(localUser));
          setUser(localUser);
          navigate('/');
          return;
        }
      }

      // 2. Fallback to Firebase Email/Password
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Back to Home Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 transition-colors font-medium z-20 bg-slate-900/50 p-2 pr-4 rounded-full backdrop-blur-md border border-slate-700/50"
      >
        <div className="bg-slate-800 p-1.5 rounded-full">
          <ArrowLeft size={16} weight="bold" />
        </div>
        กลับหน้าหลัก
      </button>

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="COUNCIL SYSTEM" className="h-28 object-contain drop-shadow-lg mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">เข้าสู่ระบบ</h1>
          <p className="text-slate-400 text-sm">เข้าสู่ระบบจัดการข้อมูลสภา COUNCIL SYSTEM</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <User size={20} className="absolute left-3 top-9 text-slate-400" />
            <Input 
              label="Email"
              type="text"
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          
          <div className="relative">
            <LockKey size={20} className="absolute left-3 top-9 text-slate-400" />
            <Input 
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 text-base mt-2" 
            isLoading={loading}
          >
            เข้าสู่ระบบ
          </Button>
        </form>
      </div>
    </div>
  );
}
