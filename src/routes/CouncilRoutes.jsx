import { Route } from 'react-router-dom';
import { lazy } from 'react';
import { AdminRoute, ProtectedRoute } from './RouteGuards';

// Lazy load pages
const CouncilManage = lazy(() => import('../features/council/CouncilManage'));
const GroupManager = lazy(() => import('../features/council/GroupManager'));
const TicketManager = lazy(() => import('../features/tickets/TicketManager'));
const DutySystem = lazy(() => import('../features/council/DutySystem'));
const CouncilLoanHub = lazy(() => import('../features/council/CouncilLoanHub'));
const CouncilLoanView = lazy(() => import('../features/council/CouncilLoanView'));
const CouncilLoanCreate = lazy(() => import('../features/council/CouncilLoanCreate'));
const CouncilLoanEdit = lazy(() => import('../features/council/CouncilLoanEdit'));
const CouncilReceiptView = lazy(() => import('../features/council/CouncilReceiptView'));

export const CouncilRoutes = [
  <Route key="council_manage" path="council_manage" element={<AdminRoute><CouncilManage /></AdminRoute>} />,
  <Route key="cs4" path="cs4" element={<ProtectedRoute><GroupManager /></ProtectedRoute>} />,
  <Route key="cs3" path="cs3" element={<ProtectedRoute><TicketManager /></ProtectedRoute>} />,
  <Route key="cs6" path="cs6" element={<ProtectedRoute><DutySystem /></ProtectedRoute>} />,
  <Route key="council_loan" path="council_loan" element={<ProtectedRoute><CouncilLoanHub /></ProtectedRoute>} />,
  <Route key="council_loan_view" path="council_loan/view/:id" element={<ProtectedRoute><CouncilLoanView /></ProtectedRoute>} />,
  <Route key="council_loan_create" path="council_loan/create" element={<ProtectedRoute><CouncilLoanCreate /></ProtectedRoute>} />,
  <Route key="council_loan_edit" path="council_loan/edit/:id" element={<ProtectedRoute><CouncilLoanEdit /></ProtectedRoute>} />,
  <Route key="council_loan_receipt" path="council_loan/receipt/:txId" element={<ProtectedRoute><CouncilReceiptView /></ProtectedRoute>} />
];
