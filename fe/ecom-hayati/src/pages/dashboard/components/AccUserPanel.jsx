// src/pages/AccUserPanel.jsx
import { useEffect, useState } from 'react';
import { getAtasanOptions, updateUserStatus } from '../../../api/authServices';

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
  aktif: [['Atur', 'aktif', 'diperbarui'], ['Nonaktifkan', 'nonaktif', 'dinonaktifkan']],
  nonaktif: [['Aktifkan', 'aktif', 'diaktifkan']],
  ditolak: [['Setujui', 'aktif', 'disetujui']],
};

// Akun Manager tidak boleh dinonaktifkan
const PROTECTED_ROLE = 'Manager';
// Atur (ubah dealer & atasan akun aktif) tidak berlaku untuk Manager, yang tidak punya atasan
const actionsFor = (u) => (ACTIONS[u.status] ?? []).filter(([, status]) => {
  if (u.role?.name !== PROTECTED_ROLE) return true;
  return u.status === 'aktif' ? false : status !== 'nonaktif';
});

const STATUS_LABEL = { pending: 'Menunggu', aktif: 'Aktif', nonaktif: 'Nonaktif', ditolak: 'Ditolak' };


// users & dealers dimuat sekali oleh DashboardPage; tab hanya memfilter di sisi klien
function AccUserPanel({ users: allUsers, dealers, loading, onUserUpdated }) {
  const [tab, setTab] = useState('semua');
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState(null); // { user, status, doneLabel, label } saat popup pilih dealer terbuka
  const [pickDealer, setPickDealer] = useState('');
  const [pickAtasan, setPickAtasan] = useState('');
  const [atasanOptions, setAtasanOptions] = useState([]);
  const [loadedKey, setLoadedKey] = useState(''); // kombinasi role+dealer yang daftar atasannya sudah dimuat
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const byStatus = tab === 'semua' ? allUsers : allUsers.filter((u) => u.status === tab);
  const q = query.trim().toLowerCase();
  const users = q
    ? byStatus.filter((u) => `${u.name} ${u.email} ${u.role?.name ?? ''}`.toLowerCase().includes(q))
    : byStatus;

  const switchTab = (key) => {
    setTab(key);
    setError('');
    setSuccess('');

  };

  // Daftar atasan dimuat ulang saat popup aktivasi dibuka atau dealer diganti
  const pickUserId = pick?.user.id;
  const pickRoleId = pick?.user.role?.id ?? pick?.user.id_role;
  const needAtasan = pick?.status === 'aktif';
  const isEdit = needAtasan && pick.user.status === 'aktif'; // akun sudah aktif, hanya ubah dealer/atasan
  const atasanKey = `${pickRoleId}-${pickDealer}`;
  const loadingAtasan = needAtasan && loadedKey !== atasanKey;
  useEffect(() => {
    if (!needAtasan) return undefined;
    let cancelled = false;
    getAtasanOptions(pickRoleId, pickDealer)
      .then((list) => {
        if (cancelled) return;
        setAtasanOptions(list);
        // Pertahankan atasan terpilih hanya bila masih ada di daftar
        setPickAtasan((cur) => (list.some((a) => String(a.id) === cur) ? cur : ''));
      })
      .catch(() => { if (!cancelled) setAtasanOptions([]); })
      .finally(() => { if (!cancelled) setLoadedKey(atasanKey); });
    return () => { cancelled = true; };
  }, [needAtasan, pickUserId, pickRoleId, pickDealer, atasanKey]);

  const submit = async (user, dealerId, status, doneLabel, atasanId) => {
    setError('');
    setSuccess('');
    setBusyId(user.id);
    try {
      const res = await updateUserStatus(user.id, dealerId ? Number(dealerId) : null, status, atasanId ? Number(atasanId) : null);
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
    setPickAtasan(user.id_atasan ? String(user.id_atasan) : '');
    setAtasanOptions([]);
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

      <div className="dash-toolbar">
        <input
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, email, atau role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="dash-input dash-select-filter" value={tab} onChange={(e) => switchTab(e.target.value)}>
          {TABS.filter((t) => SHOW_LOG_TAB || t.key !== 'log').map((t) => (
            <option key={t.key} value={t.key}>{t.key === 'semua' ? 'Semua status' : t.label}</option>
          ))}
        </select>
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
        <p className="dash-empty">{q ? 'Akun tidak ditemukan.' : current.empty}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Dealer</th>
                <th>Atasan</th>
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
                  <td>{u.role?.name ?? '-'}</td>
                  <td className="acc-muted">{u.dealer?.name ?? '-'}</td>
                  <td className="acc-muted">{u.atasan?.name ?? '-'}</td>
                  {tab === 'semua' && <td><span className={`dash-status ${u.status}`}>{STATUS_LABEL[u.status] ?? u.status}</span></td>}
                  <td>
                    <div className="dash-actions">
                      {actionsFor(u).map(([label, status, done]) => {
                        const isAtur = status === 'aktif' && u.status === 'aktif';
                        return (
                          <button
                            key={status}
                            className={isAtur ? 'acc-icon-btn' : `acc-btn ${status === 'aktif' ? 'primary' : 'danger'}`}
                            title={isAtur ? 'Atur dealer & atasan' : label}
                            aria-label={isAtur ? 'Atur dealer & atasan' : label}
                            disabled={busyId === u.id}
                            onClick={() => handleAction(u, label, status, done)}
                          >
                            {isAtur ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
                            ) : label}
                          </button>
                        );
                      })}
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
            <div className="dash-modal-head">
              <h3>{isEdit ? 'Atur Dealer & Atasan' : `${pick.label} Akun`}</h3>
              <button className="dash-modal-close" aria-label="Tutup" onClick={() => setPick(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <p className="acc-who"><strong>{pick.user.name}</strong> · {pick.user.role?.name ?? '-'} · {pick.user.email}</p>
            {!isEdit && (
              <p className="dash-card-desc">
                {pick.status === 'aktif' ? 'Pilih dealer dan atasan sebelum mengaktifkan akun ini.' : `Yakin ingin ${pick.label.toLowerCase()} akun ini?`}
              </p>
            )}
            {error && <p className="dash-alert error">{error}</p>}
            {pick.status === 'aktif' && (
              <div className="dash-form-group">
                <label htmlFor="acc-dealer">Dealer <span className="acc-req">*</span></label>
                <select id="acc-dealer" className="dash-select full" value={pickDealer} onChange={(e) => setPickDealer(e.target.value)}>
                  <option value="" disabled>Pilih dealer</option>
                  {dealers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            {pick.status === 'aktif' && (
              <div className="dash-form-group">
                <label htmlFor="acc-atasan">Atasan <span className="acc-opt">(opsional)</span></label>
                <select
                  id="acc-atasan"
                  className="dash-select full"
                  value={pickAtasan}
                  disabled={loadingAtasan}
                  onChange={(e) => setPickAtasan(e.target.value)}
                >
                  <option value="">
                    {loadingAtasan ? 'Memuat...' : atasanOptions.length === 0 ? 'Tidak ada pilihan atasan' : 'Tanpa atasan'}
                  </option>
                  {atasanOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.role?.name ? ` (${a.role.name}${a.dealer?.name ? ` - ${a.dealer.name}` : ''})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setPick(null)}>Batal</button>
              <button
                className="dash-btn solid"
                disabled={(pick.status === 'aktif' && !pickDealer) || busyId === pick.user.id}
                onClick={() => submit(pick.user, pick.status === 'aktif' ? pickDealer : pick.user.id_dealer, pick.status, pick.doneLabel, pick.status === 'aktif' ? pickAtasan : pick.user.id_atasan)}
              >
                {busyId === pick.user.id ? 'Menyimpan...' : isEdit ? 'Simpan' : `Ya, ${pick.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccUserPanel;
