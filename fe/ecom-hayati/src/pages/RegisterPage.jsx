// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { registerUser } from '../api/authServices';

// Enum / list role berurutan sesuai seeder DB:
// $roles = ['Manager', 'Kacab', 'ADH', 'ME', 'Kasir'];
const ROLES = [
  { id: 2, name: 'Kacab' },
  { id: 3, name: 'ADH' },
  { id: 4, name: 'ME' },
  { id: 5, name: 'Kasir' },
];

function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [id_role, setIdRole] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (!id_role) {
      setError('Silakan pilih role terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(name, email, password, password_confirmation, Number(id_role));

      setSuccess(data?.message || 'Registrasi berhasil! Mengarahkan ke halaman login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formControlStyle = {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    outline: 'none',
    backgroundColor: 'inherit',
    color: 'inherit',
  };

  const fieldGroupStyle = {
    marginBottom: '14px',
    textAlign: 'left',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--border, #e5e4e7)',
          backgroundColor: 'var(--bg, #ffffff)',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontSize: '28px', margin: '0 0 24px', textAlign: 'center' }}>Register</h1>

        <form onSubmit={handleSubmit}>
          <div style={fieldGroupStyle}>
            <label
              htmlFor="name"
              style={labelStyle}
            >
              Nama
            </label>
            <input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={formControlStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label
              htmlFor="email"
              style={labelStyle}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={formControlStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label
              htmlFor="role"
              style={labelStyle}
            >
              Role
            </label>
            <select
              id="role"
              value={id_role}
              onChange={(e) => setIdRole(e.target.value)}
              required
              style={formControlStyle}
            >
              <option
                value=""
                disabled
              >
                -- Pilih Role --
              </option>
              {ROLES.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldGroupStyle}>
            <label
              htmlFor="password"
              style={labelStyle}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={formControlStyle}
            />
          </div>

          <div style={fieldGroupStyle}>
            <label
              htmlFor="password_confirmation"
              style={labelStyle}
            >
              Konfirmasi Password
            </label>
            <input
              id="password_confirmation"
              type="password"
              placeholder="Ulangi password"
              value={password_confirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              style={formControlStyle}
            />
          </div>

          {error && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', marginBottom: '14px', textAlign: 'left' }}>{error}</div>}

          {success && <div style={{ color: '#15803d', backgroundColor: '#dcfce7', padding: '10px 12px', borderRadius: '6px', fontSize: '14px', marginBottom: '14px', textAlign: 'left' }}>{success}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {loading ? 'Mendaftar...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Sudah punya akun?{' '}
          <a
            href="/"
            style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}
          >
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
