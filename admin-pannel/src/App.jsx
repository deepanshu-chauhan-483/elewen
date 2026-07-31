import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from './pages/AdminLoginPage'
import CmsPageLoader from './components/common/CmsPageLoader'

const AdminLayout = lazy(() => import('./components/layout/AdminLayout'))
const BookingManagementPage = lazy(() => import('./pages/BookingManagementPage'))
const BookingStatusTrackerPage = lazy(() => import('./pages/BookingStatusTrackerPage'))
const MessageBoxPage = lazy(() => import('./pages/MessageBoxPage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const PaymentManagementPage = lazy(() => import('./pages/PaymentManagementPage'))
const SampleTastePage = lazy(() => import('./pages/SampleTastePage'))
const SupportPage = lazy(() => import('./pages/SupportPage'))
const ConsultationsPage = lazy(() => import('./pages/ConsultationsPage'))
const SystemAlertsPage = lazy(() => import('./pages/SystemAlertsPage'))
const VendorManagementPage = lazy(() => import('./pages/VendorManagementPage'))

function AdminPageLoader() {
  return <CmsPageLoader label="Loading admin panel" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<AdminPageLoader />}>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="sample-taste" element={<SampleTastePage />} />
            <Route path="bookings" element={<BookingManagementPage />} />
            <Route path="tracker" element={<BookingStatusTrackerPage />} />
            <Route path="vendors" element={<VendorManagementPage />} />
            <Route path="messages" element={<MessageBoxPage />} />
            <Route path="payments" element={<PaymentManagementPage />} />
            <Route path="consultations" element={<ConsultationsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="alerts" element={<SystemAlertsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
