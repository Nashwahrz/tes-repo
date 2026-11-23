// src/features/logs/components/ActivityLogPanel.jsx
// Riwayat perubahan data generik (dealer, master, wilayah, pengaturan, role, pengguna) dari BE {path}/logs. Hanya baca.
import { useEffect, useMemo, useState } from 'react';
import Toast from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import { getActivityLogs, errorMessage } from '../../../api/authServices';

const AKSI = {
  created: 'Ditambah',
  updated: 'Diubah',
  deleted: 'Dihapus',
  status_changed: 'Ubah Status',
  password_changed: 'Ubah Password',
};
const FIELD_LABEL = {
  name: 'Nama', email: 'Email', status: 'Status', alamat: 'Alamat', latitude: 'Latitude', longitude: 'Longitude', kode: 'Kode',
  fk_dealer: 'Dealer', fk_atasan: 'Atasan', fk_role: 'Role', fk_menu: 'Menu', fk_permission: 'Permission',
  dealer_name: 'Nama dealer', address: 'Alamat', role_name: 'Nama role', menu_name: 'Nama menu', sequence: 'Urutan', permission_name: 'Nama permission',
  agama_code: 'Kode', agama_name: 'Nama', pekerjaan_code: 'Kode', pekerjaan_name: 'Nama', type_header: 'Tipe header', sector_job: 'Sektor pekerjaan', id_parent: 'Kode induk',
  provinsi_code: 'Kode', provinsi_name: 'Nama',
  kabupaten_kota_code: 'Kode', kabupaten_kota_name: 'Nama', kecamatan_code: 'Kode', kecamatan_name: 'Nama', kelurahan_code: 'Kode', kelurahan_name: 'Nama',
  description: 'Keterangan', email_verification: 'Email terverifikasi', photo: 'Foto',
  fk_provinsi: 'Provinsi', fk_kabupaten_kota: 'Kabupaten/kota', fk_kecamatan: 'Kecamatan',
  host: 'Host', port: 'Port', username: 'Username', encryption: 'Enkripsi', from_address: 'Alamat pengirim', from_name: 'Nama pengirim',
  url: 'URL', ip: 'IP', ip_address: 'Alamat IP', max_attempts: 'Maks. percobaan', decay_minutes: 'Durasi blokir (menit)',
  me: 'Penginput', diverifikator: 'Diverifikasi oleh',
};
// Nilai rahasia tidak ditampilkan di layar
const SENSITIVE = /pass|secret|token|key/i;

const humanize = (k) => FIELD_LABEL[k] ?? k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const fmtVal = (k, v) => {
  if (v === null || v === undefined || v === '') return '-';
  if (SENSITIVE.test(k)) return '******';
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  if (typeof v === 'object') return v.name ?? (v.id != null ? `#${v.id}` : JSON.stringify(v));
  return String(v);
};

// Field yang tidak perlu ditampilkan di detail log (tidak informatif untuk user)
const SKIP_KEYS = new Set(['id', 'created_at', 'updated_at']);

// Daftar perubahan: [key, label, nilai lama, nilai baru] hanya untuk field yang berubah
function changesOf(log) {
  const lama = log.data_lama ?? {};
  const baru = log.data_baru ?? {};
  return [...new Set([...Object.keys(baru), ...Object.keys(lama)])]
    .filter((k) => !SKIP_KEYS.has(k) && JSON.stringify(lama[k]) !== JSON.stringify(baru[k]))
    .map((k) => [k, humanize(k), fmtVal(k, lama[k]), fmtVal(k, baru[k])]);
}

// Hitung diff untuk field berisi daftar koma: { diaktifkan, dinonaktifkan }
function menuDiff(lamaStr, baruStr) {
  const toSet = (s) => new Set((s === '-' ? '' : s).split(',').map((x) => x.trim()).filter(Boolean));
  const lama = toSet(lamaStr);
  const baru = toSet(baruStr);
  return {
    diaktifkan: [...baru].filter((m) => !lama.has(m)),
    dinonaktifkan: [...lama].filter((m) => !baru.has(m)),
  };
}

// Field yang ditampilkan sebagai diff (bukan sebelum/sesudah)
const DIFF_KEYS = new Set(['menu', 'permission']);

// BE: subject = { id, name } (null bila tidak ada)
const subjectOf = (l) => l.subject?.name ?? (l.subject?.id != null ? `#${l.subject.id}` : '-');

