// src/features/logs/components/KonsumenLogPanel.jsx
// Riwayat aktivitas konsumen dari BE /konsumens/logs. Hanya baca.
// BE menggabungkan tiga jenis log (log_name): pengajuan (temp_konsumens), data konsumen, dan relasi penginput (konsumen_mes).
import { useEffect, useMemo, useState } from 'react';
import Toast from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import { getKonsumenLogs, errorMessage } from '../../../api/authServices';
import { getMasterByKode } from '../../../api/master';

const AKSI = { created: 'Ditambah', updated: 'Diubah', deleted: 'Dihapus' };
const FIELD_LABEL = {
  nik: 'NIK', konsumen_name: 'Nama', birth_date: 'Tanggal lahir', gender: 'Jenis kelamin',
  ktp_address: 'Alamat sesuai KTP', domicile_address: 'Alamat domisili', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW',
  // BE mencatat wilayah/agama/pekerjaan sebagai kode; namanya diambil dari data master di FE (lihat MASTER_PATH)
  fk_temp_lahir: 'Tempat lahir', fk_kelurahan: 'Kelurahan/desa', fk_kecamatan: 'Kecamatan',
  fk_kabupaten_kota: 'Kabupaten/kota', fk_provinsi: 'Provinsi', fk_agama: 'Agama', fk_pekerjaan: 'Pekerjaan',
  marital_status: 'Status perkawinan', nationality: 'Kewarganegaraan',
  phone: 'No. telp', email: 'Email', status: 'Status', note: 'Catatan penolakan',
  foto_ktp: 'Foto KTP', me: 'Penginput', diverifikator: 'Diverifikasi oleh', verified_at: 'Waktu verifikasi', verified_by: 'Diverifikasi oleh',
  type: 'Jenis pengajuan', fk_konsumen: 'Konsumen', konsumen: 'Konsumen',
};
// Nilai enum dari BE diganti label yang mudah dibaca
const NILAI = {
  status: { pending: 'Menunggu verifikasi', diterima: 'Diterima', revisi: 'Perlu revisi', ditolak: 'Ditolak' },
  type: { tambah: 'Tambah baru', edit: 'Perubahan data', revisi: 'Perbaikan revisi' },
};
// Kolom kode di log => endpoint data master (relasi lewat kolom kode, bukan id)
const MASTER_PATH = {
  fk_temp_lahir: '/kabupaten-kotas', fk_kelurahan: '/kelurahans', fk_kecamatan: '/kecamatans',
  fk_kabupaten_kota: '/kabupaten-kotas', fk_provinsi: '/provinsis', fk_agama: '/agamas', fk_pekerjaan: '/pekerjaans',
};
const masterKey = (k, kode) => `${k}#${kode}`;
// Jenis log menurut log_name di BE
const JENIS = { 'temp konsumen': 'Pengajuan', konsumen: 'Data konsumen', 'konsumen me': 'Penginput' };
const AKSI_JENIS = {
  'temp konsumen': { created: 'Pengajuan dibuat', updated: 'Pengajuan diubah', deleted: 'Pengajuan dihapus' },
  konsumen: { created: 'Konsumen ditambah', updated: 'Konsumen diubah', deleted: 'Konsumen dihapus' },
  'konsumen me': { created: 'Penginput ditautkan', updated: 'Penginput diubah', deleted: 'Penginput dilepas' },
};
const aksiOf = (l) => AKSI_JENIS[l.log_name]?.[l.aksi] ?? AKSI[l.aksi] ?? l.deskripsi ?? l.aksi;

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
// masters: { 'fk_provinsi#32': 'Jawa Barat' }; nama belum termuat/tidak ada = tampil kodenya saja
const fmtVal = (v, k, masters = {}) => {
  if (v === null || v === undefined || v === '') return '-';
  if (MASTER_PATH[k]) { const n = masters[masterKey(k, v)]; return n ? `${n} (${v})` : `Kode ${v}`; }
  if (NILAI[k]?.[v]) return NILAI[k][v];
  if (k === 'fk_konsumen') return `#${v}`;
  if (k === 'foto_ktp') return `Foto: ${String(v).split('/').pop()}`; // path di BE disingkat jadi nama file
  if (typeof v === 'object') return v.name ?? (v.id != null ? `#${v.id}` : JSON.stringify(v));
  return String(v);
};

// Daftar perubahan: [label, nilai lama, nilai baru] hanya untuk field yang berubah
function changesOf(log, masters) {
  const lama = log.data_lama ?? {};
  const baru = log.data_baru ?? {};
  return [...new Set([...Object.keys(baru), ...Object.keys(lama)])]
    .filter((k) => k !== 'updated_at' && JSON.stringify(lama[k]) !== JSON.stringify(baru[k]))
    .map((k) => [FIELD_LABEL[k] ?? k, fmtVal(lama[k], k, masters), fmtVal(baru[k], k, masters)]);
}

