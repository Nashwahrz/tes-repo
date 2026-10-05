// src/pages/OtpPage.jsx
import { useEffect, useRef, useState } from 'react';
import { sendOtp, verifyOtp } from '../../api/authServices';
import './LoginPage.css';
import './OtpPage.css';

const LOGO_SRC = '/logo.png';
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function OtpPage() {
  const email = new URLSearchParams(window.location.search).get('email') || '';
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

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
      setSuccess('Email berhasil diverifikasi. Akun Anda menunggu persetujuan (ACC) Manager sebelum bisa digunakan.');
      setTimeout(() => {
        window.location.href = '/';
      }, 4000);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      const data = await sendOtp(email);
      setSuccess(data?.message || 'Kode OTP baru telah dikirim.');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err));
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

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
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

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button type="submit" className="login-submit" disabled={loading || !email}>
            {loading ? 'Memverifikasi...' : 'Verifikasi →'}
          </button>
        </form>

        <p className="login-register">
          Tidak menerima kode?
          {cooldown > 0 ? (
            <span className="otp-timer">Kirim ulang dalam {cooldown} dtk</span>
          ) : (
            <button type="button" className="otp-resend" onClick={handleResend} disabled={!email}>
              Kirim Ulang
            </button>
          )}
        </p>

        <a className="login-secure" href="/">← Kembali ke halaman login</a>
      </div>
    </div>
  );
}

export default OtpPage;
