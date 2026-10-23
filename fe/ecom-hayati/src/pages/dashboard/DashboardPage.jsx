// src/pages/DashboardPage.jsx
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { getUsers, getDealers, getKonsumenTotal, getKonsumenStatusTotals, getUserMenus, getUserPermissions } from '../../api/authServices';
import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_WHITELIST, MENU_RATELIMIT, MENU_LOG, MENU_AGAMA, MENU_PEKERJAAN, MENU_PROVINSI, MENU_KABUPATEN, MENU_KECAMATAN, MENU_KELURAHAN, MASTER_MENUS, MENU_PATHS, menuFromPath,
} from './menuPaths';
import Loading from './components/Loading';
import Icon from './components/Icon';
import { MENU_URL, MENU_ICONS, NAV } from './navConfig';
import { NO_KONSUMEN, readCache, writeCache, clearCache, toAccess } from './dashboardCache';
import { rupiah } from './salesAnalytics';
import ConfirmModal from './components/ConfirmModal';
import { SALES_PROTOTYPE, salesFor, totalSales } from './salesPrototype';
import SalesChart from './components/SalesChart';
import './DashboardPage.css';

// Panel hanya dimuat saat menunya dibuka
const AccUserPanel = lazy(() => import('./components/AccUserPanel'));
const DealerPanel = lazy(() => import('./components/DealerPanel'));
const KonsumenPanel = lazy(() => import('./components/KonsumenPanel'));
const LogPanel = lazy(() => import('./components/LogPanel'));
const PenjualanPanel = lazy(() => import('./components/PenjualanPanel'));
const EmailWhitelistPanel = lazy(() => import('./components/EmailWhitelistPanel'));
const RoleAccessPanel = lazy(() => import('./components/RoleAccessPanel'));
const RateLimitPanel = lazy(() => import('./components/RateLimitPanel'));
const MasterPanel = lazy(() => import('./components/MasterPanel'));

const LOGO_SRC = '/logo.png';

