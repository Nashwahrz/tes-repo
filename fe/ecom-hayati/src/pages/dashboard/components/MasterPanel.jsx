// src/pages/dashboard/components/MasterPanel.jsx
// Kelola data master: agama, pekerjaan (BE: /agamas, /pekerjaans) dan wilayah (provinsi, kabupaten/kota, kecamatan, kelurahan).
// Endpoint wilayah mengikuti pola yang sama; bila BE belum menyediakannya, tab menampilkan pemberitahuan.
import { useEffect, useState } from 'react';
import { getMasterPage, createMaster, updateMaster, deleteMaster, errorMessage } from '../../../api/authServices';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';

// perm: awalan permission BE (<perm>.lihat/tambah/ubah/hapus); parent: kolom foreign key ke induknya
const TABS = [
  { key: 'agama', label: 'Agama', path: '/agamas', perm: 'agamas', menu: 'agamas' },
  { key: 'pekerjaan', label: 'Pekerjaan', path: '/pekerjaans', perm: 'pekerjaans', menu: 'pekerjaans' },
  { key: 'provinsi', label: 'Provinsi', path: '/provinsis', wilayah: true },
  { key: 'kabupaten', label: 'Kabupaten / Kota', path: '/kabupaten-kotas', wilayah: true, parent: { field: 'id_provinsi', label: 'ID Provinsi' } },
  { key: 'kecamatan', label: 'Kecamatan', path: '/kecamatans', wilayah: true, parent: { field: 'id_kabupaten_kota', label: 'ID Kabupaten/Kota' } },
  { key: 'kelurahan', label: 'Kelurahan', path: '/kelurahans', wilayah: true, parent: { field: 'id_kecamatan', label: 'ID Kecamatan' } },
];

function MasterPanel({ hasMenu, can }) {
  // Agama/pekerjaan mengikuti menu & permission masing-masing. Wilayah belum punya permission di BE,
  // jadi tabnya tampil bagi yang boleh melihat master, dengan aksi mengikuti permission agamas.* sebagai acuan.
  const own = (t) => hasMenu(t.menu) && can(`${t.perm}.lihat`);
  const anyMaster = TABS.some((t) => !t.wilayah && own(t));
  const tabs = TABS.filter((t) => (t.wilayah ? anyMaster : own(t)));
  const [tabKey, setTabKey] = useState(tabs[0]?.key);
  const tab = tabs.find((t) => t.key === tabKey) ?? tabs[0];
  const perm = (action) => can(`${tab.wilayah ? 'agamas' : tab.perm}.${action}`);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [form, setForm] = useState({ name: '', parent: '' });
  const [touched, setTouched] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getMasterPage(tab.path, page)
      .then((res) => {
        if (!active) return;
        // Halaman terakhir baru saja kosong (data dihapus): mundur ke halaman terakhir yang ada
        if (res.rows.length === 0 && page > 1) { setPage(Math.max(res.meta.lastPage, 1)); return; }
        setRows(res.rows);
        setMeta(res.meta);
        setUnavailable(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setRows([]);
        setMeta({ page: 1, lastPage: 1, total: 0 });
        if (err.response?.status === 404 && tab.wilayah) setUnavailable(true);
        else { setUnavailable(false); setError(errorMessage(err)); }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [tab.path, page, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (k) => {
    if (k === tab.key) return;
    setTabKey(k);
    setPage(1);
    setLoading(true);
    setError('');
    setSuccess('');
  };

  const isNew = editing === 'new';
  const nameError = !form.name.trim() ? 'Nama wajib diisi.' : form.name.trim().length > 255 ? 'Maksimal 255 karakter.' : '';
  const parentError = tab.parent && form.parent && !/^\d+$/.test(form.parent) ? `${tab.parent.label} harus berupa angka.` : '';

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setForm({ name: row === 'new' ? '' : row.name, parent: row === 'new' ? '' : String(row[tab.parent?.field] ?? '') });
    setEditing(row);
  };
  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || parentError) return;
    const payload = { name: form.name.trim(), ...(tab.parent ? { [tab.parent.field]: form.parent ? Number(form.parent) : null } : {}) };
    setSaving(true);
    setError('');
    try {
      if (isNew) await createMaster(tab.path, payload);
      else await updateMaster(tab.path, editing.id, payload);
      setSuccess(`${tab.label} "${payload.name}" ${isNew ? 'ditambahkan' : 'diperbarui'}.`);
      closeForm();
      setReloadKey((k) => k + 1);
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
      await deleteMaster(tab.path, target.id);
      setSuccess(`${tab.label} "${target.name}" dihapus.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  const showAksi = perm('ubah') || perm('hapus');

  return (
    <div>
      <div className="dash-tabs wide" style={{ flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.key} className={`dash-tab${tab.key === t.key ? ' active' : ''}`} onClick={() => switchTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></svg>
          Daftar Agama & Pekerjaan · {tab.label}
        </h3>
        {perm('tambah') && !unavailable && <button className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah {tab.label}</button>}
      </div>
      <p className="dash-card-desc">Kelola daftar {tab.label.toLowerCase()} yang dipakai sebagai pilihan pada form.</p>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : unavailable ? (
        <p className="dash-alert warning">Endpoint <code>{tab.path}</code> belum tersedia di backend, jadi data {tab.label.toLowerCase()} belum dapat dimuat. Tab ini akan berfungsi setelah backend menyediakannya.</p>
      ) : rows.length === 0 ? (
        <p className="dash-empty">Belum ada data {tab.label.toLowerCase()}.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nama</th>
                {tab.parent && <th>{tab.parent.label}</th>}
                {showAksi && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong className="dash-cell-name">{r.name}</strong></td>
                  {tab.parent && <td>{r[tab.parent.field] ?? '-'}</td>}
                  {showAksi && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {perm('ubah') && <IconButton icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                        {perm('hapus') && <IconButton icon="delete" label="Hapus" tone="danger" onClick={() => setToDelete(r)} />}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!unavailable && <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit={tab.label.toLowerCase()} onPage={(p) => { setLoading(true); setPage(p); }} />}

      {editing && (
        <div className="dash-modal-bg" onClick={() => !saving && closeForm()}>
          <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <h3>{isNew ? 'Tambah' : 'Ubah'} {tab.label}</h3>
            <div className="dash-form-group">
              <label htmlFor="master-name">Nama *</label>
              <input
                id="master-name"
                className={`dash-input${touched && nameError ? ' invalid' : ''}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              {touched && nameError && <p className="dash-field-error">{nameError}</p>}
            </div>
            {tab.parent && (
              <div className="dash-form-group">
                <label htmlFor="master-parent">{tab.parent.label}</label>
                <input
                  id="master-parent"
                  className={`dash-input${touched && parentError ? ' invalid' : ''}`}
                  inputMode="numeric"
                  value={form.parent}
                  onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
                />
                {touched && parentError && <p className="dash-field-error">{parentError}</p>}
              </div>
            )}
            <div className="dash-modal-actions">
              <button type="button" className="dash-btn outline" onClick={closeForm} disabled={saving}>Batal</button>
              <button type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="dash-modal-bg" onClick={() => !saving && setToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hapus {tab.label}</h3>
            <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name}</strong>?</p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setToDelete(null)} disabled={saving}>Batal</button>
              <button className="dash-btn solid" onClick={handleDelete} disabled={saving}>{saving ? 'Menghapus...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterPanel;
