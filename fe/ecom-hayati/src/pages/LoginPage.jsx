// src/pages/LoginPage.jsx
import { useState } from 'react';
import { loginUser, sendOtp, verifyOtp } from '../api/authServices';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState('');

  const getMessage = (err) => {
    const data = err.response?.data;
    return data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
  };

  const doLogin = async () => {
    const data = await loginUser(email, password);

    // Simpan token ke localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.data));

    // Redirect ke dashboard
    window.location.href = '/dashboard';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await doLogin();
    } catch (err) {
      // 401 -> email/password salah, 403 -> akun belum aktif / email belum terverifikasi,
      // 422 -> validasi, 500 -> kesalahan server
      if (err.response?.data?.requires_otp) {
        // Email belum terverifikasi: BE sudah mengirim OTP, minta user memasukkannya
        setOtpMode(true);
        setOtp('');
        setInfo(err.response.data.message);
      } else {
        setError(getMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      await verifyOtp(email, otp);
    } catch (err) {
      setError(getMessage(err));
      setLoading(false);
      return;
    }

    // Email sudah terverifikasi, lanjut login (status akun tetap dicek oleh BE)
    try {
      await doLogin();
    } catch (err) {
      setOtpMode(false);
      setPassword('');
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const data = await sendOtp(email);
      setInfo(data.message);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOtpMode(false);
    setOtp('');
    setError('');
    setInfo('');
  };

  if (otpMode) {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
        <h1>Verifikasi Email</h1>
        <form onSubmit={handleVerify}>
          <div>
            <label>Kode OTP</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
            />
          </div>

          {info && <p style={{ color: 'green' }}>{info}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <button type="submit" disabled={loading || otp.length !== 6} style={{ padding: '8px 24px' }}>
            {loading ? 'Loading...' : 'Verifikasi'}
          </button>
          <button type="button" disabled={loading} onClick={handleResend} style={{ padding: '8px 24px', marginLeft: 8 }}>
            Kirim ulang OTP
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); handleBack(); }}>Kembali ke login</a>
        </p>
      </div>
    );
  }

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
