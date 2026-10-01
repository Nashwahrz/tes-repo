import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
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

  if (isLoggedIn) {
    window.location.replace('/dashboard')
    return null
  }

  return <LoginPage />
}

export default App
