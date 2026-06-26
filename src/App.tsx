import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast/ToastProvider'
import { ToastContainer } from './components/Toast/ToastContainer'
import UserLayout from './components/Layouts/UserLayout'
import AdminLayout from './components/Layouts/AdminLayout'
import AuthPage from './pages/auth/AuthPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import HomePage from './pages/user/HomePage'
import ParkingHistoryPage from './pages/user/ParkingHistoryPage'
import MyReservationPage from './pages/user/MyReservationPage'
import VehicleRfidManagementPage from './pages/user/VehicleRfidManagementPage'
import MyProfilePage from './pages/user/MyProfilePage'
import MyPaymentPage from './pages/user/MyPaymentPage'
import AdminPage from './pages/admin/AdminPage'
import AdminRfidPage from './pages/admin/AdminRfidPage'
import AdminParkingHistoryPage from './pages/admin/parking-history/ParkingHistoryPage'
import UserManagementPage from './pages/admin/UserManagementPage'
import VehicleManagementPage from './pages/admin/VehicleManagementPage'
import ReservationManagementPage from './pages/admin/ReservationManagementPage'
import PaymentManagementPage from './pages/admin/PaymentManagementPage'
import RfidRequestManagementPage from './pages/admin/RfidRequestManagementPage'
import AdminScanPage from './pages/admin/AdminScanPage'
import NotFoundPage from './pages/NotFoundPage'
import { useHttpErrorHandler } from './hooks/useHttpErrorHandler'
import { getTokenRole, getHomeByRole } from './utils/auth'

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (token) {
    const role = getTokenRole()
    return <Navigate to={getHomeByRole(role)} replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  const role = getTokenRole()
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  const role = getTokenRole()
  if (role !== 'user') return <Navigate to="/admin" replace />
  return <>{children}</>
}

function AppContent() {
  useHttpErrorHandler()

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <UserRoute>
              <UserLayout />
            </UserRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="parking-history" element={<ParkingHistoryPage />} />
          <Route path="my-reservations" element={<MyReservationPage />} />
          <Route path="book-parking" element={<Navigate to="/" replace />} />
          <Route path="vehicles" element={<VehicleRfidManagementPage />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="payment" element={<MyPaymentPage />} />
        </Route>
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminPage />} />
          <Route path="rfid" element={<AdminRfidPage />} />
          <Route path="parking-history" element={<AdminParkingHistoryPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="vehicles" element={<VehicleManagementPage />} />
          <Route path="reservations" element={<ReservationManagementPage />} />
          <Route path="payments" element={<PaymentManagementPage />} />
          <Route path="rfid-requests" element={<RfidRequestManagementPage />} />
          <Route path="scan" element={<AdminScanPage />} />
        </Route>
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
