import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" style={{ padding: 32, textAlign: 'center' }}>
        <h2>Terjadi kesalahan</h2>
        <p>Halaman tidak dapat ditampilkan. Muat ulang halaman untuk mencoba lagi.</p>
        <button type="button" onClick={() => window.location.reload()}>Muat ulang</button>
      </div>
    )
  }
}

export default ErrorBoundary
