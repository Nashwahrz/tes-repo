// src/pages/dashboard/components/EmailWhitelistPanel.jsx
// Domain email yang boleh dipakai untuk registrasi (BE: /email-whitelists, permission email-whitelists.*).
import { useEffect, useState } from 'react';
import {
  getEmailWhitelists, createEmailWhitelist, updateEmailWhitelist, deleteEmailWhitelist, errorMessage,
} from '../../../api/authServices';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';

const EMPTY = { domain: '@', is_active: true };
const DOMAIN_FORMAT = /^@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

// Domain selalu berawalan @ dan huruf kecil (BE mencocokkan huruf kecil)
const normalizeDomain = (v) => {
  const t = v.trim().toLowerCase().replace(/\s+/g, '');
  return t.startsWith('@') ? t : `@${t}`;
};

// Mengikuti EmailWhiteListRequest di BE: wajib, diawali @, unik
function validate(form, others) {
  const domain = normalizeDomain(form.domain);
  if (domain === '@') return { domain: 'Domain wajib diisi.' };
  if (!DOMAIN_FORMAT.test(domain)) return { domain: 'Format domain tidak valid. Contoh: @gmail.com' };
  if (others.some((r) => r.domain.toLowerCase() === domain)) return { domain: 'Domain sudah terdaftar.' };
  return {};
}

// users: untuk menampilkan nama pembuat (created_by hanya berisi id); can = permission email-whitelists.*
function EmailWhitelistPanel({ can, userId, users = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getEmailWhitelists()
      .then((data) => { if (active) setRows(data); })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const isNew = editing === 'new';
  const others = isNew ? rows : rows.filter((r) => r.id !== editing?.id);
  const errors = editing ? validate(form, others) : {};
  const creator = (id) => users.find((u) => u.id === id)?.name ?? (id ? `Pengguna #${id}` : '-');

  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((r) => r.domain.toLowerCase().includes(q)) : rows;

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setForm(row === 'new' ? EMPTY : { domain: row.domain, is_active: !!row.is_active });
    setEditing(row);
  };
  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (errors.domain) return;

    const domain = normalizeDomain(form.domain);
    // BE memakai aturan unik domain tanpa mengabaikan data yang sedang diubah, sehingga mengirim domain yang sama
    // (mis. hanya mengganti status) selalu ditolak "Domain sudah terdaftar". Beri tahu pengguna, jangan kirim.
    if (!isNew && domain === editing.domain.toLowerCase()) {
      setError('Backend belum mendukung mengubah status tanpa mengganti domain. Ganti nama domain, atau hapus lalu tambah ulang.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const res = await createEmailWhitelist({ domain, is_active: form.is_active, created_by: userId });
        setRows((list) => [...list, res.data]);
        setSuccess(`Domain ${domain} ditambahkan.`);
      } else {
        const res = await updateEmailWhitelist(editing.id, { domain, is_active: form.is_active, created_by: editing.created_by ?? userId });
        setRows((list) => list.map((r) => (r.id === editing.id ? res.data : r)));
        setSuccess(`Domain ${domain} diperbarui.`);
      }
      closeForm();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const target = toDelete;
    setSaving(true);
    setError('');
    try {
      await deleteEmailWhitelist(target.id);
      setRows((list) => list.filter((r) => r.id !== target.id));
      setSuccess(`Domain ${target.domain} dihapus.`);
    } catch (err) {
      // Respons hapus dari BE bisa 500 padahal datanya sudah terhapus; cek ke daftar terbaru sebelum melapor gagal
      try {
        const fresh = await getEmailWhitelists();
        setRows(fresh);
        if (fresh.some((r) => r.id === target.id)) setError(errorMessage(err));
        else setSuccess(`Domain ${target.domain} dihapus.`);
      } catch {
        setError(errorMessage(err));
      }
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
          Email WhiteList
        </h3>
        {can.tambah && <button id="btn-whitelist-add" className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah Domain</button>}
      </div>
      <p className="dash-card-desc">Hanya email dengan domain aktif di daftar ini yang dapat mendaftar akun baru.</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      <div className="dash-toolbar">
        <input id="whitelist-search" className="dash-input dash-input-search" type="search" placeholder="Cari domain..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <Loading rows={4} />
      ) : visible.length === 0 ? (
        <p className="dash-empty">{q ? 'Domain tidak ditemukan.' : 'Belum ada domain di whitelist. Semua pendaftaran akan ditolak.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Status</th>
                <th>Dibuat</th>
                {(can.ubah || can.hapus) && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  <td><strong className="dash-cell-name">{r.domain}</strong></td>
                  <td><span className={`dash-status ${r.is_active ? 'aktif' : 'nonaktif'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    {tanggal(r.created_at)}
                    <small className="dash-cell-sub">{creator(r.created_by)}</small>
                  </td>
                  {(can.ubah || can.hapus) && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {can.ubah && <IconButton id={`btn-whitelist-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                        {can.hapus && <IconButton id={`btn-whitelist-delete-${r.id}`} icon="delete" label="Hapus" tone="danger" onClick={() => setToDelete(r)} />}
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
            <h3>{isNew ? 'Tambah Domain' : 'Ubah Domain'}</h3>
            <div className="dash-form-group">
              <label htmlFor="whitelist-domain">Domain *</label>
              <input
                id="whitelist-domain"
                className={`dash-input${touched && errors.domain ? ' invalid' : ''}`}
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                placeholder="@gmail.com"
                autoFocus
              />
              {touched && errors.domain && <p className="dash-field-error">{errors.domain}</p>}
              <p className="dash-map-hint">Diawali @, contoh: @gmail.com. Huruf otomatis dikecilkan.</p>
            </div>
            <div className="dash-form-group">
              <label className="dash-check">
                <input id="whitelist-is-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                Aktif (domain ini boleh dipakai mendaftar)
              </label>
            </div>
            <div className="dash-modal-actions">
              <button id="btn-whitelist-cancel" type="button" className="dash-btn outline" onClick={closeForm} disabled={saving}>Batal</button>
              <button id="btn-whitelist-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <ConfirmModal title="Hapus Domain" confirmLabel="Ya, Hapus" busyLabel="Menghapus..." busy={saving} onConfirm={handleDelete} onCancel={() => setToDelete(null)}>
          <p className="dash-card-desc">
            Yakin ingin menghapus <strong>{toDelete.domain}</strong>? Email dengan domain ini tidak akan bisa mendaftar lagi. Akun yang sudah ada tidak terpengaruh.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default EmailWhitelistPanel;
