// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser } from '../api/authServices';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(email, password);

      // Simpan token ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.data));

      // Redirect ke dashboard (sesuaikan)
      window.location.href = '/dashboard';
    } catch (err) {
      // Pesan berasal dari LoginResponse di BE:
      // 401 -> email/password salah, 403 -> akun belum aktif,
      // 422 -> validasi, 500 -> kesalahan server
      const data = err.response?.data;
      const msg = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '8px 24px' }}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: 16, textAlign: 'center' }}>
        Belum punya akun? <a href="/register">Daftar di sini</a>
      </p>
    </div>
  );
}

export default LoginPage;
