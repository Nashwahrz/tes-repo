// src/pages/DashboardPage.jsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { getUsers, getDealers, getKonsumenTotal, getKonsumenStatusTotals, getUserMenus, getUserPermissions } from '../../api/authServices';
import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_WHITELIST, MENU_PATHS, menuFromPath,
} from './menuPaths';
import { SALES_PROTOTYPE, salesFor, totalSales } from './salesPrototype';
import './DashboardPage.css';

// Panel hanya dimuat saat menunya dibuka
const AccUserPanel = lazy(() => import('./components/AccUserPanel'));
const DealerPanel = lazy(() => import('./components/DealerPanel'));
const KonsumenPanel = lazy(() => import('./components/KonsumenPanel'));
const PenjualanPanel = lazy(() => import('./components/PenjualanPanel'));
const EmailWhitelistPanel = lazy(() => import('./components/EmailWhitelistPanel'));
const RoleAccessPanel = lazy(() => import('./components/RoleAccessPanel'));

const LOGO_SRC = '/logo.png';

// Url menu BE yang mengendalikan tiap menu sidebar (Produk dipertahankan walau endpoint BE-nya belum ada)
const MENU_URL = { [MENU_HOME]: 'dashboard', [MENU_PRODUK]: 'daftar-motor' };

const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
  store: <><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  shield: <><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><circle cx="16" cy="11" r="1.5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="M6 6l12 12M18 6L6 18" /></>,
  off: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
};

const MENU_ICONS = {
  [MENU_HOME]: 'grid',
  [MENU_PRODUK]: 'box',
  [MENU_PENJUALAN]: 'chart',
  [MENU_DEALER]: 'store',
  [MENU_KONSUMEN]: 'id',
  [MENU_ACC]: 'shield',
  [MENU_ROLE]: 'shield',
  [MENU_WHITELIST]: 'mail',
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {PATHS[name]}
  </svg>
);

const KONSUMEN_STATUS = { pending: 'Menunggu', diterima: 'Diterima', ditolak: 'Ditolak' };

const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

// Cache per-sesi tab: dashboard langsung tampil dari data terakhir, lalu diperbarui di latar belakang
const CACHE_KEY = 'dash-cache';
const NO_KONSUMEN = { total: 0, rows: [] };

const readCache = (userId) => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return c && c.userId === userId ? c : null;
  } catch {
    return null;
  }
};

const writeCache = (userId, users, dealers, access, konsumenStats) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, users, dealers, access, konsumenStats }));
  } catch {
    // storage penuh/diblokir: abaikan
  }
};

// Hak akses dari BE: url menu (role-menus) & nama permission (role-permissions)
const toAccess = (menus, permissions) => ({
  menus: menus.map((m) => m.url),
  permissions: permissions.map((p) => p.nama_permission),
});

const ROLE_ADMIN = 'Super Admin';

