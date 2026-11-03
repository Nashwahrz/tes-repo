import { Component } from 'react'

class ErrorBoundary extends Component {
  state = { failed: false, error: null }

  static getDerivedStateFromError(error) {
    return { failed: true, error }
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
        {import.meta.env.DEV && (
          <pre style={{ marginTop: 24, padding: 12, textAlign: 'left', whiteSpace: 'pre-wrap', background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>
            {String(this.state.error?.stack ?? this.state.error?.message ?? 'Error tidak diketahui').slice(0, 1200)}
          </pre>
        )}
      </div>
    )
  }
}

export default ErrorBoundary
