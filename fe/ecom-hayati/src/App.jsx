import { lazy, Suspense } from 'react'
import './App.css'

// Tiap halaman dimuat hanya saat URL-nya dibuka
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const OtpPage = lazy(() => import('./pages/auth/OtpPage'))

function App() {
  return (
    <Suspense fallback={null}>
      <Routes />
    </Suspense>
  )
}

function Routes() {
  const isLoggedIn = !!localStorage.getItem('token')
  const path = window.location.pathname

  if (path.startsWith('/dashboard')) {
    // Dashboard hanya untuk user yang sudah login (BE hanya memberi token jika status aktif)
    if (!isLoggedIn) {
      window.location.replace('/')
      return null
    }
    return <DashboardPage />
  }
  if (path.startsWith('/otp')) {
    return <OtpPage />
  }
  if (path.startsWith('/register')) {
    if (isLoggedIn) {
      window.location.replace('/dashboard')
      return null
    }
    return <RegisterPage />
  }

  if (isLoggedIn) {
    window.location.replace('/dashboard')
    return null
  }

  return <LoginPage />
}

export default App
