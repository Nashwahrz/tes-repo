// src/pages/dashboard/components/MasterPanel.jsx
// Kelola data master: agama, pekerjaan (BE: /agamas, /pekerjaans) dan wilayah (provinsi, kabupaten/kota, kecamatan, kelurahan).
// Data baru bisa ditambahkan lewat formulir (satu per satu) atau impor Excel (MasterImportModal).
// Tiap data punya kode (unik, tidak bisa diubah) dan status. Data tidak dihapus, hanya dinonaktifkan (PUT {path}/{id}/status).
// Induk wilayah dihubungkan lewat kode (kode_provinsi, kode_kabupaten_kota, kode_kecamatan).
import { useEffect, useState } from 'react';
import { getMasterPage, getMasterOptions, getMasterByKode, searchMaster, createMaster, updateMaster, setMasterStatus, errorMessage } from '../../../api/authServices';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';
import MasterImportModal from './MasterImportModal';

// filters: filter induk di atas tabel. Kelurahan tidak punya karena BE belum menyaring per induk dan datanya puluhan ribu.
// perm: awalan permission BE (<perm>.lihat/tambah/ubah; ganti status memakai .ubah); parent: kolom kode induk + endpoint induk (untuk menampilkan namanya)
const PAGE_SIZE = 10;
const TABS = [
  { key: 'agama', label: 'Agama', path: '/agamas', perm: 'agamas', menu: 'agamas' },
  { key: 'pekerjaan', label: 'Pekerjaan', path: '/pekerjaans', perm: 'pekerjaans', menu: 'pekerjaans' },
  { key: 'provinsi', label: 'Provinsi', path: '/provinsis', perm: 'provinsis', wilayah: true },
  { key: 'kabupaten', label: 'Kabupaten / Kota', path: '/kabupaten-kotas', perm: 'kabupaten-kotas', wilayah: true, parent: { field: 'kode_provinsi', label: 'Provinsi', path: '/provinsis' }, filters: ['provinsi'] },
  { key: 'kecamatan', label: 'Kecamatan', path: '/kecamatans', perm: 'kecamatans', wilayah: true, parent: { field: 'kode_kabupaten_kota', label: 'Kabupaten / Kota', path: '/kabupaten-kotas' }, filters: ['provinsi', 'kabupaten'] },
  { key: 'kelurahan', label: 'Kelurahan', path: '/kelurahans', perm: 'kelurahans', wilayah: true, parent: { field: 'kode_kecamatan', label: 'Kecamatan', path: '/kecamatans' } },
];
const isActive = (r) => r.status !== false;
// Kabupaten/kota milik satu provinsi (kode); semua status ikut, karena ini layar kelola
const kabupatenOf = async (kodeProv) => (await getMasterOptions('/kabupaten-kotas')).filter((k) => !kodeProv || String(k.kode_provinsi) === String(kodeProv));

