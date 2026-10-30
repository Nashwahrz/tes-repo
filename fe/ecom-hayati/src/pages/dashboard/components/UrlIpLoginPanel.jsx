// src/pages/dashboard/components/UrlIpLoginPanel.jsx
// URL layanan geolokasi IP yang dipakai BE untuk mengisi kota/negara di log login (BE: /url-ip-logins).
// Baris dibuat lewat seeder: di sini hanya URL dan statusnya yang bisa diubah.
import { useEffect, useState } from 'react';
import { getUrlIpLogins, updateUrlIpLogin, errorMessage } from '../../../api/authServices';
import Toast from './Toast';
import Modal from './Modal';
import Loading, { Spin } from './Loading';
import IconButton from './IconButton';

// Mengikuti UrlIpLoginRequest di BE: wajib dan berupa URL valid
function validateUrl(value) {
  const v = value.trim();
  if (!v) return 'URL wajib diisi.';
  try {
    const u = new URL(v.replace('{ip}', '0.0.0.0'));
    if (!/^https?:$/.test(u.protocol)) return 'URL harus diawali http:// atau https://.';
  } catch {
    return 'URL harus berupa URL yang valid.';
  }
  return '';
}

function UrlIpLoginPanel({ canEdit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ url: '', is_active: true });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUrlIpLogins()
      .then((data) => { if (active) setRows([...data].sort((a, b) => a.id - b.id)); })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const urlError = editing ? validateUrl(form.url) : '';

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setForm({ url: row.url, is_active: !!row.is_active });
    setEditing(row);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (urlError) return;
    setSaving(true);
    setError('');
    try {
      const res = await updateUrlIpLogin(editing.id, { url: form.url.trim(), is_active: form.is_active });
      setRows((list) => list.map((r) => (r.id === editing.id ? { ...r, ...res.data } : r)));
      setSuccess('URL IP login diperbarui.');
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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>
          URL IP Login
        </h3>
      </div>
      <p className="dash-card-desc">Layanan yang dipanggil BE untuk mencari lokasi (kota, wilayah, negara) dari alamat IP saat user login. Bila tidak ada URL aktif, lokasi pada log login tidak terisi.</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={2} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">Belum ada URL IP login.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Status</th>
                {canEdit && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong className="dash-cell-name" style={{ wordBreak: 'break-all' }}>{r.url}</strong></td>
                  <td><span className={`dash-status ${r.is_active ? 'aktif' : 'nonaktif'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  {canEdit && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton id={`btn-urlip-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />
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
        <Modal as="form" onClose={saving ? undefined : () => setEditing(null)} onSubmit={handleSubmit} noValidate>
          <h3>Ubah URL IP Login</h3>
          <div className="dash-form-group">
            <label htmlFor="urlip-url">URL *</label>
            <input
              id="urlip-url"
              className={`dash-input${touched && urlError ? ' invalid' : ''}`}
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="http://ip-api.com/json/"
              autoFocus
            />
            {touched && urlError && <p className="dash-field-error">{urlError}</p>}
            <p className="dash-map-hint">Alamat IP ditambahkan di ujung URL, atau tulis <code>{'{ip}'}</code> untuk menentukan posisinya. Layanan harus membalas format ip-api.com.</p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
            <input id="urlip-is-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Aktif
          </label>
          {!form.is_active && <p className="dash-alert warning">Bila dinonaktifkan, lokasi pada log login tidak akan terisi.</p>}
          <div className="dash-modal-actions">
            <button id="btn-urlip-cancel" type="button" className="dash-btn outline" onClick={() => setEditing(null)} disabled={saving}>Batal</button>
            <button id="btn-urlip-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UrlIpLoginPanel;
