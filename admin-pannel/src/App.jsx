import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import BookingManagementPage from './pages/BookingManagementPage'
import BookingStatusTrackerPage from './pages/BookingStatusTrackerPage'
import MessageBoxPage from './pages/MessageBoxPage'
import OverviewPage from './pages/OverviewPage'
import PaymentManagementPage from './pages/PaymentManagementPage'
import SampleTastePage from './pages/SampleTastePage'
import SupportPage from './pages/SupportPage'
import SystemAlertsPage from './pages/SystemAlertsPage'
import VendorManagementPage from './pages/VendorManagementPage'

export default function App() {
  return (
    <BrowserRouter>
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
          <Route path="support" element={<SupportPage />} />
          <Route path="alerts" element={<SystemAlertsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
