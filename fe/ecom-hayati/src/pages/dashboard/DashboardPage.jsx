// src/pages/DashboardPage.jsx
import { lazy, Suspense, useEffect, useState } from 'react';
import { getUsers, getDealers, getUserMenus, getUserPermissions } from '../../api/authServices';
import './DashboardPage.css';

// Panel hanya dimuat saat menunya dibuka
const AccUserPanel = lazy(() => import('./components/AccUserPanel'));
const DealerPanel = lazy(() => import('./components/DealerPanel'));
const RoleAccessPanel = lazy(() => import('./components/RoleAccessPanel'));

const LOGO_SRC = '/logo.png';
const MENU_HOME = 'Ringkasan';
const MENU_PRODUK = 'Produk';
const MENU_DEALER = 'Dealer';
const MENU_ACC = 'Audit Log & Akses';
const MENU_ROLE = 'Role & Hak Akses';

// Url menu BE yang mengendalikan tiap menu sidebar (Produk dipertahankan walau endpoint BE-nya belum ada)
const MENU_URL = { [MENU_HOME]: 'dashboard', [MENU_PRODUK]: 'daftar-motor' };

const PATHS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  box: <><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>,
  store: <><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  shield: <><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  off: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
};

const MENU_ICONS = {
  [MENU_HOME]: 'grid',
  [MENU_PRODUK]: 'box',
  [MENU_DEALER]: 'store',
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

const writeCache = (userId, users, dealers, access) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, users, dealers, access }));
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
  const [loading, setLoading] = useState(!cached);
  const [menuState, setMenu] = useState(MENU_HOME);
  const [query, setQuery] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    let active = true;
    // Dua request jalan paralel; hasilnya dipakai bersama oleh semua tampilan
    // null = request gagal: data lama (cache) dipertahankan
    Promise.all([
      getUsers().catch(() => null),
      getDealers().catch(() => null),
      getUserMenus().catch(() => null),
      getUserPermissions().catch(() => null),
    ]).then(([userList, dealerList, menuList, permList]) => {
      if (!active) return;
      const newAccess = menuList && permList ? toAccess(menuList, permList) : null;
      if (userList) setUsers(userList);
      if (dealerList) setDealers(dealerList);
      if (newAccess) setAccess(newAccess);
      if (userList && dealerList && newAccess) writeCache(user?.id, userList, dealerList, newAccess);
      setLoading(false);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (status) => users.filter((u) => u.status === status).length;
  const pending = users.filter((u) => u.status === 'pending');

  const stats = [
    { icon: 'store', label: 'Total Dealer', value: dealers.length, unit: 'Dealer' },
    { icon: 'check', label: 'Akun Aktif', value: count('aktif'), unit: 'Akun' },
    { icon: 'clock', label: 'Menunggu Persetujuan', value: count('pending'), unit: 'Akun', tag: count('pending') > 0 ? 'Perlu Tindakan' : null },
    { icon: 'off', label: 'Akun Nonaktif', value: count('nonaktif'), unit: 'Akun' },
  ];

  const q = query.trim().toLowerCase();
  const filteredDealers = q
    ? dealers.filter((d) => `${d.name} ${d.alamat}`.toLowerCase().includes(q))
    : dealers;

  // Menu sidebar & tombol aksi mengikuti menu/permission role dari BE
  const hasMenu = (url) => access.menus.includes(url);
  const can = (perm) => access.permissions.includes(perm);
  const canDealer = hasMenu('dealers') && can('dealers.lihat');
  const canAcc = hasMenu('users') && can('users.lihat') && can('users.aktivasi');
  const canRoleMenu = hasMenu('role-menus') && can('role-menus.kelola');
  const canRolePerm = hasMenu('role-menus') && can('role-permissions.kelola');
  const canRole = canRoleMenu || canRolePerm;

  const menus = [
    ...(hasMenu(MENU_URL[MENU_HOME]) ? [MENU_HOME] : []),
    ...(hasMenu(MENU_URL[MENU_PRODUK]) ? [MENU_PRODUK] : []),
    ...(canDealer ? [MENU_DEALER] : []),
    ...(canAcc ? [MENU_ACC] : []),
    ...(canRole ? [MENU_ROLE] : []),
  ];
  // Menu yang aktif harus masih diizinkan; kalau hak akses berubah, pindah ke menu pertama yang tersedia.
  // Sebelum hak akses termuat (menus kosong) tetap tampilkan Ringkasan.
  const menu = menus.length === 0 || menus.includes(menuState) ? menuState : menus[0];

  // Muat ulang menu & permission setelah hak akses role diubah
  const refreshAccess = async () => {
    try {
      const [menuList, permList] = await Promise.all([getUserMenus(), getUserPermissions()]);
      const next = toAccess(menuList, permList);
      setAccess(next);
      writeCache(user?.id, users, dealers, next);
    } catch {
      // gagal: hak akses lama dipertahankan sampai halaman dimuat ulang
    }
  };

  const initial = (user?.email || '?').charAt(0).toUpperCase();
  const name = user?.email?.split('@')[0] || 'Pengguna';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem(CACHE_KEY);
    window.location.href = '/';
  };

  return (
    <div className="dash">
      <aside className="dash-side">
        <div className="dash-brand">
          <img src={LOGO_SRC} alt="Logo Hayati" />
          <div>
            <strong>Hayati</strong>
            <small>Management Workspace</small>
          </div>
        </div>

        <ul className="dash-menu">
          {menus.map((m) => (
            <li key={m} className={`dash-menu-item${menu === m ? ' active' : ''}`} onClick={() => setMenu(m)}>
              <Icon name={MENU_ICONS[m]} size={17} />
              {m}
            </li>
          ))}
        </ul>

        <div className="dash-side-foot">
          <div className="dash-avatar">{initial}</div>
          <div className="dash-side-user">
            <strong>{name}</strong>
            <small>Pengguna</small>
          </div>
          <button className="dash-logout" onClick={() => setConfirmLogout(true)}>Keluar</button>
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
          <div className="dash-top-right">
            <div>
              Total Dealer
              <strong>{dealers.length}</strong>
            </div>
            <div>
              Akun Aktif
              <strong>{count('aktif')}</strong>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {menu === MENU_ACC && canAcc && (
            <div className="dash-card">
              <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                <AccUserPanel
                  users={users}
                  dealers={dealers}
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

          {menu === MENU_DEALER && canDealer && (
            <div className="dash-card">
              {loading ? (
                <p className="dash-empty">Memuat...</p>
              ) : (
                <Suspense fallback={<p className="dash-empty">Memuat...</p>}>
                  <DealerPanel
                    dealers={dealers}
                    can={{ tambah: can('dealers.tambah'), ubah: can('dealers.ubah'), hapus: can('dealers.hapus') }}
                    onDealersChange={(update) => setDealers((list) => update(list))}
                  />
                </Suspense>
              )}
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
                  <p>Pantau jaringan dealer motor dan status akun pengguna dalam satu tampilan.</p>
                </div>
                {canAcc && (
                  <button className="dash-btn solid" onClick={() => setMenu(MENU_ACC)}>Audit Log &amp; Akses</button>
                )}
              </div>

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
                  {canDealer && <button className="dash-btn ghost" onClick={() => setMenu(MENU_DEALER)}>Lihat Dealer →</button>}
                </div>
              </section>

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

              <section className="dash-grid">
                <div className="dash-card">
                  <div className="dash-card-head">
                    <h3><Icon name="shield" size={17} /> Otorisasi Akun</h3>
                    {canAcc && <span className="dash-badge">{pending.length} Tertunda</span>}
                  </div>
                  <p className="dash-card-desc">Validasi akun baru sebelum diberi akses ke sistem.</p>

                  {!canAcc ? (
                    <p className="dash-empty">Anda tidak memiliki akses untuk meng-ACC akun.</p>
                  ) : pending.length === 0 ? (
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
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
