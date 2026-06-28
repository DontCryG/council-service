import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { AdminRoute, ProtectedRoute } from './RouteGuards';

const AdminDutyHistory = lazy(() => import('../features/council/AdminDutyHistory'));
const TransactionHistory = lazy(() => import('../features/admin/TransactionHistory'));

export const AdminRoutes = [
  <Route key="duty_history" path="admin/duty_history" element={<AdminRoute><AdminDutyHistory /></AdminRoute>} />,
  <Route key="transactions" path="transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
];
