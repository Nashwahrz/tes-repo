// src/pages/AccUserPanel.jsx
import { useState } from 'react';
import { updateUserStatus } from '../../../api/authServices';

const TABS = [
  { key: 'semua', label: 'Semua', empty: 'Belum ada akun.' },
  { key: 'pending', label: 'Menunggu', empty: 'Tidak ada akun yang menunggu persetujuan.' },
  { key: 'aktif', label: 'Aktif', empty: 'Belum ada akun aktif.' },
  { key: 'nonaktif', label: 'Nonaktif', empty: 'Tidak ada akun nonaktif.' },
  { key: 'ditolak', label: 'Ditolak', empty: 'Tidak ada akun yang ditolak.' },
  { key: 'log', label: 'Log Akses' },
];

// Tab Log Akses disembunyikan sampai BE mencatat & menyediakan data sessions
const SHOW_LOG_TAB = false;

// Belum ada endpoint log akses di BE; isi dari tabel sessions (ip_address, latitude, longitude, user_agent, last_activity)
const ACCESS_LOGS = [];

// Aksi per tab: [label tombol, status tujuan, kata kerja untuk pesan sukses]
const ACTIONS = {
  pending: [['Setujui', 'aktif', 'disetujui'], ['Tolak', 'ditolak', 'ditolak']],
  aktif: [['Nonaktifkan', 'nonaktif', 'dinonaktifkan']],
  nonaktif: [['Aktifkan', 'aktif', 'diaktifkan']],
  ditolak: [['Setujui', 'aktif', 'disetujui']],
};

// Akun Manager tidak boleh dinonaktifkan
const PROTECTED_ROLE = 'Manager';
const actionsFor = (u) => (ACTIONS[u.status] ?? []).filter(([, status]) => !(status === 'nonaktif' && u.role?.name === PROTECTED_ROLE));

const STATUS_LABEL = { pending: 'Menunggu', aktif: 'Aktif', nonaktif: 'Nonaktif', ditolak: 'Ditolak' };

// users & dealers dimuat sekali oleh DashboardPage; tab hanya memfilter di sisi klien
function AccUserPanel({ users: allUsers, dealers, loading, onUserUpdated }) {
  const [tab, setTab] = useState('semua');
  const [pick, setPick] = useState(null); // { user, status, doneLabel, label } saat popup pilih dealer terbuka
  const [pickDealer, setPickDealer] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const users = tab === 'semua' ? allUsers : allUsers.filter((u) => u.status === tab);

  const switchTab = (key) => {
    setTab(key);
    setError('');
    setSuccess('');

  };

  const submit = async (user, dealerId, status, doneLabel) => {
    setError('');
    setSuccess('');
    setBusyId(user.id);
    try {
      const res = await updateUserStatus(user.id, dealerId ? Number(dealerId) : null, status);
      onUserUpdated({ ...user, ...res.data });
      setSuccess(`Akun ${user.name} ${doneLabel}.`);
      setPick(null);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.errors ? Object.values(data.errors).flat().join(' ') : data?.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setBusyId(null);
    }
  };

  // Setiap perubahan status minta konfirmasi dulu lewat popup.
  // Dealer hanya diminta saat mengaktifkan akun; Tolak dan Nonaktifkan cukup konfirmasi.
  const handleAction = (user, label, status, doneLabel) => {
    setError('');
    setSuccess('');
    setPickDealer(user.id_dealer ? String(user.id_dealer) : '');
    setPick({ user, label, status, doneLabel });
  };

  const current = TABS.find((t) => t.key === tab);

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
          Audit Log &amp; Akses
        </h3>
        <span className="dash-badge">{tab === 'log' ? `${ACCESS_LOGS.length} log` : loading ? '...' : `${users.length} akun`}</span>
      </div>
      <p className="dash-card-desc">Pantau akses pengguna dan kelola status akun.</p>

      <div className="dash-tabs">
        {TABS.filter((t) => SHOW_LOG_TAB || t.key !== 'log').map((t) => (
          <button key={t.key} className={`dash-tab${tab === t.key ? ' active' : ''}`} onClick={() => switchTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="dash-alert error">{error}</p>}
      {success && <p className="dash-alert success">{success}</p>}

      {tab === 'log' ? (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Alamat IP</th>
                <th>Lokasi</th>
                <th>Perangkat</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_LOGS.length === 0 ? (
                <tr>
                  <td colSpan={5} className="dash-empty-cell">Belum ada data log akses.</td>
                </tr>
              ) : (
                ACCESS_LOGS.map((l) => (
                  <tr key={l.id}>
                    <td>{l.user}</td>
                    <td>{l.ip}</td>
                    <td>{l.latitude}, {l.longitude}</td>
                    <td>{l.device}</td>
                    <td>{l.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <p className="dash-empty">Memuat...</p>
      ) : users.length === 0 ? (
        <p className="dash-empty">{current.empty}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                {tab === 'semua' && <th>Status</th>}
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong className="dash-cell-name">{u.name}</strong>
                    <small className="dash-cell-sub">{u.email}</small>
                  </td>
                  <td><span className="dash-tag">{u.role?.name ?? '-'}</span></td>
                  {tab === 'semua' && <td><span className="dash-tag">{STATUS_LABEL[u.status] ?? u.status}</span></td>}
                  <td>
                    <div className="dash-actions">
                      {actionsFor(u).map(([label, status, done], i) => (
                        <button
                          key={status}
                          className={`dash-btn ${i === 0 ? 'solid' : 'outline'}`}
                          disabled={busyId === u.id}
                          onClick={() => handleAction(u, label, status, done)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pick && (
        <div className="dash-modal-bg" onClick={() => setPick(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{pick.label} Akun</h3>
            <p className="dash-card-desc">
              Yakin ingin {pick.label.toLowerCase()} akun <strong>{pick.user.name}</strong> ({pick.user.email})?
              {pick.status === 'aktif' && ' Pilih dealer untuk akun ini.'}
            </p>
            {error && <p className="dash-alert error">{error}</p>}
            {pick.status === 'aktif' && (
              <div className="dash-form-group">
                <label htmlFor="acc-dealer">Dealer</label>
                <select id="acc-dealer" className="dash-select" value={pickDealer} onChange={(e) => setPickDealer(e.target.value)}>
                  <option value="" disabled>Pilih dealer</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setPick(null)}>Batal</button>
              <button
                className="dash-btn solid"
                disabled={(pick.status === 'aktif' && !pickDealer) || busyId === pick.user.id}
                onClick={() => submit(pick.user, pick.status === 'aktif' ? pickDealer : pick.user.id_dealer, pick.status, pick.doneLabel)}
              >
                {busyId === pick.user.id ? 'Menyimpan...' : `Ya, ${pick.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccUserPanel;
