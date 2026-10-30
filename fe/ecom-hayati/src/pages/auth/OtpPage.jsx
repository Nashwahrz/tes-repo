// src/pages/OtpPage.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { sendOtp, verifyOtp, retryAfterSeconds } from '../../api/authServices';
import './LoginPage.css';
import './OtpPage.css';
import { formatWait } from './formatWait';

const LOGO_SRC = '/logo.png';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function OtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
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

  const setDigit = (index, value) => {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
  };

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    setDigit(index, value);
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || ''));
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const errorMessage = (err) => {
    const data = err.response?.data;
    return data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Masukkan 6 digit kode OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setSuccess('Email berhasil diverifikasi. Akun Anda menunggu persetujuan (ACC) Super Admin sebelum bisa digunakan.');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 4000);
    } catch (err) {
      const wait = retryAfterSeconds(err);
      setLock(wait);
      setError(wait ? '' : errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const data = await sendOtp(email);
      setSuccess(data?.message || 'Kode OTP baru telah dikirim.');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      // Kena rate limit: jeda kirim ulang mengikuti waktu tunggu dari BE
      const wait = retryAfterSeconds(err);
      if (wait) setCooldown(wait);
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <img className="login-logo" src={LOGO_SRC} alt="Logo Hayati" />
        <h2 className="login-brand">
          Hayati<span> •</span>
        </h2>
        <h1 className="login-title">Verifikasi Email</h1>
        <p className="login-subtitle">
          Masukkan 6 digit kode OTP yang dikirim ke <strong>{email || 'email Anda'}</strong>
        </p>

        <form className="login-card" onSubmit={handleSubmit} aria-busy={loading}>
          <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input id={`otp-digit-${i}`}
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

          <button id="otp-submit" type="submit" className={`login-submit${loading ? ' is-loading' : ''}`} disabled={loading || !email || lock > 0}>
            {loading ? <><span className="auth-spin" aria-hidden="true" /> Memverifikasi...</> : 'Verifikasi →'}
          </button>
        </form>

        <p className="login-register">
          Tidak menerima kode?
          {cooldown > 0 ? (
            <span className="otp-timer">Kirim ulang dalam {formatWait(cooldown)}</span>
          ) : (
            <button id="otp-resend" type="button" className="otp-resend" onClick={handleResend} disabled={!email || resending}>
              {resending ? <><span className="auth-spin" aria-hidden="true" /> Mengirim...</> : 'Kirim Ulang'}
            </button>
          )}
        </p>

        <Link className="login-secure" to="/">← Kembali ke halaman login</Link>
      </div>
    </div>
  );
}

export default OtpPage;
