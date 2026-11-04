// src/pages/dashboard/components/BlockedUserLogPanel.jsx
// Akun/IP yang diblokir rate limit dari BE /log-blocked-users, beserta tombol buka blokir.
import { useEffect, useState } from 'react';
import Toast from './Toast';
import Loading from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';
import { getBlockedUsers, unblockUser, errorMessage } from '../../../api/authServices';

const TYPE_LABEL = { login: 'Login', 'otp-send': 'Kirim OTP', 'otp-verify': 'Verifikasi OTP', 'scan-ktp': 'Scan KTP' };
const STATUS_LABEL = { aktif: 'Diblokir', dibuka: 'Dibuka', kedaluwarsa: 'Kedaluwarsa' };

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const fmtSisa = (sec) => {
  const m = Math.floor(sec / 60);
  return m > 0 ? `${m} menit ${sec % 60} detik` : `${sec} detik`;
};

function BlockedUserLogPanel() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(() => Date.now());

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
    getBlockedUsers({ page, search, type, status })
      .then((res) => { if (active) { setRows(res.rows); setMeta(res.meta); setError(''); setLoading(false); } })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [page, search, type, status, reload]);

  // Sisa waktu blokir berjalan mundur selama ada blokir aktif di halaman ini
  const hasActive = rows.some((r) => r.status === 'aktif');
  useEffect(() => {
    if (!hasActive) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasActive]);

  const sisa = (r) => Math.max(0, Math.ceil((new Date(r.blocked_until) - now) / 1000));
  // Blokir yang waktunya sudah habis di layar tampil sebagai kedaluwarsa tanpa menunggu muat ulang
  const statusOf = (r) => (r.status === 'aktif' && sisa(r) === 0 ? 'kedaluwarsa' : r.status);

  const filter = (setter) => (e) => { setLoading(true); setPage(1); setter(e.target.value); };

  const confirmUnblock = async () => {
    setBusy(true);
    try {
      await unblockUser(target.id);
      setSuccess(`Blokir ${target.email || target.ip_address} berhasil dibuka.`);
      setTarget(null);
      setLoading(true);
      setReload((n) => n + 1);
    } catch (err) {
      setError(errorMessage(err));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>Akun Terblokir</h3>
      </div>
      <p className="dash-card-desc">Akun dan IP yang diblokir sementara karena terlalu banyak percobaan. Blokir aktif bisa dibuka lebih awal.</p>

      <div className="dash-toolbar">
        <input id="blocked-search" className="dash-input dash-input-search" type="search" placeholder="Cari email atau IP..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="blocked-filter-type" className="dash-input dash-select-filter" value={type} onChange={filter(setType)} aria-label="Filter jenis blokir">
          <option value="">Semua jenis</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select id="blocked-filter-status" className="dash-input dash-select-filter" value={status} onChange={filter(setStatus)} aria-label="Filter status blokir">
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <Loading rows={5} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{search || type || status ? 'Data tidak ditemukan.' : 'Belum ada akun yang diblokir.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Waktu</th><th>Email</th><th>IP</th><th>Jenis</th><th>Status</th><th className="col-aksi">Aksi</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = statusOf(r);
                return (
                  <tr key={r.id}>
                    <td>{fmtWaktu(r.blocked_at)}</td>
                    <td><strong className="dash-cell-name">{r.email || '-'}</strong><span className="dash-note">{r.attempts}x percobaan</span></td>
                    <td>{r.ip_address}</td>
                    <td>{TYPE_LABEL[r.type] ?? r.type}<span className="dash-note">{r.reason}</span></td>
                    <td>
                      <span className={`dash-status ${st}`}>{STATUS_LABEL[st] ?? st}</span>
                      {st === 'aktif' && <span className="dash-note">sisa {fmtSisa(sisa(r))}</span>}
                      {st === 'dibuka' && <span className="dash-note">oleh {r.unblocker?.name ?? '-'} · {fmtWaktu(r.unblocked_at)}</span>}
                    </td>
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {st === 'aktif' && <IconButton id={`btn-blocked-unblock-${r.id}`} icon="check" tone="ok" label="Buka Blokir" onClick={() => setTarget(r)} />}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="blokir" onPage={(p) => { setLoading(true); setPage(p); }} />
      )}

      {target && (
        <ConfirmModal title="Buka Blokir" confirmLabel="Ya, Buka Blokir" busyLabel="Membuka..." busy={busy} onConfirm={confirmUnblock} onCancel={() => setTarget(null)}>
          <p className="dash-card-desc">Buka blokir <strong>{target.email || target.ip_address}</strong> ({TYPE_LABEL[target.type] ?? target.type})? Pengguna bisa mencoba lagi segera.</p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default BlockedUserLogPanel;
