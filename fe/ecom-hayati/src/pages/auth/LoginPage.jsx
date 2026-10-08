// src/pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { loginUser } from '../../api/authServices';
import './LoginPage.css';

const LOGO_SRC = '/logo.png';

const formatWait = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(0); // epoch ms; 0 = tidak diblokir
  const [now, setNow] = useState(() => Date.now());

  // Hitung mundur selama diblokir (BE mengirim retry_after dalam detik)
  useEffect(() => {
    if (!blockedUntil) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= blockedUntil) {
        setBlockedUntil(0);
        setError('');
      }
    }, 500);
    return () => clearInterval(id);
  }, [blockedUntil]);

  const waitSec = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (waitSec > 0) return;
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

      // Email belum diverifikasi -> BE sudah mengirim OTP, arahkan ke halaman OTP
      if (data?.code === 'email_not_verified') {
        window.location.href = `/otp?email=${encodeURIComponent(email)}`;
        return;
      }

      // Terlalu banyak percobaan: blokir tombol sampai retry_after habis
      if (data?.code === 'too_many_attempts' && data.retry_after) {
        setNow(Date.now());
        setBlockedUntil(Date.now() + data.retry_after * 1000);
        setError(data.message);
        return;
      }

      const msg = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <img className="login-logo" src={LOGO_SRC} alt="Logo Hayati" />
        <h2 className="login-brand">
          Hayati<span> •</span>
        </h2>
        <h1 className="login-title">Selamat Datang Kembali</h1>
        <p className="login-subtitle">Masuk ke akun Anda untuk melanjutkan aktivitas hari ini</p>

        <form className="login-card" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="email">Email</label>
          <div className="login-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
            </svg>
            <input
              className="login-input"
              id="email"
              type="email"
              placeholder="contoh: nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label className="login-label" htmlFor="password">Kata Sandi</label>
          <div className="login-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <input
              className="login-input"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="login-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <path d="M3 3l18 18" />}
              </svg>
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}
          {/* {waitSec > 0 && <p className="login-error">Coba lagi dalam {formatWait(waitSec)}.</p>} */}

          <button type="submit" className="login-submit" disabled={loading || waitSec > 0}>
            {loading ? 'Memproses...' : waitSec > 0 ? `Coba lagi dalam ${formatWait(waitSec)}` : 'Masuk →'}
          </button>
        </form>

        <p className="login-register">
          Belum punya akun?<a href="/register">Daftar Sekarang ›</a>
        </p>

                {/* <span className="login-secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Enkripsi data 256-bit aman &amp; terlindungi
        </span> */}

      </div>
    </div>
  );
}

export default LoginPage;
