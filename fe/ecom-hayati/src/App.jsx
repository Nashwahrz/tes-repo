import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { MENU_PATHS } from './pages/dashboard/menuPaths'
import Loading from './pages/dashboard/components/Loading'
import ErrorBoundary from './ErrorBoundary'
import './App.css'

// Tiap halaman dimuat hanya saat URL-nya dibuka
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const OtpPage = lazy(() => import('./pages/auth/OtpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))

const isLoggedIn = () => !!localStorage.getItem('token')

function RequireAuth() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/" replace />
}

function GuestOnly() {
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Outlet />
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ padding: 24 }}><Loading rows={3} /></div>}>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lupa-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/otp" element={<OtpPage />} />
          {/* DashboardPage tetap terpasang saat pindah menu */}
          <Route element={<RequireAuth />}>
            <Route element={<DashboardPage />}>
              {Object.values(MENU_PATHS).map((path) => <Route key={path} path={path} />)}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
