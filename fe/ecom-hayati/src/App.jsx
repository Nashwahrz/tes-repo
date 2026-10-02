import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import OtpPage from './pages/OtpPage'
import './App.css'

function App() {
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