// Tab dipilih lewat submenu Data Master di sidebar; hak akses menunya sudah diperiksa di DashboardPage
// Pilih induk lewat nama (bukan ID): ketik untuk mencari, klik hasilnya
function ParentPicker({ parent, value, name, onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [doneFor, setDoneFor] = useState(''); // query yang hasilnya sudah selesai dimuat

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchMaster(parent.path, q, ctrl.signal)
        .then((rows) => setResults(rows))
        .catch(() => {})
        .finally(() => !ctrl.signal.aborted && setDoneFor(q));
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, parent.path]);

  // "Mencari..." juga selama menunggu user berhenti mengetik, supaya tidak sempat tampil "Tidak ditemukan" / hasil lama
  const busy = query.trim().length >= 2 && doneFor !== query.trim();

  return (
    <div>
      {value && (
        <p className="dash-card-desc" style={{ marginBottom: 6 }}>
          Dipilih: <strong>{name || '...'}</strong>{' '}
          <button id="btn-master-parent-clear" type="button" className="dash-link" onClick={() => onPick('', '')}>Hapus</button>
        </p>
      )}
      <input
        id="master-parent"
        className="dash-input"
        placeholder={`Ketik nama ${parent.label.toLowerCase()}...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {query.trim().length >= 2 && (
        <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, maxHeight: 160, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 8 }}>
          {busy && <li style={{ padding: '8px 10px', color: 'var(--muted)' }}>Mencari...</li>}
          {!busy && results.length === 0 && <li style={{ padding: '8px 10px', color: 'var(--muted)' }}>Tidak ditemukan.</li>}
          {results.map((r) => (
            <li key={r.id}>
              <button id={`btn-master-parent-option-${r.kode}`} type="button" className="dash-menu-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, padding: '8px 10px', cursor: 'pointer' }} onClick={() => { onPick(String(r.kode), r.name); setQuery(''); }}>
                {r.name} <span style={{ color: 'var(--muted)' }}>· {r.kode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MasterPanel({ tabKey, can }) {
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const perm = (action) => can(`${tab.perm}.${action}`);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // query yang sudah ditunda (debounce) dan dikirim ke BE
  const [loading, setLoading] = useState(true);
  const [fProv, setFProv] = useState(''); // filter provinsi (kode) pada tab kabupaten/kecamatan
  const [fKab, setFKab] = useState(''); // filter kabupaten/kota (kode) pada tab kecamatan
  const [provOptions, setProvOptions] = useState([]);
  const [kabOptions, setKabOptions] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'new' | row
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ kode: '', name: '', parent: '', parentName: '' });
  const [parentNames, setParentNames] = useState({}); // kode induk -> nama, untuk kolom induk di tabel
  const [touched, setTouched] = useState(false);
  const [toToggle, setToToggle] = useState(null); // baris yang statusnya akan diganti
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const filtered = !!(tab.filters && (fProv || fKab));

  // Pilihan filter: provinsi (sekali), kabupaten/kota menurut provinsi yang dipilih
  useEffect(() => {
    if (!tab.filters) return;
    getMasterOptions('/provinsis').then(setProvOptions).catch(() => {});
  }, [tab.filters]);
  useEffect(() => {
    if (!tab.filters?.includes('kabupaten')) return;
    kabupatenOf(fProv).then(setKabOptions).catch(() => {});
  }, [tab.filters, fProv]);

  const changeFilter = (setter, value, resetKab = false) => {
    setLoading(true);
    setPage(1);
    setter(value);
    if (resetKab) setFKab('');
  };

  useEffect(() => {
    let active = true;
    if (filtered) {
      // BE belum menyaring per induk: seluruh data tab dimuat sekali (di-cache), disaring dan dipecah per halaman di sini
      (async () => {
        const all = await getMasterOptions(tab.path);
        let list;
        if (tab.key === 'kabupaten') list = all.filter((r) => String(r.kode_provinsi) === fProv);
        else if (fKab) list = all.filter((r) => String(r.kode_kabupaten_kota) === fKab);
        else {
          const kodes = new Set((await kabupatenOf(fProv)).map((k) => String(k.kode)));
          list = all.filter((r) => kodes.has(String(r.kode_kabupaten_kota)));
        }
        const q = search.toLowerCase();
        if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || String(r.kode).toLowerCase().includes(q));
        const lastPage = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
        const p = Math.min(page, lastPage);
        if (!active) return;
        setRows(list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE));
        setMeta({ page: p, lastPage, total: list.length });
        setUnavailable(false);
        setError('');
      })()
        .catch((err) => { if (active) { setRows([]); setMeta({ page: 1, lastPage: 1, total: 0 }); setError(errorMessage(err)); } })
        .finally(() => active && setLoading(false));
      return () => { active = false; };
    }
    getMasterPage(tab.path, page, search)
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
  }, [tab.path, page, search, reloadKey, fProv, fKab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pencarian ditunda 400 ms setelah berhenti mengetik, lalu kembali ke halaman pertama
  useEffect(() => {
    const q = query.trim();
    if (q === search) return undefined;
    const t = setTimeout(() => { setLoading(true); setPage(1); setSearch(q); }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  // Kolom induk menampilkan nama; nama diambil menurut kode induk yang ada di halaman ini
  useEffect(() => {
    if (!tab.parent) return;
    const kodes = [...new Set(rows.map((r) => r[tab.parent.field]).filter(Boolean))].filter((k) => !(k in parentNames));
    kodes.forEach((k) => {
      getMasterByKode(tab.parent.path, k)
        .then((d) => setParentNames((m) => ({ ...m, [k]: d?.name ?? '-' })))
        .catch(() => setParentNames((m) => ({ ...m, [k]: '-' })));
    });
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const nameError = !form.name.trim() ? 'Nama wajib diisi.' : form.name.trim().length > 255 ? 'Maksimal 255 karakter.' : '';
  const isNew = editing === 'new';
  // Mengikuti request BE: kode wajib & hanya angka (1-10 digit) saat tambah; induk wajib pada wilayah
  const kodeError = !isNew ? '' : !form.kode.trim() ? 'Kode wajib diisi.' : !/^\d{1,10}$/.test(form.kode.trim()) ? 'Kode harus berupa angka 1-10 digit.' : '';
  const parentError = tab.parent && !form.parent ? `${tab.parent.label} wajib dipilih.` : '';

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    const pid = row === 'new' ? '' : String(row[tab.parent?.field] ?? '');
    setForm({ kode: row === 'new' ? '' : row.kode ?? '', name: row === 'new' ? '' : row.name, parent: pid, parentName: pid ? parentNames[pid] ?? '' : '' });
    setEditing(row);
  };
  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || kodeError || parentError) return;
    const payload = { ...(isNew ? { kode: form.kode.trim() } : {}), name: form.name.trim(), ...(tab.parent ? { [tab.parent.field]: form.parent } : {}) };
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

  const handleToggle = async () => {
    const target = toToggle;
    const next = !isActive(target);
    setSaving(true);
    setError('');
    try {
      await setMasterStatus(tab.path, target.id, next);
      setSuccess(`${tab.label} "${target.name}" ${next ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToToggle(null);
    }
  };

  const showAksi = perm('ubah');

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></svg>
          Data Master · {tab.label}
        </h3>
        {perm('tambah') && !unavailable && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button id={`btn-master-${tab.key}-import`} className="dash-btn outline" onClick={() => { setSuccess(''); setError(''); setImporting(true); }}>Impor Excel</button>
            <button id={`btn-master-${tab.key}-add`} className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah {tab.label}</button>
          </div>
        )}
      </div>
      <p className="dash-card-desc">Kelola daftar {tab.label.toLowerCase()} yang dipakai sebagai pilihan pada form.</p>

      <div className="dash-toolbar">
        <input id={`master-${tab.key}-search`}
          className="dash-input"
          style={{ maxWidth: 320 }}
          type="search"
          placeholder={`Cari ${tab.label.toLowerCase()}...`}
          aria-label={`Cari ${tab.label}`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tab.filters && (
          <select id={`master-${tab.key}-filter-provinsi`} className="dash-input" style={{ maxWidth: 220 }} aria-label="Filter provinsi" value={fProv} onChange={(e) => changeFilter(setFProv, e.target.value, true)}>
            <option value="">Semua provinsi</option>
            {provOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {tab.filters?.includes('kabupaten') && (
          <select id={`master-${tab.key}-filter-kabupaten`} className="dash-input" style={{ maxWidth: 240 }} aria-label="Filter kabupaten/kota" value={fKab} onChange={(e) => changeFilter(setFKab, e.target.value)}>
            <option value="">Semua kabupaten / kota</option>
            {kabOptions.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        )}
        {filtered && <button id={`btn-master-${tab.key}-clear-filter`} type="button" className="dash-link" onClick={() => { setLoading(true); setPage(1); setFProv(''); setFKab(''); }}>Hapus filter</button>}
      </div>
      {tab.key === 'kecamatan' && filtered && loading && <p className="dash-map-hint">Memuat seluruh data kecamatan untuk disaring. Hanya sekali; berikutnya langsung tampil.</p>}

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : unavailable ? (
        <p className="dash-alert warning">Endpoint <code>{tab.path}</code> belum tersedia di backend, jadi data {tab.label.toLowerCase()} belum dapat dimuat. Tab ini akan berfungsi setelah backend menyediakannya.</p>
      ) : rows.length === 0 ? (
        <p className="dash-empty">{filtered && !search ? `Tidak ada ${tab.label.toLowerCase()} pada filter ini.` : search ? `Tidak ada ${tab.label.toLowerCase()} yang cocok dengan "${search}".` : `Belum ada data ${tab.label.toLowerCase()}.`}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                {tab.parent && <th>{tab.parent.label}</th>}
                <th>Status</th>
                {showAksi && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.kode ?? '-'}</td>
                  <td><strong className="dash-cell-name">{r.name}</strong></td>
                  {tab.parent && <td>{r[tab.parent.field] ? parentNames[r[tab.parent.field]] ?? '...' : '-'}</td>}
                  <td><span className={`dash-status ${isActive(r) ? 'aktif' : 'nonaktif'}`}>{isActive(r) ? 'Aktif' : 'Nonaktif'}</span></td>
                  {showAksi && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {perm('ubah') && <IconButton id={`btn-master-${tab.key}-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                        <IconButton id={`btn-master-${tab.key}-status-${r.id}`} icon={isActive(r) ? 'ban' : 'check'} label={isActive(r) ? 'Nonaktifkan' : 'Aktifkan'} tone={isActive(r) ? 'danger' : 'ok'} onClick={() => setToToggle(r)} />
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

      {importing && (
        <MasterImportModal
          tab={tab}
          onClose={() => setImporting(false)}
          onImported={() => { setLoading(true); setPage(1); setReloadKey((k) => k + 1); }}
        />
      )}

      {editing && (
        <div className="dash-modal-bg">
          <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <h3>{isNew ? 'Tambah' : 'Ubah'} {tab.label}</h3>
            <div className="dash-form-group">
              <label htmlFor="master-kode">Kode{isNew ? ' *' : ''}</label>
              <input
                id="master-kode"
                className={`dash-input${touched && kodeError ? ' invalid' : ''}`}
                value={form.kode}
                onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
                inputMode="numeric"
                maxLength={10}
                disabled={!isNew}
                autoFocus={isNew}
              />
              {touched && kodeError && <p className="dash-field-error">{kodeError}</p>}
              {!isNew && <p className="dash-map-hint">Kode tidak dapat diubah.</p>}
            </div>
            <div className="dash-form-group">
              <label htmlFor="master-name">Nama *</label>
              <input
                id="master-name"
                className={`dash-input${touched && nameError ? ' invalid' : ''}`}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus={!isNew}
              />
              {touched && nameError && <p className="dash-field-error">{nameError}</p>}
            </div>
            {tab.parent && (
              <div className="dash-form-group">
                <label htmlFor="master-parent">{tab.parent.label} *</label>
                <ParentPicker parent={tab.parent} value={form.parent} name={form.parentName} onPick={(kode, name) => setForm((f) => ({ ...f, parent: kode, parentName: name }))} />
                {touched && parentError && <p className="dash-field-error">{parentError}</p>}
              </div>
            )}
            <div className="dash-modal-actions">
              <button id={`btn-master-${tab.key}-cancel`} type="button" className="dash-btn outline" onClick={closeForm} disabled={saving}>Batal</button>
              <button id={`btn-master-${tab.key}-save`} type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {toToggle && (
        <ConfirmModal
          title={`${isActive(toToggle) ? 'Nonaktifkan' : 'Aktifkan'} ${tab.label}`}
          confirmLabel={isActive(toToggle) ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          busyLabel="Menyimpan..."
          busy={saving}
          onConfirm={handleToggle}
          onCancel={() => setToToggle(null)}
        >
          <p className="dash-card-desc">
            {isActive(toToggle)
              ? <>Yakin ingin menonaktifkan <strong>{toToggle.name}</strong>? Data tidak muncul lagi sebagai pilihan pada form, tetapi data yang sudah tersimpan tetap utuh.</>
              : <>Aktifkan kembali <strong>{toToggle.name}</strong> sebagai pilihan pada form?</>}
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default MasterPanel;
