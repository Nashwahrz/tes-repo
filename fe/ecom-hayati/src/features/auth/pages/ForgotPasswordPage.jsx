// src/features/auth/pages/ForgotPasswordPage.jsx
// Reset password 3 langkah sesuai BE: kirim OTP -> verifikasi OTP (dapat reset_token) -> password baru.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendResetPasswordOtp, verifyResetPasswordOtp, resetPassword, retryAfterSeconds } from '../../../api/authServices';
import '../styles/LoginPage.css';
import '../styles/OtpPage.css';
import { formatWait } from '../utils/formatWait';

const LOGO_SRC = '/logo.png';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const errorMessage = (err) => {
  const data = err.response?.data;
  return data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
};

const TITLES = {
  email: ['Lupa Password', 'Masukkan email akun Anda, kami kirim kode OTP untuk mengatur ulang password.'],
  otp: ['Verifikasi OTP', 'Masukkan 6 digit kode OTP yang dikirim ke'],
  password: ['Password Baru', 'Buat password baru untuk akun Anda.'],
};

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState({}); // pesan per kolom di bawah kolomnya (bukan pop-up bawaan browser)
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Diblokir rate limit saat verifikasi (429): tombol Verifikasi terkunci sampai hitung mundur habis
  const [lock, setLock] = useState(0);
  useEffect(() => {
    if (lock <= 0) return undefined;
    const t = setTimeout(() => setLock((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [lock]);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    setDigits((d) => d.map((x, i) => (i === index ? value : x)));
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || ''));
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const sendCode = async () => {
    await sendResetPasswordOtp(email);
    setDigits(Array(OTP_LENGTH).fill(''));
    setCooldown(RESEND_SECONDS);
  };

  const clearField = (key) => { if (fieldErr[key]) setFieldErr((f) => ({ ...f, [key]: '' })); };

  const submitEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    const msg = !email.trim() ? 'Email wajib diisi.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Format email tidak valid (contoh: nama@email.com).' : '';
    setFieldErr({ email: msg });
    if (msg) { document.getElementById('email')?.focus(); return; }
    setLoading(true);
    try {
      await sendCode();
      setStep('otp');
    } catch (err) {
      const wait = retryAfterSeconds(err);
      if (wait) setCooldown(wait);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) { setError('Masukkan 6 digit kode OTP.'); return; }
    setLoading(true);
    try {
      const data = await verifyResetPasswordOtp(email, otp);
      setResetToken(data.reset_token);
      setStep('password');
    } catch (err) {
      const wait = retryAfterSeconds(err);
      setLock(wait);
      setError(wait ? '' : errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    const errs = {};
    if (!password) errs.password = 'Password baru wajib diisi.';
    if (!confirm) errs.confirm = 'Konfirmasi password wajib diisi.';
    else if (password !== confirm) errs.confirm = 'Konfirmasi password tidak cocok.';
    setFieldErr(errs);
    if (Object.keys(errs).length) { document.getElementById(errs.password ? 'password' : 'confirm')?.focus(); return; }
    setLoading(true);
    try {
      const data = await resetPassword(email, resetToken, password, confirm);
      setSuccess(data?.message || 'Password berhasil diubah.');
      setTimeout(() => { navigate('/', { replace: true }); }, 3000);
    } catch (err) {
      // Token kedaluwarsa/tidak valid: kembali ke awal untuk meminta OTP baru
      if (err.response?.data?.errors?.reset_token) {
        setStep('email');
        setResetToken('');
        setPassword('');
        setConfirm('');
      }
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    clearMessages();
    setResending(true);
    try {
      await sendCode();
      setSuccess('Kode OTP baru telah dikirim.');
    } catch (err) {
      const wait = retryAfterSeconds(err);
      if (wait) setCooldown(wait);
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const [title, subtitle] = TITLES[step];

  return (
    <div className="login-page">
      <div className="login-shell">
        <img className="login-logo" src={LOGO_SRC} alt="Logo Hayati" />
        <h2 className="login-brand">
          Hayati<span> •</span>
        </h2>
        <h1 className="login-title">{title}</h1>
        <p className="login-subtitle">
          {subtitle}
          {step === 'otp' && <> <strong>{email}</strong></>}
        </p>

        {step === 'email' && (
          <form className="login-card" onSubmit={submitEmail} aria-busy={loading} noValidate>
            <label className="login-label" htmlFor="email">Email</label>
            <div className={`login-field${fieldErr.email ? ' invalid' : ''}`}>
              <input className="login-input" id="email" type="email" placeholder="contoh: nama@email.com" value={email} onChange={(e) => { setEmail(e.target.value); clearField('email'); }} aria-invalid={!!fieldErr.email} autoFocus />
            </div>
            {fieldErr.email && <p className="field-error" role="alert">{fieldErr.email}</p>}
            {error && <p className="login-error">{error}</p>}
            <button id="forgot-submit-email" type="submit" className={`login-submit${loading ? ' is-loading' : ''}`} disabled={loading || cooldown > 0}>
              {loading ? <><span className="auth-spin" aria-hidden="true" /> Mengirim...</> : cooldown > 0 ? `Coba lagi dalam ${formatWait(cooldown)}` : 'Kirim Kode OTP →'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <>
            <form className="login-card" onSubmit={submitOtp} aria-busy={loading}>
              <div className="otp-boxes" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input id={`forgot-otp-${i}`}
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    aria-label={`Digit ${i + 1}`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {(lock > 0 || error) && <p className="login-error">{lock > 0 ? `Terlalu banyak percobaan. Silakan coba lagi dalam ${formatWait(lock)}.` : error}</p>}
              {success && <p className="login-success">{success}</p>}
              <button id="forgot-submit-otp" type="submit" className={`login-submit${loading ? ' is-loading' : ''}`} disabled={loading || lock > 0}>
                {loading ? <><span className="auth-spin" aria-hidden="true" /> Memverifikasi...</> : 'Verifikasi →'}
              </button>
            </form>
            <p className="login-register">
              Tidak menerima kode?
              {cooldown > 0 ? (
                <span className="otp-timer">Kirim ulang dalam {formatWait(cooldown)}</span>
              ) : (
                <button id="forgot-resend" type="button" className="otp-resend" onClick={resend} disabled={resending}>
                  {resending ? <><span className="auth-spin" aria-hidden="true" /> Mengirim...</> : 'Kirim Ulang'}
                </button>
              )}
            </p>
          </>
        )}

        {step === 'password' && (
          <form className="login-card" onSubmit={submitPassword} aria-busy={loading} noValidate>
            <label className="login-label" htmlFor="password">Password Baru</label>
            <div className={`login-field${fieldErr.password ? ' invalid' : ''}`}>
              <input className="login-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 karakter, huruf besar/kecil, angka, simbol" value={password} onChange={(e) => { setPassword(e.target.value); clearField('password'); }} aria-invalid={!!fieldErr.password} autoFocus />
              <button id="forgot-toggle-password" type="button" className="login-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </div>
            {fieldErr.password && <p className="field-error" role="alert">{fieldErr.password}</p>}
            <label className="login-label" htmlFor="confirm">Konfirmasi Password</label>
            <div className={`login-field${fieldErr.confirm ? ' invalid' : ''}`}>
              <input className="login-input" id="confirm" type={showPassword ? 'text' : 'password'} placeholder="Ulangi password baru" value={confirm} onChange={(e) => { setConfirm(e.target.value); clearField('confirm'); }} aria-invalid={!!fieldErr.confirm} />
            </div>
            {fieldErr.confirm && <p className="field-error" role="alert">{fieldErr.confirm}</p>}
            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}
            <button id="forgot-submit-password" type="submit" className={`login-submit${loading ? ' is-loading' : ''}`} disabled={loading || !!success}>
              {loading ? <><span className="auth-spin" aria-hidden="true" /> Menyimpan...</> : 'Simpan Password →'}
            </button>
          </form>
        )}

        <Link className="login-secure" to="/">← Kembali ke halaman login</Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