// Nama konsumen: dari subject, atau dari isi log (pengajuan/konsumen punya name; relasi penginput hanya fk_konsumen)
// names: { id konsumen: nama } dari log lain di halaman yang sama (log penginput tidak memuat nama konsumen)
// BE: subject = { id, name }; fk_konsumen di isi log sudah dipetakan jadi konsumen = { id, name }
const konsumenRefOf = (l) => l.data_baru?.konsumen ?? l.data_lama?.konsumen;
const idKonsumenOf = (l) => konsumenRefOf(l)?.id ?? l.data_baru?.fk_konsumen ?? l.data_lama?.fk_konsumen;
const namaOf = (l, names = {}) => l.subject?.name ?? l.data_baru?.konsumen_name ?? l.data_lama?.konsumen_name ?? konsumenRefOf(l)?.name
  ?? (idKonsumenOf(l) != null ? (names[idKonsumenOf(l)] ?? `Konsumen #${idKonsumenOf(l)}`) : '-');

// Kalimat untuk log penginput (konsumen_mes): siapa yang mengambil data konsumen
const penginputOf = (l) => {
  const me = l.data_baru?.me ?? l.data_lama?.me;
  return me?.name ?? (me?.id != null ? `User #${me.id}` : 'penginput');
};
const kalimatOf = (l, names) => {
  if (l.log_name !== 'konsumen me') return null;
  const nama = namaOf(l, names);
  if (l.aksi === 'created') return `Data konsumen ${nama} diambil oleh ${penginputOf(l)}`;
  if (l.aksi === 'deleted') return `${penginputOf(l)} dilepas dari data konsumen ${nama}`;
  return `Penginput data konsumen ${nama} diubah menjadi ${penginputOf(l)}`;
};

// Ringkasan data yang diubah untuk tabel: nama kolom saja, mis. "Nama, No. telp"
const ringkasan = (l) => {
  const c = changesOf(l);
  if (l.log_name === 'konsumen me') return 'Penautan penginput';
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
  const [group, setGroup] = useState(''); // '' = semua jenis log

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
    getKonsumenLogs(page, search, group)
      .then((res) => { if (active) { setRows(res.rows); setMeta(res.meta); setError(''); setLoading(false); } })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [page, search, group]);

  // Nama konsumen untuk log penginput, diambil dari log konsumen/pengajuan lain di halaman ini
  const names = useMemo(() => {
    const m = {};
    rows.forEach((l) => {
      const id = l.log_name === 'konsumen' ? l.subject?.id : idKonsumenOf(l);
      const nama = l.subject?.name ?? l.data_baru?.konsumen_name ?? l.data_lama?.konsumen_name ?? konsumenRefOf(l)?.name;
      if (id != null && nama) m[id] = nama;
    });
    return m;
  }, [rows]);

  // Nama data master dari kode di rincian yang dibuka (hasilnya di-cache oleh getMasterByKode)
  const [masters, setMasters] = useState({});
  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const pairs = new Set();
    [detail.data_lama, detail.data_baru].forEach((d) => Object.keys(MASTER_PATH).forEach((k) => d?.[k] && pairs.add(`${k}|${d[k]}`)));
    pairs.forEach((p) => {
      const [k, kode] = p.split('|');
      getMasterByKode(MASTER_PATH[k], kode)
        .then((m) => { if (active && m?.name) setMasters((prev) => ({ ...prev, [masterKey(k, kode)]: m.name })); })
        .catch(() => {});
    });
    return () => { active = false; };
  }, [detail]);
  const changes = detail ? changesOf(detail, masters) : [];

  return (
    <div>
      <div className="dash-card-head">
        <h3>Riwayat Aktivitas Konsumen</h3>
      </div>
      <p className="dash-card-desc">Catatan siapa menambah, mengubah, memverifikasi, atau menghapus data konsumen.</p>

      <div className="dash-toolbar">
        <input id="konsumenlog-search" className="dash-input dash-input-search" type="search" placeholder="Cari nama konsumen..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="konsumenlog-group" className="dash-input" value={group} aria-label="Kelompok log"
          onChange={(e) => { setLoading(true); setPage(1); setGroup(e.target.value); }}>
          <option value="">Semua kelompok</option>
          {Object.entries(JENIS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
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
              {rows.filter((l) => !group || l.log_name === group).map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.waktu)}</td>
                  <td><strong className="dash-cell-name">{namaOf(l, names)}</strong></td>
                  <td>{JENIS[l.log_name] ?? l.log_name ?? '-'}</td>
                  <td>{kalimatOf(l, names) ?? aksiOf(l)}</td>
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
            <h3>{kalimatOf(detail, names) ?? `${aksiOf(detail)}: ${namaOf(detail, names)}`}</h3>
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
