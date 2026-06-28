import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

export function ProtectedRoute({ children }) {
  const { user } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { user, showAlert } = useAppStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showAlert('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/home');
    }
  }, [user, navigate, showAlert]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return null;
  
  return children;
}
