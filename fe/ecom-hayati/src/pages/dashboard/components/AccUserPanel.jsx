// src/pages/AccUserPanel.jsx
import { useEffect, useState } from 'react';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import { getAtasanOptions, getUsers, updateUserStatus } from '../../../api/authServices';

const TABS = [
  { key: 'semua', label: 'Semua', empty: 'Belum ada akun.' },
  { key: 'pending', label: 'Menunggu', empty: 'Tidak ada akun yang menunggu persetujuan.' },
  { key: 'aktif', label: 'Aktif', empty: 'Belum ada akun aktif.' },
  { key: 'nonaktif', label: 'Nonaktif', empty: 'Tidak ada akun nonaktif.' },
  { key: 'ditolak', label: 'Ditolak', empty: 'Tidak ada akun yang ditolak.' },
];

// Aksi per tab: [label tombol, status tujuan, kata kerja untuk pesan sukses]
const ACTIONS = {
  pending: [['Setujui', 'aktif', 'disetujui'], ['Tolak', 'ditolak', 'ditolak']],
  aktif: [['Atur', 'aktif', 'diperbarui'], ['Nonaktifkan', 'nonaktif', 'dinonaktifkan']],
  nonaktif: [['Aktifkan', 'aktif', 'diaktifkan']],
  ditolak: [['Setujui', 'aktif', 'disetujui']],
};

// Akun Super Admin tidak boleh dinonaktifkan
const PROTECTED_ROLE = 'Super Admin';
// Atur (ubah dealer & atasan akun aktif) tidak berlaku untuk Super Admin, yang tidak punya atasan
const actionsFor = (u) => (ACTIONS[u.status] ?? []).filter(([, status]) => {
  if (u.role?.name !== PROTECTED_ROLE) return true;
  return u.status === 'aktif' ? false : status !== 'nonaktif';
});

const ACTION_ICON = { atur: 'edit', aktif: 'check', ditolak: 'close', nonaktif: 'ban' };

const PAGE_SIZE = 10;

const STATUS_LABEL = { pending: 'Menunggu', aktif: 'Aktif', nonaktif: 'Nonaktif', ditolak: 'Ditolak' };


