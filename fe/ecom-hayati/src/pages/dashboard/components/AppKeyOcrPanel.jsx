// src/pages/dashboard/components/AppKeyOcrPanel.jsx
// URL dan API key layanan OCR yang dipakai BE untuk membaca KTP (BE: /app-key-ocrs).
// Baris dibuat lewat seeder: di sini hanya bisa diubah. BE mewajibkan url, api_key, keterangan, dan is_active.
import { useEffect, useState } from 'react';
import { getAppKeyOcrs, updateAppKeyOcr, errorMessage } from '../../../api/authServices';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import IconButton from './IconButton';

// Mengikuti AppKeyOcrRequest di BE
function validate(f) {
  const errors = {};
  const url = f.url.trim();
  if (!url) errors.url = 'URL wajib diisi.';
  else {
    try {
      if (!/^https?:$/.test(new URL(url).protocol)) errors.url = 'URL harus diawali http:// atau https://.';
    } catch {
      errors.url = 'URL harus berupa URL yang valid.';
    }
  }
  if (!f.api_key.trim()) errors.api_key = 'API key wajib diisi.';
  if (!f.keterangan.trim()) errors.keterangan = 'Keterangan wajib diisi.';
  return errors;
}

// API key tidak ditampilkan utuh di tabel
const mask = (key) => {
  const k = String(key ?? '');
  return k.length <= 4 ? '••••' : `${'•'.repeat(Math.min(k.length - 4, 12))}${k.slice(-4)}`;
};

function AppKeyOcrPanel({ canEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ url: '', api_key: '', keterangan: '', is_active: true });
  const [showKey, setShowKey] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getAppKeyOcrs()
      .then((data) => { if (active) setRows([...data].sort((a, b) => a.id - b.id)); })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const errors = editing ? validate(form) : {};

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setShowKey(false);
    setForm({ url: row.url ?? '', api_key: row.api_key ?? '', keterangan: row.keterangan ?? '', is_active: !!row.is_active });
    setEditing(row);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;
    setSaving(true);
    setError('');
    try {
      const res = await updateAppKeyOcr(editing.id, {
        url: form.url.trim(), api_key: form.api_key.trim(), keterangan: form.keterangan.trim(), is_active: form.is_active,
      });
      setRows((list) => list.map((r) => (r.id === editing.id ? { ...r, ...res.data } : r)));
      setSuccess('App key OCR diperbarui.');
      setEditing(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const fieldError = (key) => touched && errors[key] && <p className="dash-field-error">{errors[key]}</p>;

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2" /></svg>
          App Key OCR
        </h3>
      </div>
      <p className="dash-card-desc">Layanan OCR yang dipanggil BE untuk membaca foto KTP konsumen. Bila tidak ada konfigurasi aktif, pembacaan KTP gagal. Perubahan berlaku paling lambat setelah cache BE diperbarui.</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={2} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">Belum ada konfigurasi App Key OCR.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>API Key</th>
                <th>Keterangan</th>
                <th>Status</th>
                {canEdit && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong className="dash-cell-name" style={{ wordBreak: 'break-all' }}>{r.url}</strong></td>
                  <td><code>{mask(r.api_key)}</code></td>
                  <td>{r.keterangan || '-'}</td>
                  <td><span className={`dash-status ${r.is_active ? 'aktif' : 'nonaktif'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  {canEdit && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton id={`btn-ocr-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />
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
            <h3>Ubah App Key OCR</h3>
            <div className="dash-form-group">
              <label htmlFor="ocr-url">URL *</label>
              <input id="ocr-url" className={`dash-input${touched && errors.url ? ' invalid' : ''}`} value={form.url} onChange={set('url')} placeholder="https://api.ocr.space/parse/image" autoFocus />
              {fieldError('url')}
            </div>
            <div className="dash-form-group">
              <label htmlFor="ocr-key">API Key *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input id="ocr-key" className={`dash-input${touched && errors.api_key ? ' invalid' : ''}`} type={showKey ? 'text' : 'password'} value={form.api_key} onChange={set('api_key')} autoComplete="off" />
                <button id="btn-ocr-toggle-key" type="button" className="dash-btn outline" onClick={() => setShowKey((v) => !v)}>{showKey ? 'Sembunyikan' : 'Tampilkan'}</button>
              </div>
              {fieldError('api_key')}
            </div>
            <div className="dash-form-group">
              <label htmlFor="ocr-ket">Keterangan *</label>
              <input id="ocr-ket" className={`dash-input${touched && errors.keterangan ? ' invalid' : ''}`} value={form.keterangan} onChange={set('keterangan')} />
              {fieldError('keterangan')}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
              <input id="ocr-is-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Aktif
            </label>
            {!form.is_active && <p className="dash-alert warning">Bila dinonaktifkan, pembacaan KTP (OCR) tidak dapat dipakai.</p>}
            <div className="dash-modal-actions">
              <button id="btn-ocr-cancel" type="button" className="dash-btn outline" onClick={() => setEditing(null)} disabled={saving}>Batal</button>
              <button id="btn-ocr-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AppKeyOcrPanel;