const KONSUMEN_STATUS = { pending: 'Menunggu', diterima: 'Diterima', ditolak: 'Ditolak' };

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
  const [allUsers, setUsers] = useState(cached?.users ?? []);
  // Akun yang emailnya belum terverifikasi (email_verifikasi false) tidak ditampilkan di mana pun: daftar, hitungan, maupun Otorisasi Akun
  const users = allUsers.filter((u) => u.email_verifikasi);
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
  const [confirmLogout, setConfirmLogout] = useState(false);
  // Sidebar desktop bisa disembunyikan; pilihan diingat di localStorage
  const [sideHidden, setSideHidden] = useState(() => {
    try { return localStorage.getItem('dash-side-hidden') === '1'; } catch { return false; }
  });
  const toggleSide = () => setSideHidden((h) => {
    try { localStorage.setItem('dash-side-hidden', h ? '0' : '1'); } catch { /* abaikan */ }
    return !h;
  });
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
        // Pemverifikasi juga butuh jumlah pending untuk lencana sidebar
        const needStatus = allowed('konsumens', 'konsumens.lihat') && (allowed('konsumens', 'konsumens.aktivasi') || !(allowed('dealers', 'dealers.lihat') && allowed('users', 'users.lihat')));
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
          // id_me = penginput (role apa pun yang punya konsumens.tambah); nama & dealer diambil dari relasi `me`
          const mine = countList.rows.find((k) => k.id_me === user?.id && k.me?.name);
          if (mine) {
            const info = { name: mine.me.name, role: selfInfo?.role ?? user?.role ?? null, id_dealer: mine.me.id_dealer ?? null };
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
  // Data Master: agama & pekerjaan punya menu/permission sendiri di BE
  const canLoginLog = hasMenu('log-users') && can('log-users.lihat');
  const canKonsumenLog = hasMenu('konsumens') && can('konsumens.logs');
  const canLog = canLoginLog || canKonsumenLog;
  const canRateLimit = hasMenu('configurasi-rate-limits') && can('configurasi-rate-limits.lihat');
  const canAgama = hasMenu('agamas') && can('agamas.lihat');
  const canPekerjaan = hasMenu('pekerjaans') && can('pekerjaans.lihat');
  // Wilayah belum punya permission di BE: tampil bagi yang boleh melihat agama/pekerjaan
  const canWilayah = canAgama || canPekerjaan;

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

  // Lencana sidebar: jumlah data yang menunggu tindakan user ini
  const badges = {
    [MENU_ACC]: canActivate ? pending.length : 0,
    [MENU_KONSUMEN]: canVerifyKonsumen ? konsumenStats.pending ?? 0 : 0,
  };
  // Penanda perubahan data di sidebar (titik tanpa angka): tanda tangan terakhir yang sudah dilihat disimpan per user & menu.
  // Perubahan terdeteksi lewat pengecekan berkala; titik hilang saat menu dibuka.
  const [changed, setChanged] = useState({});
  const latestSig = useRef({});
  const seenKey = (m) => `seen:${user?.id}:${m}`;
  const markSeen = (m, sig) => {
    latestSig.current[m] = sig;
    try { localStorage.setItem(seenKey(m), sig); } catch { /* penyimpanan penuh: abaikan */ }
    setChanged((c) => (c[m] ? { ...c, [m]: false } : c));
  };
  const accSig = (list) => list.filter((u) => u.email_verifikasi && u.status === 'pending').map((u) => u.id).sort().join(',');
  const konsumenSig = (t) => `${t.pending}|${t.ditolak}`;

  const refreshKonsumenStats = () => {
    getKonsumenStatusTotals()
      .then((t) => { setKonsumenStats((s) => ({ ...s, ...t })); markSeen(MENU_KONSUMEN, konsumenSig(t)); })
      .catch(() => {});
  };
  const [konsumenKey, setKonsumenKey] = useState(0); // naik = panel konsumen dimuat ulang

  const watchAcc = canAcc;
  const watchKonsumen = canKonsumen;
  useEffect(() => {
    if (!watchAcc && !watchKonsumen) return undefined;
    let active = true;
    const note = (m, sig) => {
      latestSig.current[m] = sig;
      const seen = localStorage.getItem(seenKey(m));
      if (seen === null) localStorage.setItem(seenKey(m), sig); // pertama kali: jadikan acuan, bukan perubahan
      else if (seen !== sig) setChanged((c) => (c[m] ? c : { ...c, [m]: true }));
    };
    const check = async () => {
      if (document.hidden) return;
      if (watchKonsumen) {
        try {
          const t = await getKonsumenStatusTotals();
          if (!active) return;
          setKonsumenStats((s) => ({ ...s, ...t }));
          note(MENU_KONSUMEN, konsumenSig(t));
        } catch { /* gagal: coba lagi pada pengecekan berikutnya */ }
      }
      if (watchAcc) {
        try {
          // Cek ringan: hanya akun pending; daftar lengkap dimuat ulang hanya bila ada perubahan
          const sig = accSig(await getUsers('pending'));
          if (!active) return;
          if (latestSig.current[MENU_ACC] !== undefined && latestSig.current[MENU_ACC] !== sig) {
            const list = await getUsers();
            if (!active) return;
            setUsers(list);
          }
          note(MENU_ACC, sig);
        } catch { /* gagal: coba lagi pada pengecekan berikutnya */ }
      }
    };
    check();
    const timer = setInterval(check, 30000);
    document.addEventListener('visibilitychange', check);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', check); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAcc, watchKonsumen]);

  // Membuka menu yang bertanda: tandai sudah dilihat dan muat ulang datanya
  const openMenu = (m) => {
    setMenu(m);
    setNavOpen(false);
    if (!changed[m]) return;
    markSeen(m, latestSig.current[m] ?? '');
    if (m === MENU_KONSUMEN) setKonsumenKey((k) => k + 1);
  };

  const renderMenuItem = (m, sub = false) => (
    <li key={m} className={`dash-menu-item${sub ? ' sub' : ''}${menu === m ? ' active' : ''}`} onClick={() => openMenu(m)}>
      {!sub && <Icon name={MENU_ICONS[m]} size={17} />}
      {changed[m] && <span className="dash-menu-dot" title="Ada perubahan data" />}
      {m}
      {badges[m] > 0 && <span className="dash-menu-badge" title={`${badges[m]} menunggu`}>{badges[m] > 99 ? '99+' : badges[m]}</span>}
    </li>
  );

  const menus = [
    ...(hasMenu(MENU_URL[MENU_HOME]) ? [MENU_HOME] : []),
    ...(hasMenu(MENU_URL[MENU_PRODUK]) ? [MENU_PRODUK] : []),
    ...(canSales ? [MENU_PENJUALAN] : []),
    ...(canDealer ? [MENU_DEALER] : []),
    ...(canKonsumen ? [MENU_KONSUMEN] : []),
    ...(canAcc ? [MENU_ACC] : []),
    ...(canRole ? [MENU_ROLE] : []),
    ...(canWhitelist ? [MENU_WHITELIST] : []),
    ...(canRateLimit ? [MENU_RATELIMIT] : []),
    ...(canLog ? [MENU_LOG] : []),
    ...(canAgama ? [MENU_AGAMA] : []),
    ...(canPekerjaan ? [MENU_PEKERJAAN] : []),
    ...(canWilayah ? [MENU_PROVINSI, MENU_KABUPATEN, MENU_KECAMATAN, MENU_KELURAHAN] : []),
  ];
  const nav = NAV
    .map((n) => (n.group ? { ...n, items: n.items.filter((m) => menus.includes(m)) } : n))
    .filter((n) => (n.group ? n.items.length > 0 : menus.includes(n.item)))
    .flatMap((n) => (n.group && n.items.length === 1 ? [{ item: n.items[0] }] : [n]));
  // Menu yang aktif harus masih diizinkan; kalau hak akses berubah, pindah ke menu pertama yang tersedia.
  // Sebelum hak akses termuat (menus kosong) tetap tampilkan Ringkasan.
  const menu = menus.length === 0 || menus.includes(menuState) ? menuState : menus[0];

  // Grup terbuka bila berisi menu aktif, kecuali pengguna melipatnya sendiri (atau membukanya)
  const [groupToggle, setGroupToggle] = useState({});
  const groupOpen = (g) => groupToggle[g.group] ?? g.items.includes(menu);
  const toggleGroup = (g) => setGroupToggle((t) => ({ ...t, [g.group]: !groupOpen(g) }));

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
    clearCache();
    window.location.href = '/';
  };

  return (
    <div className="dash">
      {navOpen && <div className="dash-scrim" onClick={() => setNavOpen(false)} />}
      <aside className={`dash-side${navOpen ? ' open' : ''}${sideHidden ? ' hidden' : ''}`}>
        <div className="dash-brand">
          <img src={LOGO_SRC} alt="Logo Hayati" />
          <div>
            <strong>Hayati</strong>
            <small>Management Workspace</small>
          </div>
        </div>
        <button type="button" className="dash-collapse" aria-label="Sembunyikan sidebar" title="Sembunyikan sidebar" onClick={toggleSide}>
          <Icon name="chevronsLeft" size={18} />
        </button>
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
          {nav.map((n) => {
            if (!n.group) return renderMenuItem(n.item);
            const open = groupOpen(n);
            const total = n.items.reduce((sum, m) => sum + (badges[m] || 0), 0);
            return (
              <li key={n.group} className={`dash-menu-group${open ? ' open' : ''}${n.items.includes(menu) ? ' has-active' : ''}`}>
                <button type="button" className="dash-menu-group-head" aria-expanded={open} onClick={() => toggleGroup(n)}>
                  <Icon name={n.icon} size={17} />
                  {n.group}
                  {!open && total > 0 && <span className="dash-menu-badge" title={`${total} menunggu`}>{total > 99 ? '99+' : total}</span>}
                  {!open && total === 0 && n.items.some((m) => changed[m]) && <span className="dash-menu-dot dash-menu-dot-inline" title="Ada perubahan data" />}
                  <span className="dash-menu-chevron"><Icon name="chevron" size={14} /></span>
                </button>
                {open && <ul className="dash-submenu">{n.items.map((m) => renderMenuItem(m, true))}</ul>}
              </li>
            );
          })}
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
        <ConfirmModal title="Keluar" confirmLabel="Ya, Keluar" onConfirm={handleLogout} onCancel={() => setConfirmLogout(false)}>
          <p className="dash-card-desc">Yakin ingin keluar dari akun ini?</p>
        </ConfirmModal>
      )}

      {sideHidden && (
        <button type="button" className="dash-expand" aria-label="Tampilkan sidebar" title="Tampilkan sidebar" onClick={toggleSide}>
          <Icon name="chevronsRight" size={18} />
        </button>
      )}

      <div className="dash-main">

        <div className="dash-content">
          {menu === MENU_ACC && canAcc && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <AccUserPanel
                  users={users}
                  dealers={dealers}
                  scopeNote={scopeNote}
                  canActivate={canActivate}
                  loading={loading}
                  onUserUpdated={(updated) => {
                    const next = allUsers.map((u) => (u.id === updated.id ? updated : u));
                    setUsers(next);
                    markSeen(MENU_ACC, accSig(next));
                  }}
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
              <Suspense fallback={<Loading rows={4} />}>
                <PenjualanPanel rows={salesRows} scopeNote={scopeNote} />
              </Suspense>
            </div>
          )}

          {menu === MENU_DEALER && canDealer && (
            <div className="dash-card">
              {loading ? (
                <Loading rows={4} />
              ) : (
                <Suspense fallback={<Loading rows={4} />}>
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
              <Suspense fallback={<Loading rows={4} />}>
                <KonsumenPanel
                  key={konsumenKey}
                  dealers={dealers}
                  myDealerId={myDealerId}
                  userId={user?.id}
                  onChanged={refreshKonsumenStats}
                  can={{ tambah: can('konsumens.tambah'), ubah: can('konsumens.ubah'), hapus: can('konsumens.hapus'), scan: can('konsumens.scan'), verifikasi: canVerifyKonsumen }}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_LOG && canLog && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <LogPanel canLogin={canLoginLog} canKonsumen={canKonsumenLog} />
              </Suspense>
            </div>
          )}

          {menu === MENU_WHITELIST && canWhitelist && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <EmailWhitelistPanel
                  userId={user?.id}
                  users={users}
                  can={{ tambah: can('email-whitelists.tambah'), ubah: can('email-whitelists.ubah'), hapus: can('email-whitelists.hapus') }}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_RATELIMIT && canRateLimit && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <RateLimitPanel canEdit={can('configurasi-rate-limits.ubah')} />
              </Suspense>
            </div>
          )}

          {MASTER_MENUS[menu] && menus.includes(menu) && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <MasterPanel key={menu} tabKey={MASTER_MENUS[menu]} can={can} />
              </Suspense>
            </div>
          )}

          {menu === MENU_ROLE && canRole && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
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

              {(canSales || salesKnown) && (
                <SalesChart
                  rows={salesRows}
                  dealerName={salesDealerName}
                  isAdmin={isAdmin}
                  showDealerFilter
                  onViewAll={canSales ? () => setMenu(MENU_PENJUALAN) : null}
                />
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
                  {dealers.length === 0 ? (
                    <p className="dash-empty">Belum ada data dealer.</p>
                  ) : (
                    dealers.slice(0, 4).map((d) => (
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
                    <Loading rows={4} />
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