// users & dealers dimuat sekali oleh DashboardPage; tab hanya memfilter di sisi klien
function AccUserPanel({ users: allUsers, dealers, scopeNote, canActivate, loading, onUserUpdated }) {
  const [tab, setTab] = useState('semua');
  const [query, setQuery] = useState('');
  const [dealerFilter, setDealerFilter] = useState(''); // id dealer akun; kosong = semua dealer, 'none' = belum punya dealer
  const [page, setPage] = useState(1);
  const [pick, setPick] = useState(null); // { user, status, doneLabel, label } saat popup pilih dealer terbuka
  const [pickDealer, setPickDealer] = useState('');
  const [pickAtasan, setPickAtasan] = useState('');
  const [atasanOptions, setAtasanOptions] = useState([]);
  const [loadedKey, setLoadedKey] = useState(''); // kombinasi role+dealer yang daftar atasannya sudah dimuat
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Terbaru di atas: BE tidak mengurutkan, id auto-increment mengikuti urutan akun masuk
  // allUsers sudah hanya berisi akun dengan email terverifikasi (disaring di DashboardPage)
  const verified = dealerFilter === 'none'
    ? allUsers.filter((u) => !u.id_dealer)
    : dealerFilter ? allUsers.filter((u) => String(u.id_dealer) === dealerFilter) : allUsers;
  const counts = { semua: verified.length };
  for (const u of verified) counts[u.status] = (counts[u.status] ?? 0) + 1;
  const byStatus = (tab === 'semua' ? verified : verified.filter((u) => u.status === tab)).toSorted((a, b) => b.id - a.id);
  const q = query.trim().toLowerCase();
  const users = q
    ? byStatus.filter((u) => `${u.name} ${u.email} ${u.role?.name ?? ''}`.toLowerCase().includes(q))
    : byStatus;

  const switchTab = (key) => {
    setTab(key);
    setPage(1);
    setError('');
    setSuccess('');
  };

  // BE mengirim semua akun sekaligus, jadi paginasi dilakukan di sisi klien agar tabel tetap ringan
  const pageOf = (list) => {
    const lastPage = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
    const current = Math.min(page, lastPage);
    return { current, lastPage, items: list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) };
  };
  const userPage = pageOf(users);

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
      // BE menyimpan status dulu, baru mengirim email notifikasi; bila email gagal, responsnya 500 padahal perubahan sudah tersimpan.
      // Cek daftar terbaru sebelum melapor gagal.
      if (err.response?.status >= 500) {
        const fresh = await getUsers().then((list) => list.find((u) => u.id === user.id)).catch(() => null);
        const same = (a, b) => String(a ?? '') === String(b ?? '');
        if (fresh && fresh.status === status && (status !== 'aktif' || (same(fresh.id_dealer, dealerId) && same(fresh.id_atasan, atasanId)))) {
          onUserUpdated({ ...user, ...fresh });
          setSuccess(`Akun ${user.name} ${doneLabel}, tetapi server melaporkan kesalahan (kemungkinan email notifikasi gagal terkirim). Periksa pengaturan Email SMTP.`);
          setPick(null);
          return;
        }
      }
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
          Manajemen User
        </h3>
        <span className="dash-badge">{loading ? '...' : `${users.length} akun`}</span>
      </div>
      <p className="dash-card-desc">
        {canActivate ? 'Setujui, tolak, atau atur akun pengguna yang mendaftar.' : 'Daftar akun pengguna yang mendaftar.'}
        {scopeNote && ` ${scopeNote} Akun yang belum memiliki dealer hanya terlihat oleh Super Admin.`}
      </p>

      <div className="dash-toolbar">
        <input id="acc-search"
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, email, atau role..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        {dealers.length > 0 && (
          <select id="acc-filter-dealer" className="dash-input dash-select-filter" value={dealerFilter} aria-label="Filter dealer" onChange={(e) => { setDealerFilter(e.target.value); setPage(1); }}>
            <option value="">Semua dealer</option>
            {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            <option value="none">Tanpa dealer</option>
          </select>
        )}
        <select id="acc-filter-status" className="dash-input dash-select-filter acc-filter" value={tab} onChange={(e) => switchTab(e.target.value)} aria-label="Filter status akun">
          {TABS.map((t) => (
            <option key={t.key} value={t.key}>{t.key === 'semua' ? 'Semua status' : t.label} ({counts[t.key] ?? 0})</option>
          ))}
        </select>
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <Loading rows={5} />
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
                <th>Status</th>
                {canActivate && <th className="col-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {userPage.items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="acc-user">
                      <span className="acc-avatar" aria-hidden="true">{(u.name ?? '?').trim().charAt(0).toUpperCase()}</span>
                      <div>
                        <strong className="dash-cell-name">{u.name}</strong>
                        <small className="dash-cell-sub">{u.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{u.role?.name ?? '-'}</td>
                  <td className="acc-muted">{u.dealer?.name ?? '-'}</td>
                  <td className="acc-muted">{u.atasan?.name ?? '-'}</td>
                  <td><span className={`dash-status ${u.status}`}>{STATUS_LABEL[u.status] ?? u.status}</span></td>
                  {canActivate && (
                    <td className="col-aksi">
                      <div className="dash-actions">
                        {actionsFor(u).map(([label, status, done]) => {
                          const isAtur = status === 'aktif' && u.status === 'aktif';
                          return (
                            <IconButton id={`btn-acc-${status}-${u.id}`}
                              key={status}
                              icon={ACTION_ICON[isAtur ? 'atur' : status]}
                              label={isAtur ? 'Atur' : label}
                              tone={isAtur ? undefined : status === 'aktif' ? 'ok' : 'danger'}
                              disabled={busyId === u.id}
                              onClick={() => handleAction(u, label, status, done)}
                            />
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && users.length > 0 && (
        <Pager page={userPage.current} lastPage={userPage.lastPage} total={users.length} unit="akun" onPage={setPage} />
      )}

      {pick && (
        <div className="dash-modal-bg" onClick={() => setPick(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3>{isEdit ? 'Atur Dealer & Atasan' : `${pick.label} Akun`}</h3>
              <button id="btn-acc-modal-close" className="dash-modal-close" aria-label="Tutup" onClick={() => setPick(null)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <p className="acc-who"><strong>{pick.user.name}</strong> · {pick.user.role?.name ?? '-'} · {pick.user.email}</p>
            {!isEdit && (
              <p className="dash-card-desc">
                {pick.status === 'aktif' ? 'Pilih dealer dan atasan sebelum mengaktifkan akun ini.' : `Yakin ingin ${pick.label.toLowerCase()} akun ini?`}
              </p>
            )}
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
              <button id="btn-acc-modal-cancel" className="dash-btn outline" onClick={() => setPick(null)}>Batal</button>
              <button id="btn-acc-modal-submit"
                className="dash-btn solid"
                disabled={(pick.status === 'aktif' && !pickDealer) || busyId === pick.user.id}
                onClick={() => submit(pick.user, pick.status === 'aktif' ? pickDealer : pick.user.id_dealer, pick.status, pick.doneLabel, pick.status === 'aktif' ? pickAtasan : pick.user.id_atasan)}
              >
                {busyId === pick.user.id ? <><Spin />Menyimpan...</> : isEdit ? 'Simpan' : `Ya, ${pick.label}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccUserPanel;
