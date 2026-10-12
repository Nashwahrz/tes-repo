// src/pages/DashboardPage.jsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { getUsers, getDealers, getKonsumens, getUserMenus, getUserPermissions } from '../../api/authServices';
import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_PATHS, menuFromPath,
} from './menuPaths';
import './DashboardPage.css';

// Panel hanya dimuat saat menunya dibuka
const AccUserPanel = lazy(() => import('./components/AccUserPanel'));
const DealerPanel = lazy(() => import('./components/DealerPanel'));
const KonsumenPanel = lazy(() => import('./components/KonsumenPanel'));
const PenjualanPanel = lazy(() => import('./components/PenjualanPanel'));
const RoleAccessPanel = lazy(() => import('./components/RoleAccessPanel'));

const LOGO_SRC = '/logo.png';

// Url menu BE yang mengendalikan tiap menu sidebar (Produk dipertahankan walau endpoint BE-nya belum ada)
// Siapa yang boleh memverifikasi konsumen. BE hanya mewajibkan konsumens.lihat (semua role punya), jadi FE yang membatasi.
// Role hanya diketahui bila user boleh melihat daftar user; bila tidak, pakai users.lihat sebagai petunjuk atasan.
const VERIFIER_ROLES = ['Manager', 'Kacab', 'ADH'];

const MENU_URL = { [MENU_HOME]: 'dashboard', [MENU_PRODUK]: 'daftar-motor' };

const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
  store: <><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  shield: <><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></>,
  id: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><circle cx="16" cy="11" r="1.5" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>,
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
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {PATHS[name]}
  </svg>
);

// Data penjualan belum ada di BE (tidak ada tabel/endpoint penjualan atau produk).
// Isi objek ini dari API penjualan saat sudah tersedia.
const SALES = { total: null, topProduct: null }; // { total: number, topProduct: { name, unit } }

const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

// Cache per-sesi tab: dashboard langsung tampil dari data terakhir, lalu diperbarui di latar belakang
const CACHE_KEY = 'dash-cache';

const readCache = (userId) => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return c && c.userId === userId ? c : null;
  } catch {
    return null;
  }
};

const writeCache = (userId, users, dealers, access, konsumens) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, users, dealers, access, konsumens }));
  } catch {
    // storage penuh/diblokir: abaikan
  }
};