function DashboardPage() {
  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }

  const [cached] = useState(() => readCache(user?.id));
  const [access, setAccess] = useState(cached?.access ?? { menus: [], permissions: [] });
  const [users, setUsers] = useState(cached?.users ?? []);
  const [dealers, setDealers] = useState(cached?.dealers ?? []);
  // total konsumen; pending/ditolak hanya dimuat untuk role yang kartu ringkasannya perlu dilengkapi (null = belum dimuat)
  const [konsumenStats, setKonsumenStats] = useState(cached?.konsumenStats ?? { total: 0, pending: null, ditolak: null });
  // Nama & role dikenali dari konsumen yang diinput sendiri bila daftar user tidak boleh dilihat (ME, Kasir); disimpan di localStorage
  const [recentKonsumen, setRecentKonsumen] = useState(null); // 10 konsumen terbaru; null = belum dimuat
  const [selfInfo, setSelfInfo] = useState(user?.name ? { name: user.name, role: user.role ?? null, id_dealer: user.id_dealer ?? null } : null);
  const [loading, setLoading] = useState(!cached);
  // Menu aktif mengikuti URL (lihat menuPaths.js); pindah menu = pushState, back/forward lewat popstate
  const [menuState, setMenuState] = useState(() => menuFromPath(window.location.pathname) ?? MENU_HOME);
  const setMenu = (m) => {
    setMenuState(m);
    if (window.location.pathname !== MENU_PATHS[m]) window.history.pushState(null, '', MENU_PATHS[m]);
  };
  useEffect(() => {
    const onPop = () => setMenuState(menuFromPath(window.location.pathname) ?? MENU_HOME);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [query, setQuery] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [navOpen, setNavOpen] = useState(false); // menu samping terbuka (hanya berpengaruh di layar kecil)

  // Esc menutup menu samping
  useEffect(() => {
    if (!navOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  useEffect(() => {
    let active = true;
    // Hak akses dimuat dulu: /users hanya boleh dipanggil role dengan users.lihat
    // (ME/Kasir tidak punya, jadi dilewati agar tidak 403). null = request gagal: data lama (cache) dipertahankan
    Promise.all([getUserMenus().catch(() => null), getUserPermissions().catch(() => null)])
      .then(async ([menuList, permList]) => {
        const newAccess = menuList && permList ? toAccess(menuList, permList) : null;
        // Endpoint dipanggil hanya bila menu + permission-nya dimiliki role (selain itu pasti 403)
        const allowed = (menu, perm) => !newAccess || (newAccess.menus.includes(menu) && newAccess.permissions.includes(perm));
        // Role tanpa akses dealer/akun hanya punya kartu konsumen, jadi kartunya dilengkapi dengan status konsumen
        const needStatus = allowed('konsumens', 'konsumens.lihat') && !(allowed('dealers', 'dealers.lihat') && allowed('users', 'users.lihat'));
        const [userList, dealerList, countList, statusTotals] = await Promise.all([
          allowed('users', 'users.lihat') ? getUsers().catch(() => null) : [],
          allowed('dealers', 'dealers.lihat') ? getDealers().catch(() => null) : [],
          allowed('konsumens', 'konsumens.lihat') ? getKonsumenTotal().catch(() => null) : NO_KONSUMEN,
          needStatus ? getKonsumenStatusTotals().catch(() => null) : { pending: null, ditolak: null },
        ]);
        if (!active) return;
        if (userList) setUsers(userList);
        if (dealerList) setDealers(dealerList);
        const nextStats = countList ? { total: countList.total, ...(statusTotals ?? { pending: null, ditolak: null }) } : null;
        if (countList) {
          setKonsumenStats(nextStats);
          setRecentKonsumen(countList.rows);
          // BE hanya menerima id_me milik role ME, jadi pemilik data ini pasti ME; nama diambil dari relasi `me`
          const mine = countList.rows.find((k) => k.id_me === user?.id && k.me?.name);
          if (mine) {
            const info = { name: mine.me.name, role: 'ME', id_dealer: mine.me.id_dealer ?? null };
            setSelfInfo(info);
            localStorage.setItem('user', JSON.stringify({ ...user, ...info }));
          }
        }
        if (newAccess) setAccess(newAccess);
        if (userList && dealerList && countList && newAccess) writeCache(user?.id, userList, dealerList, newAccess, nextStats);
        setLoading(false);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (status) => users.filter((u) => u.status === status).length;
  const pending = users.filter((u) => u.status === 'pending');

  // BE membatasi dealer/akun/konsumen ke dealer milik user non-Super Admin (scope per dealer).
  // Role & dealer sendiri diambil dari daftar users karena respons login hanya memuat id & email.
  const me = users.find((u) => u.id === user?.id);
  const myRole = me?.role?.name ?? selfInfo?.role ?? null;
  const myDealer = me?.dealer?.name ?? null;
  const scoped = !!me && myRole !== ROLE_ADMIN && !!me.id_dealer;

  // Penjualan: Super Admin melihat semua dealer, role lain hanya dealer miliknya. Saat ini data contoh (lihat salesPrototype.js)
  const isAdmin = myRole === ROLE_ADMIN;
  const myDealerId = me?.id_dealer ?? selfInfo?.id_dealer ?? null;
  const salesRows = isAdmin ? salesFor(null) : myDealerId != null ? salesFor(myDealerId) : [];
  const salesKnown = SALES_PROTOTYPE && (isAdmin || myDealerId != null);
  const salesDealerName = isAdmin ? null : dealers.find((d) => d.id === myDealerId)?.name ?? salesRows[0]?.dealer ?? null;
  const scopeNote = scoped ? `Data dibatasi pada dealer Anda${myDealer ? `: ${myDealer}` : ''}.` : '';

  const q = query.trim().toLowerCase();
  const filteredDealers = q
    ? dealers.filter((d) => `${d.name} ${d.alamat}`.toLowerCase().includes(q))
    : dealers;

  // Menu sidebar & tombol aksi mengikuti menu/permission role dari BE
  const hasMenu = (url) => access.menus.includes(url);
  const can = (perm) => access.permissions.includes(perm);
  const canDealer = hasMenu('dealers') && can('dealers.lihat');
  const canUsers = hasMenu('users') && can('users.lihat');
  const canSales = hasMenu('penjualan');
  const canKonsumen = hasMenu('konsumens') && can('konsumens.lihat');
  // Menu Pengguna & Akses cukup users.lihat; tombol setujui/tolak/atur hanya muncul bila users.aktivasi dicentang
  const canAcc = hasMenu('users') && can('users.lihat');
  const canActivate = canAcc && can('users.aktivasi');
  const canRoleMenu = hasMenu('role-menus') && can('role-menus.kelola');
  const canRolePerm = hasMenu('role-menus') && can('role-permissions.kelola');
  const canRole = canRoleMenu || canRolePerm;
  const canWhitelist = hasMenu('email-whitelists') && can('email-whitelists.lihat');

  // Kartu ringkasan hanya untuk data yang boleh dilihat role; data konsumen sudah dibatasi BE sesuai dealer user
  const baseStats = [
    ...(canDealer ? [{ label: scoped ? 'Dealer Anda' : 'Total Dealer', value: dealers.length, icon: 'store', tone: 'orange', hint: 'dealer terdaftar' }] : []),
    ...(canUsers ? [{ label: 'Akun Aktif', value: count('aktif'), icon: 'check', tone: 'green', hint: 'akun dapat masuk ke sistem' }] : []),
    ...(canKonsumen ? [{ label: 'Total Konsumen', value: konsumenStats.total, icon: 'id', tone: 'blue', hint: 'konsumen tercatat' }] : []),
  ];

  // Role tanpa akses dealer/akun (mis. ME, Kasir): kartu dilengkapi status konsumen agar tetap tiga
  const extraStats = canKonsumen && baseStats.length < 3 && konsumenStats.pending !== null
    ? [
      { label: 'Menunggu Verifikasi', value: konsumenStats.pending, icon: 'clock', tone: 'orange', hint: 'konsumen belum diverifikasi' },
      { label: 'Konsumen Ditolak', value: konsumenStats.ditolak, icon: 'off', tone: 'red', hint: 'perlu diinput ulang' },
    ].slice(0, 3 - baseStats.length)
    : [];
  const stats = [...baseStats, ...extraStats];

  const canVerifyKonsumen = canKonsumen && can('konsumens.aktivasi');

  const menus = [
    ...(hasMenu(MENU_URL[MENU_HOME]) ? [MENU_HOME] : []),
    ...(hasMenu(MENU_URL[MENU_PRODUK]) ? [MENU_PRODUK] : []),
    ...(canSales ? [MENU_PENJUALAN] : []),
    ...(canDealer ? [MENU_DEALER] : []),
    ...(canKonsumen ? [MENU_KONSUMEN] : []),
    ...(canAcc ? [MENU_ACC] : []),
    ...(canRole ? [MENU_ROLE] : []),
    ...(canWhitelist ? [MENU_WHITELIST] : []),
  ];
  // Menu yang aktif harus masih diizinkan; kalau hak akses berubah, pindah ke menu pertama yang tersedia.
  // Sebelum hak akses termuat (menus kosong) tetap tampilkan Ringkasan.
  const menu = menus.length === 0 || menus.includes(menuState) ? menuState : menus[0];

  // URL harus sama dengan menu yang benar-benar tampil (mis. path menu yang tidak diizinkan role)
  useEffect(() => {
    if (window.location.pathname !== MENU_PATHS[menu]) window.history.replaceState(null, '', MENU_PATHS[menu]);
  }, [menu]);

  // Muat ulang menu & permission setelah hak akses role diubah
  const refreshAccess = async () => {
    try {
      const [menuList, permList] = await Promise.all([getUserMenus(), getUserPermissions()]);
      const next = toAccess(menuList, permList);
      setAccess(next);
      writeCache(user?.id, users, dealers, next, konsumenStats);
    } catch {
      // gagal: hak akses lama dipertahankan sampai halaman dimuat ulang
    }
  };

 
  const name = me?.name || selfInfo?.name || user?.email?.split('@')[0] || 'Pengguna';
  const initial = name.charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem(CACHE_KEY);
    window.location.href = '/';
  };

  return (
    <div className="dash">
      {navOpen && <div className="dash-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={`dash-side${navOpen ? ' open' : ''}`}>
        <div className="dash-brand">
          <img src={LOGO_SRC} alt="Logo Hayati" />
          <div>
            <strong>Hayati</strong>
            <small>Management Workspace</small>
          </div>
        </div>
        <button
          type="button"
          className="dash-burger"
          aria-label={navOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
        >
          <Icon name={navOpen ? 'close' : 'menu'} size={20} />
        </button>

        <ul className="dash-menu">
          {menus.map((m) => (
            <li key={m} className={`dash-menu-item${menu === m ? ' active' : ''}`} onClick={() => { setMenu(m); setNavOpen(false); }}>
              <Icon name={MENU_ICONS[m]} size={17} />
              {m}
            </li>
          ))}
        </ul>

        <div className="dash-side-foot">
          <div className="dash-avatar">{initial}</div>
          <div className="dash-side-user">
            <strong>{name}</strong>
            <small>{myRole ? `${myRole}${myDealer ? ` · ${myDealer}` : ''}` : 'Pengguna'}</small>
          </div>
          <button className="dash-logout" onClick={() => { setNavOpen(false); setConfirmLogout(true); }} title="Keluar dari akun">
            <Icon name="logout" size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {confirmLogout && (
        <div className="dash-modal-bg" onClick={() => setConfirmLogout(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Keluar</h3>
            <p className="dash-card-desc">Yakin ingin keluar dari akun ini?</p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setConfirmLogout(false)}>Batal</button>
              <button className="dash-btn solid" onClick={handleLogout}>Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-main">
        <header className="dash-top">
          {canDealer ? (
          <input
            className="dash-search"
            type="search"
            placeholder="Cari dealer berdasarkan nama atau alamat..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setMenu(MENU_HOME);
            }}
          />
          ) : <div />}
        </header>

        <div className="dash-content">
          {menu === MENU_ACC && canAcc && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <AccUserPanel
                  users={users}
                  dealers={dealers}
                  scopeNote={scopeNote}
                  canActivate={canActivate}
                  loading={loading}
                  onUserUpdated={(updated) => setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)))}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_PRODUK && (
            <div className="dash-card">
              <div className="dash-card-head">
                <h3><Icon name="box" size={17} /> Produk</h3>
              </div>
              <p className="dash-empty">Fitur produk belum tersedia.</p>
            </div>
          )}

          {menu === MENU_PENJUALAN && canSales && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <PenjualanPanel scopeNote={scopeNote} />
              </Suspense>
            </div>
          )}

          {menu === MENU_DEALER && canDealer && (
            <div className="dash-card">
              {loading ? (
                <p className="dash-empty">Memuat...</p>
              ) : (
                <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                  <DealerPanel
                    dealers={dealers}
                    scopeNote={scopeNote}
                    can={{ tambah: can('dealers.tambah') && !scoped, ubah: can('dealers.ubah'), hapus: can('dealers.hapus') }}
                    onDealersChange={(update) => setDealers((list) => update(list))}
                  />
                </Suspense>
              )}
            </div>
          )}

          {menu === MENU_KONSUMEN && canKonsumen && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <KonsumenPanel
                  userId={user?.id}
                  can={{ tambah: can('konsumens.tambah'), ubah: can('konsumens.ubah'), hapus: can('konsumens.hapus'), scan: can('konsumens.scan'), verifikasi: canVerifyKonsumen }}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_WHITELIST && canWhitelist && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <EmailWhitelistPanel
                  userId={user?.id}
                  users={users}
                  can={{ tambah: can('email-whitelists.tambah'), ubah: can('email-whitelists.ubah'), hapus: can('email-whitelists.hapus') }}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_ROLE && canRole && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <RoleAccessPanel canMenu={canRoleMenu} canPermission={canRolePerm} onSaved={refreshAccess} />
              </Suspense>
            </div>
          )}

          {menu === MENU_HOME && (
            <>
              <section className="dash-welcome">
                <div className="dash-welcome-text">
                  <small>{today}</small>
                  <h1>Halo, {name}</h1>
                  <p>{canDealer || canUsers ? `Pantau ${[canDealer && 'jaringan dealer motor', canUsers && 'status akun pengguna'].filter(Boolean).join(' dan ')} dalam satu tampilan.` : 'Pilih menu di samping untuk mulai bekerja.'} {scopeNote}</p>
                </div>
                {canSales && (
                  <div className="dash-welcome-sales">
                    <small>{isAdmin ? 'Total Penjualan' : `Total Penjualan Dealer Anda${salesDealerName ? ` · ${salesDealerName}` : ''}`}</small>
                    <strong>{salesKnown ? rupiah(totalSales(salesRows)) : 'Belum ada data'}</strong>
                    {salesKnown && <span className="dash-proto">Data contoh</span>}
                    <button className="dash-btn light" onClick={() => setMenu(MENU_PENJUALAN)}>Lihat Penjualan</button>
                  </div>
                )}
              </section>

              {stats.length > 0 && (
              <section className="dash-stats">
                {stats.map((s) => (
                  <div className={`dash-stat tone-${s.tone}`} key={s.label}>
                    <span className="dash-stat-icon"><Icon name={s.icon} size={22} /></span>
                    <div className="dash-stat-body">
                      <small>{s.label}</small>
                      <strong>{s.value}</strong>
                      <em>{s.hint}</em>
                    </div>
                  </div>
                ))}
              </section>
              )}

              <section className="dash-grid">
                {canAcc && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="shield" size={17} /> Otorisasi Akun</h3>
                    <button type="button" className="dash-link" onClick={() => setMenu(MENU_ACC)}>Lihat semua</button>
                  </div>
                  <p className="dash-card-desc">
                    {pending.length === 0 ? 'Validasi akun baru sebelum diberi akses ke sistem.' : `${pending.length} akun menunggu persetujuan.`}
                  </p>

                  {pending.length === 0 ? (
                    <p className="dash-empty">Tidak ada akun yang menunggu persetujuan.</p>
                  ) : (
                    <>
                      {pending.slice(0, 4).map((u) => (
                        <div className="dash-item dash-item-compact" key={u.id}>
                          <div className="dash-item-main">
                            <strong title={u.name}>{u.name}</strong>
                            <small title={u.email}>{u.email}</small>
                          </div>
                          <span className="dash-tag">{u.role?.name ?? '-'}</span>
                          {canActivate && <button className="dash-btn sm outline" onClick={() => setMenu(MENU_ACC)}>Tinjau</button>}
                        </div>
                      ))}
                      {pending.length > 4 && <p className="dash-more">dan {pending.length - 4} akun lainnya</p>}
                    </>
                  )}
                </div>
                )}

                {canDealer && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="store" size={17} /> Jaringan Dealer</h3>
                    <button type="button" className="dash-link" onClick={() => setMenu(MENU_DEALER)}>Lihat semua</button>
                  </div>
                  <p className="dash-card-desc">{dealers.length} dealer terdaftar.</p>
                  {filteredDealers.length === 0 ? (
                    <p className="dash-empty">{q ? 'Dealer tidak ditemukan.' : 'Belum ada data dealer.'}</p>
                  ) : (
                    filteredDealers.slice(0, 4).map((d) => (
                      <div className="dash-row dash-row-compact" key={d.id}>
                        <span className="dash-row-icon"><Icon name="store" size={14} /></span>
                        <div className="dash-row-body">
                          <span title={d.name}>{d.name}</span>
                          <small title={d.alamat}>{d.alamat}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                )}

                {!canAcc && !canDealer && canKonsumen && (
                <div className={`dash-card${salesKnown ? '' : ' dash-card-wide'}`}>
                  <div className="dash-card-head">
                    <h3><Icon name="id" size={17} /> Konsumen Terbaru</h3>
                    <button type="button" className="dash-link" onClick={() => setMenu(MENU_KONSUMEN)}>Lihat semua</button>
                  </div>
                  <p className="dash-card-desc">Data konsumen yang terakhir masuk.</p>
                  {recentKonsumen === null ? (
                    <p className="dash-empty">Memuat...</p>
                  ) : recentKonsumen.length === 0 ? (
                    <p className="dash-empty">Belum ada data konsumen.</p>
                  ) : (
                    recentKonsumen.slice(0, 5).map((k) => (
                      <div className="dash-row dash-row-compact" key={k.id}>
                        <span className="dash-row-icon"><Icon name="id" size={14} /></span>
                        <div className="dash-row-body">
                          <span title={k.name}>{k.name || '-'}</span>
                          <small>{k.nik || '-'}</small>
                        </div>
                        <span className={`dash-status ${k.status}`}>{KONSUMEN_STATUS[k.status] ?? k.status}</span>
                      </div>
                    ))
                  )}
                </div>
                )}

                {!canAcc && !canDealer && canSales && salesKnown && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="chart" size={17} /> Penjualan Terbaru</h3>
                    <button type="button" className="dash-link" onClick={() => setMenu(MENU_PENJUALAN)}>Lihat semua</button>
                  </div>
                  <p className="dash-card-desc">Transaksi terakhir di dealer Anda. Data contoh.</p>
                  {salesRows.length === 0 ? (
                    <p className="dash-empty">Belum ada transaksi.</p>
                  ) : (
                    salesRows.toSorted((x, y) => y.tanggal.localeCompare(x.tanggal)).slice(0, 5).map((r) => (
                      <div className="dash-row dash-row-compact" key={r.id}>
                        <span className="dash-row-icon"><Icon name="chart" size={14} /></span>
                        <div className="dash-row-body">
                          <span title={r.motor}>{r.motor}</span>
                          <small>{r.konsumen}</small>
                        </div>
                        <span className="dash-row-right">{rupiah(r.harga)}</span>
                      </div>
                    ))
                  )}
                </div>
                )}

                {!canAcc && !canDealer && !canKonsumen && (
                <div className="dash-card dash-card-wide">
                  <div className="dash-card-head">
                    <h3><Icon name="grid" size={17} /> Menu Anda</h3>
                  </div>
                  <p className="dash-card-desc">Fitur yang tersedia untuk akun Anda.</p>
                  {menus.filter((m) => m !== MENU_HOME).length === 0 ? (
                    <p className="dash-empty">Belum ada menu yang dapat diakses.</p>
                  ) : (
                    <div className="dash-tiles">
                      {menus.filter((m) => m !== MENU_HOME).map((m) => (
                        <button type="button" className="dash-tile" key={m} onClick={() => setMenu(m)}>
                          <span className="dash-tile-icon"><Icon name={MENU_ICONS[m]} size={20} /></span>
                          <span>{m}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
