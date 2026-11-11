// src/features/auth/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../api/authServices';
import '../styles/LoginPage.css';

const LOGO_SRC = '/logo.png';

// Enum / list role berurutan sesuai seeder DB:
// $roles = ['Super Admin', 'Kacab', 'ADH', 'ME', 'Kasir'];
const ROLES = [
  { id: 2, name: 'Kacab' },
  { id: 3, name: 'ADH' },
  { id: 4, name: 'ME' },
  { id: 5, name: 'Kasir' },
];

// Validasi sisi klien, mengikuti aturan di be/app/Http/Requests/RegisterRequest.php
const validateName = (v) => (v && !/^[a-zA-Z\s]+$/.test(v) ? 'Nama tidak boleh mengandung simbol atau angka.' : '');
const validateEmail = (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Format email tidak valid.' : '');
const validatePassword = (v) => {
  if (!v) return '';
  const missing = [];
  if (v.length < 8) missing.push('minimal 8 karakter');
  if (!/[a-z]/.test(v) && !/[A-Z]/.test(v)) missing.push('huruf besar dan huruf kecil');
  if (!/[a-z]/.test(v)) missing.push('huruf kecil');
  if (!/[A-Z]/.test(v)) missing.push('huruf besar');
  if (!/\d/.test(v)) missing.push('angka');
  if (!/[^a-zA-Z0-9\s]/.test(v)) missing.push('simbol');
  return missing.length ? `Password harus mengandung ${missing.join(', ')}.` : '';
};

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [fk_role, setIdRole] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false); // setelah klik Daftar: kolom kosong ikut diberi pesan
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Pesan tampil di bawah kolom (bukan pop-up bawaan browser): kolom kosong baru ditandai setelah klik Daftar
  const req = (sub, v, msg) => (sub && !String(v).trim() ? msg : '');
  const errorsFor = (sub) => ({
    name: req(sub, name, 'Nama wajib diisi.') || validateName(name),
    email: req(sub, email, 'Email wajib diisi.') || validateEmail(email),
    role: sub && !fk_role ? 'Role wajib dipilih.' : '',
    password: req(sub, password, 'Password wajib diisi.') || validatePassword(password),
    confirm: req(sub, password_confirmation, 'Konfirmasi password wajib diisi.') || (password_confirmation && password !== password_confirmation ? 'Konfirmasi password tidak cocok.' : ''),
  });
  const { name: nameError, email: emailError, role: roleError, password: passwordError, confirm: confirmError } = errorsFor(submitted);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSubmitted(true);
    const errs = errorsFor(true);
    const first = ['name', 'email', 'role', 'password', 'confirm'].find((k) => errs[k]);
    if (first) {
      document.getElementById(first === 'confirm' ? 'password_confirmation' : first)?.focus();
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(name, email, password, password_confirmation, Number(fk_role));

      setSuccess(data?.message || 'Registrasi berhasil! Mengarahkan ke verifikasi OTP...');
      setTimeout(() => {
        navigate(`/otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err) {
      const data = err.response?.data;
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
        <h1 className="login-title">Buat Akun Baru</h1>
        <p className="login-subtitle">Lengkapi data berikut untuk mendaftar</p>

        <form className="login-card" onSubmit={handleSubmit} aria-busy={loading} noValidate>
          <label className="login-label" htmlFor="name">Nama</label>
          <div className={`login-field${nameError ? ' invalid' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
            <input
              className="login-input"
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
            />
          </div>
          {nameError && <p className="field-error" role="alert">{nameError}</p>}

          <label className="login-label" htmlFor="email">Email</label>
          <div className={`login-field${emailError ? ' invalid' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            <input
              className="login-input"
              id="email"
              type="email"
              placeholder="contoh: nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError}
            />
          </div>
          {emailError && <p className="field-error" role="alert">{emailError}</p>}

          <label className="login-label" htmlFor="role">Role</label>
          <div className={`login-field${roleError ? ' invalid' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M15 9h3M15 13h3M6 17c.5-2 5.5-2 6 0" /></svg>
            <select
              className="login-input"
              id="role"
              value={fk_role}
              onChange={(e) => setIdRole(e.target.value)}
              aria-invalid={!!roleError}
            >
              <option value="" disabled>
                -- Pilih Role --
              </option>
              {ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          {roleError && <p className="field-error" role="alert">{roleError}</p>}

          <label className="login-label" htmlFor="password">Password</label>
          <div className={`login-field${passwordError ? ' invalid' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <input
              className="login-input"
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
            />
            <button id="register-toggle-password"
              type="button"
              className="login-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{showPassword && <path d="M3 3l18 18" />}</svg>
            </button>
          </div>
          {passwordError && <p className="field-error" role="alert">{passwordError}</p>}

          <label className="login-label" htmlFor="password_confirmation">Konfirmasi Password</label>
          <div className={`login-field${confirmError ? ' invalid' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <input
              className="login-input"
              id="password_confirmation"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi password"
              value={password_confirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              aria-invalid={!!confirmError}
            />
            <button id="register-toggle-password-confirmation"
              type="button"
              className="login-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{showPassword && <path d="M3 3l18 18" />}</svg>
            </button>
          </div>
          {confirmError && <p className="field-error" role="alert">{confirmError}</p>}

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button id="register-submit" type="submit" className={`login-submit${loading ? ' is-loading' : ''}`} disabled={loading}>
            {loading ? <><span className="auth-spin" aria-hidden="true" /> Mendaftar...</> : 'Daftar →'}
          </button>
        </form>

        <p className="login-register">
          Sudah punya akun?<Link to="/">Masuk Sekarang ›</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
