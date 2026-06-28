import { Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load pages
const RegisterOrg = lazy(() => import('../features/services/RegisterOrg'));
const RegisterOrgPreview = lazy(() => import('../features/services/RegisterOrgPreview'));
const GeneralService = lazy(() => import('../features/services/GeneralService'));
const GeneralServicePreview = lazy(() => import('../features/services/GeneralServicePreview'));
const EditOrg = lazy(() => import('../features/services/EditOrg'));
const EditOrgPreview = lazy(() => import('../features/services/EditOrgPreview'));
const Welfare = lazy(() => import('../features/services/Welfare'));
const WelfarePreview = lazy(() => import('../features/services/WelfarePreview'));
const WelfareTrade = lazy(() => import('../features/services/WelfareTrade'));
const WelfareTradePreview = lazy(() => import('../features/services/WelfareTradePreview'));
const TicketStore = lazy(() => import('../features/tickets/TicketStore'));
const StoryCalendar = lazy(() => import('../features/services/StoryCalendar'));

export const ServiceRoutes = [
  <Route key="register_org" path="register_org" element={<RegisterOrg />} />,
  <Route key="register_org_preview" path="register_org_preview" element={<RegisterOrgPreview />} />,
  <Route key="ps1" path="ps1" element={<GeneralService />} />,
  <Route key="general_service_preview" path="general_service_preview" element={<GeneralServicePreview />} />,
  <Route key="edit_org" path="edit_org" element={<EditOrg />} />,
  <Route key="edit_org_preview" path="edit_org_preview" element={<EditOrgPreview />} />,
  <Route key="welfare" path="welfare" element={<Welfare />} />,
  <Route key="welfare_preview" path="welfare_preview" element={<WelfarePreview />} />,
  <Route key="welfare_trade" path="welfare_trade" element={<WelfareTrade />} />,
  <Route key="welfare_trade_preview" path="welfare_trade_preview" element={<WelfareTradePreview />} />,
  <Route key="ps5" path="ps5" element={<TicketStore />} />,
  <Route key="cs5" path="cs5" element={<StoryCalendar />} />
];
