// src/pages/dashboard/components/KonsumenLogPanel.jsx
// Riwayat aktivitas konsumen (tambah/ubah/verifikasi/hapus) dari BE /konsumens/logs. Hanya baca.
import { useEffect, useState } from 'react';
import Toast from './Toast';
import Loading from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import { getKonsumenLogs, errorMessage } from '../../../api/authServices';

const AKSI = { created: 'Ditambah', updated: 'Diubah', deleted: 'Dihapus' };
const FIELD_LABEL = {
  nik: 'NIK', name: 'Nama', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat: 'Alamat', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW',
  // BE mencatat wilayah/agama/pekerjaan sebagai ID
  id_tmp_lahir: 'ID tempat lahir', id_kelurahan: 'ID kelurahan/desa', id_kecamatan: 'ID kecamatan',
  id_kabupaten_kota: 'ID kabupaten/kota', id_provinsi: 'ID provinsi', id_agama: 'ID agama', id_pekerjaan: 'ID pekerjaan',
  status_perkawinan: 'Status perkawinan', kewarganegaraan: 'Kewarganegaraan',
  no_telp: 'No. telp', email: 'Email', status: 'Status', catatan_penolakan: 'Catatan penolakan',
  foto_ktp: 'Foto KTP', me: 'Penginput', diverifikator: 'Diverifikasi oleh', diverifikasi_pada: 'Waktu verifikasi',
};

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const fmtVal = (v) => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') return v.name ?? (v.id != null ? `#${v.id}` : JSON.stringify(v));
  return String(v);
};

// Daftar perubahan: [label, nilai lama, nilai baru] hanya untuk field yang berubah
function changesOf(log) {
  const lama = log.data_lama ?? {};
  const baru = log.data_baru ?? {};
  return [...new Set([...Object.keys(baru), ...Object.keys(lama)])]
    .filter((k) => k !== 'updated_at' && JSON.stringify(lama[k]) !== JSON.stringify(baru[k]))
    .map((k) => [FIELD_LABEL[k] ?? k, fmtVal(lama[k]), fmtVal(baru[k])]);
}

function KonsumenLogPanel() {
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
    getKonsumenLogs(page, search)
      .then((res) => { if (active) { setRows(res.rows); setMeta(res.meta); setError(''); setLoading(false); } })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [page, search]);

  const changes = detail ? changesOf(detail) : [];

  return (
    <div>
      <div className="dash-card-head">
        <h3>Riwayat Aktivitas Konsumen</h3>
      </div>
      <p className="dash-card-desc">Catatan siapa menambah, mengubah, memverifikasi, atau menghapus data konsumen.</p>

      <div className="dash-toolbar">
        <input className="dash-input dash-input-search" type="search" placeholder="Cari nama konsumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={5} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{search ? 'Riwayat tidak ditemukan.' : 'Belum ada riwayat aktivitas.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Waktu</th><th>Konsumen</th><th>Aksi</th><th>Oleh</th><th className="col-aksi">Aksi</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.waktu)}</td>
                  <td><strong className="dash-cell-name">{l.konsumen || '-'}</strong></td>
                  <td>{AKSI[l.aksi] ?? l.deskripsi ?? l.aksi}</td>
                  <td>{l.oleh?.name ?? 'Sistem'}</td>
                  <td className="col-aksi"><div className="dash-actions"><IconButton icon="view" label="Perubahan" onClick={() => setDetail(l)} /></div></td>
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
        <div className="dash-modal-bg" onClick={() => setDetail(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3>{AKSI[detail.aksi] ?? detail.aksi}: {detail.konsumen || '-'}</h3>
              <button type="button" className="dash-modal-close" onClick={() => setDetail(null)} aria-label="Tutup" title="Tutup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="dash-card-desc">Oleh {detail.oleh?.name ?? 'Sistem'} · {fmtWaktu(detail.waktu)}</p>
            {changes.length === 0 ? (
              <p className="dash-empty">Tidak ada rincian perubahan.</p>
            ) : (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead><tr><th>Data</th><th>Sebelum</th><th>Sesudah</th></tr></thead>
                  <tbody>
                    {changes.map(([label, lama, baru]) => (
                      <tr key={label}><td>{label}</td><td className="acc-muted">{lama}</td><td><strong>{baru}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default KonsumenLogPanel;
