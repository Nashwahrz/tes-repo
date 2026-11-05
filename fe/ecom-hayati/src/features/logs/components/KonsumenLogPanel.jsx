// src/features/logs/components/KonsumenLogPanel.jsx
// Riwayat aktivitas konsumen dari BE /konsumens/logs. Hanya baca.
// BE menggabungkan tiga jenis log (log_name): pengajuan (temp_konsumens), data konsumen, dan relasi penginput (konsumen_mes).
import { useEffect, useState } from 'react';
import Toast from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import { getKonsumenLogs, errorMessage } from '../../../api/authServices';

const AKSI = { created: 'Ditambah', updated: 'Diubah', deleted: 'Dihapus' };
const FIELD_LABEL = {
  nik: 'NIK', name: 'Nama', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat_ktp: 'Alamat sesuai KTP', alamat_domisili: 'Alamat domisili', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW',
  // BE mencatat wilayah/agama/pekerjaan sebagai kode
  kode_tmp_lahir: 'Kode tempat lahir', kode_kelurahan: 'Kode kelurahan/desa', kode_kecamatan: 'Kode kecamatan',
  kode_kabupaten_kota: 'Kode kabupaten/kota', kode_provinsi: 'Kode provinsi', kode_agama: 'Kode agama', kode_pekerjaan: 'Kode pekerjaan',
  status_perkawinan: 'Status perkawinan', kewarganegaraan: 'Kewarganegaraan',
  no_telp: 'No. telp', email: 'Email', status: 'Status', catatan_penolakan: 'Catatan penolakan',
  foto_ktp: 'Foto KTP', me: 'Penginput', diverifikator: 'Diverifikasi oleh', diverifikasi_pada: 'Waktu verifikasi',
  catatan: 'Catatan', tipe: 'Jenis pengajuan', id_konsumen: 'Konsumen',
};
// Nilai enum dari BE diganti label yang mudah dibaca
const NILAI = {
  status: { pending: 'Menunggu verifikasi', diterima: 'Diterima', revisi: 'Perlu revisi', ditolak: 'Ditolak' },
  tipe: { tambah: 'Tambah baru', edit: 'Perubahan data' },
};
// Jenis log menurut log_name di BE
const JENIS = { 'temp konsumen': 'Pengajuan', konsumen: 'Data konsumen', 'konsumen me': 'Penginput' };
const AKSI_JENIS = {
  'temp konsumen': { created: 'Pengajuan dibuat', updated: 'Pengajuan diubah', deleted: 'Pengajuan dihapus' },
  konsumen: { created: 'Konsumen ditambah', updated: 'Konsumen diubah', deleted: 'Konsumen dihapus' },
  'konsumen me': { created: 'Penginput ditautkan', updated: 'Penginput diubah', deleted: 'Penginput dilepas' },
};
const aksiOf = (l) => AKSI_JENIS[l.log_name]?.[l.aksi] ?? AKSI[l.aksi] ?? l.deskripsi ?? l.aksi;

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const fmtVal = (v, k) => {
  if (v === null || v === undefined || v === '') return '-';
  if (NILAI[k]?.[v]) return NILAI[k][v];
  if (k === 'id_konsumen') return `#${v}`;
  if (k === 'foto_ktp') return `Foto: ${String(v).split('/').pop()}`; // path di BE disingkat jadi nama file
  if (typeof v === 'object') return v.name ?? (v.id != null ? `#${v.id}` : JSON.stringify(v));
  return String(v);
};

// Daftar perubahan: [label, nilai lama, nilai baru] hanya untuk field yang berubah
function changesOf(log) {
  const lama = log.data_lama ?? {};
  const baru = log.data_baru ?? {};
  return [...new Set([...Object.keys(baru), ...Object.keys(lama)])]
    .filter((k) => k !== 'updated_at' && JSON.stringify(lama[k]) !== JSON.stringify(baru[k]))
    .map((k) => [FIELD_LABEL[k] ?? k, fmtVal(lama[k], k), fmtVal(baru[k], k)]);
}

// Nama konsumen: dari subject, atau dari isi log (pengajuan/konsumen punya name; relasi penginput hanya id_konsumen)
const namaOf = (l) => l.konsumen ?? l.user_subject ?? l.data_baru?.name ?? l.data_lama?.name
  ?? ((l.data_baru?.id_konsumen ?? l.data_lama?.id_konsumen) != null ? `Konsumen #${l.data_baru?.id_konsumen ?? l.data_lama?.id_konsumen}` : '-');

// Ringkasan data yang diubah untuk tabel: nama kolom saja, mis. "Nama, No. telp"
const ringkasan = (l) => {
  const c = changesOf(l);
  if (l.aksi === 'created') return 'Data baru dibuat';
  if (l.aksi === 'deleted') return 'Data dihapus';
  if (c.length === 0) return '-';
  return c.length > 4 ? `${c.slice(0, 4).map(([label]) => label).join(', ')} +${c.length - 4} lainnya` : c.map(([label]) => label).join(', ');
};

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
        <input id="konsumenlog-search" className="dash-input dash-input-search" type="search" placeholder="Cari nama konsumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
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
              <tr><th>Waktu</th><th>Konsumen</th><th>Jenis</th><th>Aktivitas</th><th>Data yang diubah</th><th>Oleh</th><th className="col-aksi">Rincian</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.waktu)}</td>
                  <td><strong className="dash-cell-name">{namaOf(l)}</strong></td>
                  <td>{JENIS[l.log_name] ?? l.log_name ?? '-'}</td>
                  <td>{aksiOf(l)}</td>
                  <td>{ringkasan(l)}</td>
                  <td>{l.oleh?.name ?? 'Sistem'}</td>
                  <td className="col-aksi"><div className="dash-actions"><IconButton id={`btn-konsumenlog-detail-${l.id}`} icon="view" label="Perubahan" onClick={() => setDetail(l)} /></div></td>
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
            <h3>{aksiOf(detail)}: {namaOf(detail)}</h3>
            <button id="btn-konsumenlog-close" type="button" className="dash-modal-close" onClick={() => setDetail(null)} aria-label="Tutup" title="Tutup">
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
        </Modal>
      )}
    </div>
  );
}

export default KonsumenLogPanel;
