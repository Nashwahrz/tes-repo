// src/pages/dashboard/components/LoginLogPanel.jsx
// Riwayat login pengguna dari BE /log-users (IP, lokasi, perangkat). Hanya baca.
import { useEffect, useState } from 'react';
import Toast from './Toast';
import Loading from './Loading';
import Pager from './Pager';
import { getLoginLogs, errorMessage } from '../../../api/authServices';

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const lokasi = (l) => [l.city, l.region, l.country].filter(Boolean).join(', ');
const perangkat = (l) => [l.browser, l.platform, l.device].filter(Boolean).join(' · ');

const PAGE_SIZE = 10;

function LoginLogPanel() {
  const [all, setAll] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getLoginLogs()
      .then((rows) => { if (active) { setAll(Array.isArray(rows) ? rows : []); setLoading(false); } })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, []);

  // Terbaru di atas; BE hanya memuat nama pengguna, jadi pencarian dilakukan di sisi klien
  const q = query.trim().toLowerCase();
  const filtered = all
    .toSorted((a, b) => new Date(b.logged_in_at) - new Date(a.logged_in_at))
    .filter((l) => !q || `${l.user?.name ?? ''} ${l.ip_address} ${lokasi(l)} ${perangkat(l)}`.toLowerCase().includes(q));
  const lastPage = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const current = Math.min(page, lastPage);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div>
      <div className="dash-card-head">
        <h3>Log Login Pengguna</h3>
      </div>
      <p className="dash-card-desc">Catatan login pengguna beserta alamat IP, lokasi, dan perangkat.</p>

      <div className="dash-toolbar">
        <input id="loginlog-search" className="dash-input dash-input-search" type="search" placeholder="Cari pengguna, IP, lokasi, atau perangkat..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={5} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{q ? 'Log tidak ditemukan.' : 'Belum ada log login.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Waktu</th><th>Pengguna</th><th>IP</th><th>Lokasi</th><th>Perangkat</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.logged_in_at)}</td>
                  <td><strong className="dash-cell-name">{l.user?.name ?? `Pengguna #${l.id_user}`}</strong></td>
                  <td>{l.ip_address}</td>
                  <td>{lokasi(l) || '-'}</td>
                  <td>{perangkat(l) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <Pager page={current} lastPage={lastPage} total={filtered.length} unit="log" onPage={setPage} />
      )}
    </div>
  );
}

export default LoginLogPanel;