// Hak akses dari BE: url menu (role-menus) & nama permission (role-permissions)
const toAccess = (menus, permissions) => ({
  menus: menus.map((m) => m.url),
  permissions: permissions.map((p) => p.nama_permission),
});

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
  const [konsumens, setKonsumens] = useState(cached?.konsumens ?? []);
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
        const [userList, dealerList, konsumenList] = await Promise.all([
          allowed('users', 'users.lihat') ? getUsers().catch(() => null) : [],
          allowed('dealers', 'dealers.lihat') ? getDealers().catch(() => null) : [],
          allowed('konsumens', 'konsumens.lihat') ? getKonsumens().catch(() => null) : [],
        ]);
        if (!active) return;
        if (userList) setUsers(userList);
        if (dealerList) setDealers(dealerList);
        if (konsumenList) setKonsumens(konsumenList);
        if (newAccess) setAccess(newAccess);
        if (userList && dealerList && konsumenList && newAccess) writeCache(user?.id, userList, dealerList, newAccess, konsumenList);
        setLoading(false);
      });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (status) => users.filter((u) => u.status === status).length;
  const countKonsumen = (status) => konsumens.filter((k) => k.status === status).length;
  const pending = users.filter((u) => u.status === 'pending');

  // BE membatasi dealer/akun/konsumen ke dealer milik user non-Manager (scope per dealer).
  // Role & dealer sendiri diambil dari daftar users karena respons login hanya memuat id & email.
  const me = users.find((u) => u.id === user?.id);
  const myRole = me?.role?.name ?? null;
  const myDealer = me?.dealer?.name ?? null;
  const scoped = !!me && myRole !== 'Manager' && !!me.id_dealer;
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
  const canAcc = hasMenu('users') && can('users.lihat') && can('users.aktivasi');
  const canRoleMenu = hasMenu('role-menus') && can('role-menus.kelola');
  const canRolePerm = hasMenu('role-menus') && can('role-permissions.kelola');
  const canRole = canRoleMenu || canRolePerm;

  // Kartu ringkasan hanya untuk data yang boleh dilihat role
  const stats = [
    ...(canDealer ? [{ icon: 'store', label: scoped ? 'Dealer Anda' : 'Total Dealer', value: dealers.length, unit: 'Dealer' }] : []),
    ...(canUsers ? [
      { icon: 'check', label: 'Akun Aktif', value: count('aktif'), unit: 'Akun' },
      { icon: 'clock', label: 'Menunggu Persetujuan', value: count('pending'), unit: 'Akun', tag: count('pending') > 0 ? 'Perlu Tindakan' : null },
      { icon: 'off', label: 'Akun Nonaktif', value: count('nonaktif'), unit: 'Akun' },
    ] : []),
    // Data konsumen sudah dibatasi BE sesuai dealer user; "Input Anda" hanya untuk yang menginput (bukan Manager)
    ...(canKonsumen ? [
      { icon: 'id', label: 'Total Konsumen', value: konsumens.length, unit: 'Konsumen' },
      { icon: 'clock', label: 'Konsumen Menunggu', value: countKonsumen('pending'), unit: 'Konsumen' },
      { icon: 'check', label: 'Konsumen Diterima', value: countKonsumen('diterima'), unit: 'Konsumen' },
      { icon: 'off', label: 'Konsumen Ditolak', value: countKonsumen('ditolak'), unit: 'Konsumen' },
      ...(myRole !== 'Manager' && can('konsumens.tambah')
        ? [{ icon: 'id', label: 'Input Anda', value: konsumens.filter((k) => k.id_me === user?.id).length, unit: 'Konsumen' }]
        : []),
    ] : []),
  ];

  const canVerifyKonsumen = canKonsumen && (myRole ? VERIFIER_ROLES.includes(myRole) : can('users.lihat'));

  const menus = [
    ...(hasMenu(MENU_URL[MENU_HOME]) ? [MENU_HOME] : []),
    ...(hasMenu(MENU_URL[MENU_PRODUK]) ? [MENU_PRODUK] : []),
    ...(canSales ? [MENU_PENJUALAN] : []),
    ...(canDealer ? [MENU_DEALER] : []),
    ...(canKonsumen ? [MENU_KONSUMEN] : []),
    ...(canAcc ? [MENU_ACC] : []),
    ...(canRole ? [MENU_ROLE] : []),
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
      writeCache(user?.id, users, dealers, next, konsumens);
    } catch {
      // gagal: hak akses lama dipertahankan sampai halaman dimuat ulang
    }
  };

 
  const name = me?.name || user?.email?.split('@')[0] || 'Pengguna';
  const initial = name.charAt(0).toUpperCase();

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
          <div className="dash-top-right">
            {canDealer && (
              <div>
                {scoped ? 'Dealer Anda' : 'Total Dealer'}
                <strong>{dealers.length}</strong>
              </div>
            )}
            {canUsers && (
              <div>
                Akun Aktif
                <strong>{count('aktif')}</strong>
              </div>
            )}
          </div>
        </header>

        <div className="dash-content">
          {menu === MENU_ACC && canAcc && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <AccUserPanel
                  users={users}
                  dealers={dealers}
                  scopeNote={scopeNote}
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
                  role={myRole}
                  can={{ tambah: can('konsumens.tambah'), hapus: can('konsumens.hapus'), scan: can('konsumens.scan'), verifikasi: canVerifyKonsumen }}
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
              <div className="dash-hello">
                <div>
                  <h1>Halo, {name}</h1>
                  <p>{canDealer || canUsers ? `Pantau ${[canDealer && 'jaringan dealer motor', canUsers && 'status akun pengguna'].filter(Boolean).join(' dan ')} dalam satu tampilan.` : 'Pilih menu di samping untuk mulai bekerja.'} {scopeNote}</p>
                </div>
                {canAcc && (
                  <button className="dash-btn solid" onClick={() => setMenu(MENU_ACC)}>Audit Log &amp; Akses</button>
                )}
              </div>

              {canSales && (
              <section className="dash-hero">
                <div>
                  <span className="dash-chip">Penjualan Motor</span>
                  <small>Total Penjualan</small>
                  <h2>{SALES.total === null ? 'Belum ada data' : rupiah(SALES.total)}</h2>
                  <div className="dash-hero-sub">
                    <span>
                      Motor Terlaris:{' '}
                      {SALES.topProduct ? `${SALES.topProduct.name} (${SALES.topProduct.unit} unit)` : '-'}
                    </span>
                  </div>
                </div>
                <div className="dash-hero-actions">
                  {canAcc && <button className="dash-btn light" onClick={() => setMenu(MENU_ACC)}>Audit Log &amp; Akses</button>}
                  {canSales && <button className="dash-btn light" onClick={() => setMenu(MENU_PENJUALAN)}>Lihat Penjualan</button>}
                  {canDealer && <button className="dash-btn ghost" onClick={() => setMenu(MENU_DEALER)}>Lihat Dealer →</button>}
                </div>
              </section>
              )}

              {stats.length > 0 && (
              <section className="dash-stats">
                {stats.map((s) => (
                  <div className="dash-stat" key={s.label}>
                    <div className="dash-stat-top">
                      <span className="dash-stat-icon"><Icon name={s.icon} size={17} /></span>
                      {s.tag && <span className="dash-tag">{s.tag}</span>}
                    </div>
                    <small>{s.label}</small>
                    <div className="dash-stat-val">
                      <strong>{s.value}</strong>
                      <span>{s.unit}</span>
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
                    <span className="dash-badge">{pending.length} Tertunda</span>
                  </div>
                  <p className="dash-card-desc">Validasi akun baru sebelum diberi akses ke sistem.</p>

                  {pending.length === 0 ? (
                    <p className="dash-empty">Tidak ada akun yang menunggu persetujuan.</p>
                  ) : (
                    <>
                      {pending.slice(0, 3).map((u) => (
                        <div className="dash-item" key={u.id}>
                          <div className="dash-item-head">
                            <div>
                              <strong>{u.name}</strong>
                              <small>{u.email}</small>
                            </div>
                            <span className="dash-tag">{u.role?.name ?? '-'}</span>
                          </div>
                          <div className="dash-item-actions">
                            <button className="dash-btn solid" onClick={() => setMenu(MENU_ACC)}>Tinjau Akun</button>
                          </div>
                        </div>
                      ))}
                      <button className="dash-btn soft" onClick={() => setMenu(MENU_ACC)}>Lihat semua</button>
                    </>
                  )}
                </div>
                )}

                {canDealer && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="store" size={17} /> Jaringan Dealer</h3>
                    <span className="dash-badge">{dealers.length} dealer</span>
                  </div>
                  <p className="dash-card-desc">Daftar dealer terdaftar.</p>
                  {filteredDealers.length === 0 ? (
                    <p className="dash-empty">{q ? 'Dealer tidak ditemukan.' : 'Belum ada data dealer.'}</p>
                  ) : (
                    filteredDealers.slice(0, 5).map((d) => (
                      <div className="dash-row" key={d.id}>
                        <span className="dash-row-icon"><Icon name="store" size={15} /></span>
                        <div className="dash-row-body">
                          {d.name}
                          <small>{d.alamat}</small>
                        </div>
                        <div className="dash-row-right">{d.latitude}, {d.longitude}</div>
                      </div>
                    ))
                  )}
                </div>
                )}

                {!canAcc && !canDealer && (
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="grid" size={17} /> Menu Anda</h3>
                  </div>
                  <p className="dash-card-desc">Fitur yang tersedia untuk akun Anda.</p>
                  {menus.filter((m) => m !== MENU_HOME).length === 0 ? (
                    <p className="dash-empty">Belum ada menu yang dapat diakses.</p>
                  ) : (
                    menus.filter((m) => m !== MENU_HOME).map((m) => (
                      <div className="dash-row" key={m}>
                        <span className="dash-row-icon"><Icon name={MENU_ICONS[m]} size={15} /></span>
                        <div className="dash-row-body">{m}</div>
                        <button className="dash-btn soft" onClick={() => setMenu(m)}>Buka</button>
                      </div>
                    ))
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
