// src/pages/dashboard/components/RateLimitPanel.jsx
// Pengaturan rate limit (BE: /configurasi-rate-limits, permission configurasi-rate-limits.lihat/ubah).
// Baris dibuat lewat seeder: di sini hanya batasnya yang bisa diubah, bukan nama atau jumlah barisnya.
import { useEffect, useState } from 'react';
import { getRateLimits, updateRateLimit, errorMessage } from '../../../api/authServices';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import IconButton from './IconButton';

const LABELS = {
  login: { title: 'Login', desc: 'Percobaan login per akun dan alamat IP' },
  'otp-send': { title: 'Kirim OTP', desc: 'Permintaan kode OTP per email dan alamat IP' },
  'otp-verify': { title: 'Verifikasi OTP', desc: 'Percobaan memasukkan kode OTP per email dan alamat IP' },
  'scan-ktp': { title: 'Scan KTP', desc: 'Pemindaian KTP (OCR) per pengguna' },
};

const toInt = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);

function RateLimitPanel({ canEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ request_per_minutes: '', minutes: '', is_active: true });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getRateLimits()
      .then((data) => { if (active) setRows([...data].sort((a, b) => a.id - b.id)); })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const title = (r) => LABELS[r.name]?.title ?? r.name;
  const errors = {
    request_per_minutes: !(toInt(form.request_per_minutes) >= 1) ? 'Isi bilangan bulat minimal 1.' : '',
    minutes: !(toInt(form.minutes) >= 1) ? 'Isi bilangan bulat minimal 1.' : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setForm({ request_per_minutes: String(row.request_per_minutes), minutes: String(row.minutes), is_active: !!row.is_active });
    setEditing(row);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    setSaving(true);
    setError('');
    try {
      // BE mewajibkan semua kolom, termasuk nama (tidak diubah)
      const res = await updateRateLimit(editing.id, {
        name: editing.name,
        request_per_minutes: toInt(form.request_per_minutes),
        minutes: toInt(form.minutes),
        is_active: form.is_active,
      });
      setRows((list) => list.map((r) => (r.id === editing.id ? { ...r, ...res.data } : r)));
      setSuccess(`Rate limit ${title(editing)} diperbarui.`);
      setEditing(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
          Setting Rate Limit
        </h3>
      </div>
      <p className="dash-card-desc">Batasi jumlah permintaan dalam rentang waktu tertentu untuk mencegah penyalahgunaan. Perubahan berlaku langsung.</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">Belum ada konfigurasi rate limit.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Fitur</th>
                <th>Batas</th>
                <th>Status</th>
                {canEdit && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong className="dash-cell-name">{title(r)}</strong>
                    {LABELS[r.name] && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{LABELS[r.name].desc}</div>}
                  </td>
                  <td>{r.request_per_minutes} permintaan / {r.minutes} menit</td>
                  <td><span className={`dash-status ${r.is_active ? 'aktif' : 'nonaktif'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  {canEdit && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton id={`btn-ratelimit-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="dash-modal-bg">
          <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <div className="dash-modal-head">
              <h3>Ubah Rate Limit · {title(editing)}</h3>
              <button id="btn-ratelimit-close" type="button" className="dash-modal-close" onClick={() => setEditing(null)} aria-label="Tutup" title="Tutup" disabled={saving}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="dash-form-group">
              <label htmlFor="rl-req">Jumlah permintaan maksimal *</label>
              <input
                id="rl-req"
                className={`dash-input${touched && errors.request_per_minutes ? ' invalid' : ''}`}
                inputMode="numeric"
                value={form.request_per_minutes}
                onChange={(e) => setForm((f) => ({ ...f, request_per_minutes: e.target.value }))}
                autoFocus
              />
              {touched && errors.request_per_minutes && <p className="dash-field-error">{errors.request_per_minutes}</p>}
            </div>
            <div className="dash-form-group">
              <label htmlFor="rl-min">Dalam rentang (menit) *</label>
              <input
                id="rl-min"
                className={`dash-input${touched && errors.minutes ? ' invalid' : ''}`}
                inputMode="numeric"
                value={form.minutes}
                onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))}
              />
              {touched && errors.minutes && <p className="dash-field-error">{errors.minutes}</p>}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
              <input id="rl-is-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Aktifkan pembatasan
            </label>
            {!form.is_active && <p className="dash-alert warning">Bila dinonaktifkan, fitur ini tidak lagi dibatasi sehingga rentan disalahgunakan.</p>}
            <div className="dash-modal-actions">
              <button id="btn-ratelimit-cancel" type="button" className="dash-btn outline" onClick={() => setEditing(null)} disabled={saving}>Batal</button>
              <button id="btn-ratelimit-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default RateLimitPanel;
