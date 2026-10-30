// src/pages/dashboard/components/EmailSmtpPanel.jsx
// Pengaturan SMTP pengirim email (BE: /email-smtps, permission email-smtps.*).
import { useEffect, useState } from 'react';
import {
  getEmailSmtps, createEmailSmtp, updateEmailSmtp, deleteEmailSmtp, errorMessage,
} from '../../../api/authServices';
import Toast from './Toast';
import Modal from './Modal';
import Loading, { Spin } from './Loading';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';

const MAILERS = ['smtp', 'sendmail', 'mail'];
const ENCRYPTIONS = ['null', 'tls', 'ssl'];
const EMPTY = {
  mail_mailer: 'smtp', mail_host: '', mail_port: '587', mail_username: '', mail_password: '',
  mail_encryption: 'tls', mail_from_address: '', mail_from_name: '', is_active: true,
};

// Mengikuti EmailSmtpRequest di BE
function validate(f) {
  const e = {};
  if (!f.mail_host.trim()) e.mail_host = 'Host wajib diisi.';
  const port = Number(f.mail_port);
  if (!String(f.mail_port).trim()) e.mail_port = 'Port wajib diisi.';
  else if (!Number.isInteger(port) || port < 1 || port > 65535) e.mail_port = 'Port harus angka antara 1 dan 65535.';
  if (!f.mail_from_address.trim()) e.mail_from_address = 'Alamat email pengirim wajib diisi.';
  else if (!/^\S+@\S+\.\S+$/.test(f.mail_from_address.trim())) e.mail_from_address = 'Format email tidak valid.';
  if (!f.mail_from_name.trim()) e.mail_from_name = 'Nama pengirim wajib diisi.';
  return e;
}

// can = permission email-smtps.*
function EmailSmtpPanel({ can }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getEmailSmtps()
      .then((data) => { if (active) setRows(Array.isArray(data) ? data : data?.data ?? []); })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const isNew = editing === 'new';
  const errors = editing ? validate(form) : {};
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setForm(row === 'new' ? EMPTY : {
      mail_mailer: row.mail_mailer ?? 'smtp',
      mail_host: row.mail_host ?? '',
      mail_port: String(row.mail_port ?? ''),
      mail_username: row.mail_username ?? '',
      mail_password: row.mail_password ?? '',
      mail_encryption: row.mail_encryption ?? 'null',
      mail_from_address: row.mail_from_address ?? '',
      mail_from_name: row.mail_from_name ?? '',
      is_active: !!row.is_active,
    });
    setEditing(row);
  };
  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) return;

    const payload = {
      mail_mailer: form.mail_mailer,
      mail_host: form.mail_host.trim(),
      mail_port: Number(form.mail_port),
      mail_username: form.mail_username.trim() || null,
      mail_password: form.mail_password || null,
      mail_encryption: form.mail_encryption,
      mail_from_address: form.mail_from_address.trim(),
      mail_from_name: form.mail_from_name.trim(),
      is_active: form.is_active,
    };
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const res = await createEmailSmtp(payload);
        setRows((list) => [...list, res.data]);
        setSuccess(`SMTP ${payload.mail_host} ditambahkan.`);
      } else {
        const res = await updateEmailSmtp(editing.id, payload);
        setRows((list) => list.map((r) => (r.id === editing.id ? res.data : r)));
        setSuccess(`SMTP ${payload.mail_host} diperbarui.`);
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
      await deleteEmailSmtp(target.id);
      setRows((list) => list.filter((r) => r.id !== target.id));
      setSuccess(`SMTP ${target.mail_host} dihapus.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  const text = (key, label, props = {}) => (
    <div className="dash-form-group">
      <label htmlFor={`smtp-${key}`}>{label}</label>
      <input
        id={`smtp-${key}`}
        className={`dash-input${touched && errors[key] ? ' invalid' : ''}`}
        value={form[key]}
        onChange={set(key)}
        {...props}
      />
      {touched && errors[key] && <p className="dash-field-error">{errors[key]}</p>}
    </div>
  );

  const select = (key, label, options) => (
    <div className="dash-form-group">
      <label htmlFor={`smtp-${key}`}>{label}</label>
      <select id={`smtp-${key}`} className="dash-input" value={form[key]} onChange={set(key)}>
        {options.map((o) => <option key={o} value={o}>{o === 'null' ? 'Tanpa enkripsi' : o}</option>)}
      </select>
    </div>
  );

  const showActions = can.ubah || can.hapus;

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
          Email SMTP
        </h3>
        {can.tambah && <button id="btn-smtp-add" className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah SMTP</button>}
      </div>
      <p className="dash-card-desc">Server pengirim email sistem (OTP dan notifikasi).</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={3} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">Belum ada pengaturan SMTP.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Server</th>
                <th>Pengirim</th>
                <th>Enkripsi</th>
                <th>Status</th>
                {showActions && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong className="dash-cell-name">{r.mail_host}:{r.mail_port}</strong>
                    <small className="dash-cell-sub">{r.mail_mailer}{r.mail_username && ` · ${r.mail_username}`}</small>
                  </td>
                  <td>
                    {r.mail_from_name}
                    <small className="dash-cell-sub">{r.mail_from_address}</small>
                  </td>
                  <td>{r.mail_encryption === 'null' || !r.mail_encryption ? '-' : r.mail_encryption.toUpperCase()}</td>
                  <td><span className={`dash-status ${r.is_active ? 'aktif' : 'nonaktif'}`}>{r.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                  {showActions && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {can.ubah && <IconButton id={`btn-smtp-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                        {can.hapus && <IconButton id={`btn-smtp-delete-${r.id}`} icon="delete" label="Hapus" tone="danger" onClick={() => setToDelete(r)} />}
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
        <Modal as="form" onClose={saving ? undefined : closeForm} onSubmit={handleSubmit} noValidate>
          <h3>{isNew ? 'Tambah SMTP' : 'Ubah SMTP'}</h3>
          <div className="dash-form-row">
            {select('mail_mailer', 'Mailer *', MAILERS)}
            {select('mail_encryption', 'Enkripsi *', ENCRYPTIONS)}
          </div>
          <div className="dash-form-row">
            {text('mail_host', 'Host *', { placeholder: 'smtp.gmail.com', autoFocus: true })}
            {text('mail_port', 'Port *', { inputMode: 'numeric', placeholder: '587' })}
          </div>
          <div className="dash-form-row">
            {text('mail_username', 'Username', { autoComplete: 'off' })}
            {text('mail_password', 'Password', { type: 'password', autoComplete: 'new-password' })}
          </div>
          {text('mail_from_address', 'Email Pengirim *', { type: 'email', placeholder: 'noreply@domain.com' })}
          {text('mail_from_name', 'Nama Pengirim *')}
          <div className="dash-form-group">
            <label className="dash-check">
              <input id="smtp-is-active" type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
              Aktif
            </label>
          </div>
          <div className="dash-modal-actions">
            <button id="btn-smtp-cancel" type="button" className="dash-btn outline" onClick={closeForm} disabled={saving}>Batal</button>
            <button id="btn-smtp-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmModal title="Hapus SMTP" confirmLabel="Ya, Hapus" busyLabel="Menghapus..." busy={saving} onConfirm={handleDelete} onCancel={() => setToDelete(null)}>
          <p className="dash-card-desc">
            Yakin ingin menghapus pengaturan <strong>{toDelete.mail_host}</strong>? Pengiriman email bisa gagal bila tidak ada SMTP aktif.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default EmailSmtpPanel;