// sources: [{ key, group, label, path }] sumber log yang boleh dilihat user
function ActivityLogPanel({ sources }) {
  const [sourceKey, setSourceKey] = useState(sources[0].key);
  const source = sources.find((s) => s.key === sourceKey) ?? sources[0];
  const groups = useMemo(() => [...new Set(sources.map((s) => s.group))], [sources]);

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  // Pencarian ditunda agar tidak memanggil BE di setiap ketukan
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim() === search) return;
      setLoading(true);
      setPage(1);
      setSearch(query.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    let active = true;
    getActivityLogs(source.path, page, search)
      .then((res) => { if (active) { setRows(res.rows); setMeta(res.meta); setError(''); setLoading(false); } })
      .catch((err) => { if (active) { setRows([]); setMeta(null); setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [source.path, page, search]);

  const pickSource = (key) => {
    setLoading(true);
    setPage(1);
    setQuery('');
    setSearch('');
    setSourceKey(key);
  };

  const changes = detail ? changesOf(detail) : [];

  return (
    <div>
      <div className="dash-card-head">
        <h3>Riwayat Perubahan Data</h3>
      </div>
      <p className="dash-card-desc">Catatan siapa menambah, mengubah, atau menghapus data. Pilih jenis data yang ingin dilihat.</p>

      <div className="dash-toolbar">
        <select id="datalog-source" className="dash-input dash-select-filter" value={source.key} aria-label="Jenis data" onChange={(e) => pickSource(e.target.value)}>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {sources.filter((s) => s.group === g).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </optgroup>
          ))}
        </select>
        <input id="datalog-search" className="dash-input dash-input-search" type="search" placeholder="Cari nama data..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={5} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{search ? 'Riwayat tidak ditemukan.' : `Belum ada riwayat aktivitas ${source.label.toLowerCase()}.`}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Waktu</th><th>Data</th><th>Aksi</th><th>Oleh</th><th className="col-aksi">Rincian</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.waktu)}</td>
                  <td><strong className="dash-cell-name">{subjectOf(l)}</strong></td>
                  <td>{AKSI[l.aksi] ?? l.deskripsi ?? l.aksi}</td>
                  <td>{l.oleh?.name ?? 'Sistem'}</td>
                  <td className="col-aksi"><div className="dash-actions"><IconButton id={`btn-datalog-detail-${l.id}`} icon="view" label="Perubahan" onClick={() => setDetail(l)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="aktivitas" onPage={(p) => { setLoading(true); setPage(p); }} />
      )}

      {detail && (
        <Modal onClose={() => setDetail(null)} dismissOnBackdrop>
          <div className="dash-modal-head">
            <h3>{AKSI[detail.aksi] ?? detail.aksi}: {subjectOf(detail)}</h3>
            <button id="btn-datalog-close" type="button" className="dash-modal-close" onClick={() => setDetail(null)} aria-label="Tutup" title="Tutup">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="dash-card-desc">{source.label} · Oleh {detail.oleh?.name ?? 'Sistem'} · {fmtWaktu(detail.waktu)}</p>
          {changes.length === 0 ? (
            <p className="dash-empty">Tidak ada rincian perubahan.</p>
          ) : (
            <div className="log-changes-list">
              {changes.map(([k, label, lama, baru]) => {
                if (DIFF_KEYS.has(k)) {
                  const { diaktifkan, dinonaktifkan } = menuDiff(lama, baru);
                  return (
                    <div key={k} className="log-change-row">
                      <div className="log-change-field">{label}</div>
                      <div className="log-change-diff">
                        {diaktifkan.length > 0 && (
                          <div className="log-diff-group">
                            <span className="log-diff-heading log-diff-heading--added">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Diaktifkan
                            </span>
                            <div className="log-diff-pills">
                              {diaktifkan.map((m) => (
                                <span key={m} className="log-pill log-pill--added">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {dinonaktifkan.length > 0 && (
                          <div className="log-diff-group">
                            <span className="log-diff-heading log-diff-heading--removed">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Dinonaktifkan
                            </span>
                            <div className="log-diff-pills">
                              {dinonaktifkan.map((m) => (
                                <span key={m} className="log-pill log-pill--removed">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {diaktifkan.length === 0 && dinonaktifkan.length === 0 && (
                          <span className="acc-muted">Tidak ada perubahan</span>
                        )}
                      </div>
                    </div>
                  );
                }
                const isCreated = detail.aksi === 'created';
                const isDeleted = detail.aksi === 'deleted';

                return (
                  <div key={k} className="log-change-row">
                    <div className="log-change-field">{label}</div>
                    <div className="log-change-val">
                      {isCreated ? (
                        // Ditambah: seluruh data baru dibuat, tampilkan nilainya langsung
                        <span className="log-val-after">{baru}</span>
                      ) : isDeleted ? (
                        // Dihapus: seluruh data dihapus, tampilkan nilai yang dihapus
                        <span className="log-val-deleted">{lama}</span>
                      ) : (
                        // Diubah: tampilkan perubahan jelas sebelum (kosong atau nilai lama) → sesudah
                        <>
                          {lama === '-' ? (
                            <span className="log-val-empty">(kosong)</span>
                          ) : (
                            <span className="log-val-before">{lama}</span>
                          )}
                          <svg className="log-val-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                          {baru === '-' ? (
                            <span className="log-val-empty">(kosong)</span>
                          ) : (
                            <span className="log-val-after">{baru}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default ActivityLogPanel;
