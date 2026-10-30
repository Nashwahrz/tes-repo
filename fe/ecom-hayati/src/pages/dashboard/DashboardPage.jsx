// src/pages/DashboardPage.jsx
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutUser, getKonsumenStatusTotals } from '../../api/authServices';
import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_WHITELIST, MENU_SMTP, MENU_URLIP, MENU_OCR, MENU_RATELIMIT, MENU_LOG, MASTER_MENUS, MENU_PATHS, menuFromPath,
} from './menuPaths';
import Loading from './components/Loading';
import Icon from './components/Icon';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import ConfirmModal from './components/ConfirmModal';
import { NAV } from './navConfig';
import { clearCache } from './dashboardCache';
import { deriveAccess } from './dashboardAccess';
import { useDashboardData } from './useDashboardData';
import { useChangeWatcher, accSig, konsumenSig } from './useChangeWatcher';
import { SALES_PROTOTYPE, salesFor } from './salesPrototype';
import './DashboardPage.css';

// Panel hanya dimuat saat menunya dibuka
const AccUserPanel = lazy(() => import('./components/AccUserPanel'));
const DealerPanel = lazy(() => import('./components/DealerPanel'));
const KonsumenPanel = lazy(() => import('./components/KonsumenPanel'));
const LogPanel = lazy(() => import('./components/LogPanel'));
const PenjualanPanel = lazy(() => import('./components/PenjualanPanel'));
const UrlIpLoginPanel = lazy(() => import('./components/UrlIpLoginPanel'));
const AppKeyOcrPanel = lazy(() => import('./components/AppKeyOcrPanel'));
const EmailSmtpPanel = lazy(() => import('./components/EmailSmtpPanel'));
const EmailWhitelistPanel = lazy(() => import('./components/EmailWhitelistPanel'));
const RoleAccessPanel = lazy(() => import('./components/RoleAccessPanel'));
const RateLimitPanel = lazy(() => import('./components/RateLimitPanel'));
const MasterPanel = lazy(() => import('./components/MasterPanel'));

const ROLE_ADMIN = 'Super Admin';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

function DashboardPage() {
  const [user] = useState(readUser);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const data = useDashboardData(user);
  const { access, loading, selfInfo, dealers, konsumenStats, recentKonsumen } = data;
  // Akun yang emailnya belum terverifikasi (email_verifikasi false) tidak ditampilkan di mana pun: daftar, hitungan, maupun Otorisasi Akun
  const users = useMemo(() => data.allUsers.filter((u) => u.email_verifikasi), [data.allUsers]);
  const pending = useMemo(() => users.filter((u) => u.status === 'pending'), [users]);
  const activeCount = useMemo(() => users.filter((u) => u.status === 'aktif').length, [users]);

  // BE membatasi dealer/akun/konsumen ke dealer milik user non-Super Admin (scope per dealer).
  // Role & dealer sendiri diambil dari daftar users karena respons login hanya memuat id & email.
  const me = users.find((u) => u.id === user?.id);
  const myRole = me?.role?.name ?? selfInfo?.role ?? null;
  const myDealer = me?.dealer?.name ?? null;
  const scoped = !!me && myRole !== ROLE_ADMIN && !!me.id_dealer;
  const isAdmin = myRole === ROLE_ADMIN;
  const myDealerId = me?.id_dealer ?? selfInfo?.id_dealer ?? null;
  const scopeNote = scoped ? `Data dibatasi pada dealer Anda${myDealer ? `: ${myDealer}` : ''}.` : '';

  // Penjualan: Super Admin melihat semua dealer, role lain hanya dealer miliknya. Saat ini data contoh (lihat salesPrototype.js)
  const salesRows = isAdmin ? salesFor(null) : myDealerId != null ? salesFor(myDealerId) : [];
  const salesKnown = SALES_PROTOTYPE && (isAdmin || myDealerId != null);
  const salesDealerName = isAdmin ? null : dealers.find((d) => d.id === myDealerId)?.name ?? salesRows[0]?.dealer ?? null;

  // Menu sidebar & tombol aksi mengikuti menu/permission role dari BE
  const acc = deriveAccess(access);
  const { can, menus, canDealer, canUsers, canSales, canKonsumen, canAcc, canActivate, canRoleMenu, canRolePerm, canRole, canWhitelist, canUrlIp, canOcr, canSmtp, canLoginLog, canKonsumenLog, canLog, canRateLimit, canVerifyKonsumen } = acc;

  // Kartu ringkasan hanya untuk data yang boleh dilihat role; data konsumen sudah dibatasi BE sesuai dealer user
  const baseStats = [
    ...(canDealer ? [{ label: scoped ? 'Dealer Anda' : 'Total Dealer', value: dealers.length, icon: 'store', tone: 'orange', hint: 'dealer terdaftar' }] : []),
    ...(canUsers ? [{ label: 'Akun Aktif', value: activeCount, icon: 'check', tone: 'green', hint: 'akun dapat masuk ke sistem' }] : []),
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

  // Lencana sidebar: jumlah data yang menunggu tindakan user ini
  const badges = {
    [MENU_ACC]: canActivate ? pending.length : 0,
    [MENU_KONSUMEN]: canVerifyKonsumen ? konsumenStats.pending ?? 0 : 0,
  };

  const { changed, markSeen, consume } = useChangeWatcher({
    userId: user?.id,
    watchAcc: data.watchAcc && canAcc,
    watchKonsumen: data.watchKonsumen && canKonsumen,
    pendingUsers: data.pendingUsers,
    konsumenStatus: data.konsumenStatus,
    onAccChanged: data.reloadUsers,
  });
  const [konsumenKey, setKonsumenKey] = useState(0); // naik = panel konsumen dimuat ulang

  // Menu aktif harus masih diizinkan, kalau tidak pindah ke menu pertama (menus kosong = belum dimuat)
  const routeMenu = menuFromPath(pathname) ?? MENU_HOME;
  const menu = menus.length === 0 || menus.includes(routeMenu) ? routeMenu : menus[0];
  const setMenu = (m) => { if (pathname !== MENU_PATHS[m]) navigate(MENU_PATHS[m]); };

  // URL harus sama dengan menu yang benar-benar tampil (mis. path menu yang tidak diizinkan role)
  useEffect(() => {
    if (pathname !== MENU_PATHS[menu]) navigate(MENU_PATHS[menu], { replace: true });
  }, [menu, pathname, navigate]);

  // Membuka menu yang bertanda: tandai sudah dilihat dan muat ulang datanya
  const openMenu = (m) => {
    setMenu(m);
    if (consume(m) && m === MENU_KONSUMEN) setKonsumenKey((k) => k + 1);
  };

  const nav = NAV
    .map((n) => (n.group ? { ...n, items: n.items.filter((m) => menus.includes(m)) } : n))
    .filter((n) => (n.group ? n.items.length > 0 : menus.includes(n.item)))
    .flatMap((n) => (n.group && n.items.length === 1 ? [{ item: n.items[0] }] : [n]));

  // Segarkan lencana; perubahan dari user sendiri tidak ditandai
  const refreshKonsumenStats = () => {
    getKonsumenStatusTotals()
      .then((t) => { markSeen(MENU_KONSUMEN, konsumenSig(t)); data.setKonsumenStatus(t); })
      .catch(() => {});
  };

  const [confirmLogout, setConfirmLogout] = useState(false);
  const handleLogout = async () => {
    // Cabut token di BE; gagal (offline/token sudah kedaluwarsa) tidak boleh menahan user keluar
    await logoutUser().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearCache();
    navigate('/', { replace: true });
  };

  const name = me?.name || selfInfo?.name || user?.email?.split('@')[0] || 'Pengguna';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dash">
      <Sidebar
        nav={nav}
        menu={menu}
        badges={badges}
        changed={changed}
        name={name}
        role={myRole}
        dealer={myDealer}
        onSelect={openMenu}
        onLogout={() => setConfirmLogout(true)}
      />

      {confirmLogout && (
        <ConfirmModal title="Keluar" confirmLabel="Ya, Keluar" onConfirm={handleLogout} onCancel={() => setConfirmLogout(false)}>
          <p className="dash-card-desc">Yakin ingin keluar dari akun ini?</p>
        </ConfirmModal>
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
                    const next = data.allUsers.map((u) => (u.id === updated.id ? updated : u));
                    data.setUsers(next);
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
                    onDealersChange={data.setDealers}
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
                <LogPanel canLogin={canLoginLog} canKonsumen={canKonsumenLog} canBlocked={canLoginLog} />
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

          {menu === MENU_SMTP && canSmtp && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={4} />}>
                <EmailSmtpPanel
                  can={{ tambah: can('email-smtps.tambah'), ubah: can('email-smtps.ubah'), hapus: can('email-smtps.hapus') }}
                />
              </Suspense>
            </div>
          )}

          {menu === MENU_URLIP && canUrlIp && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={3} />}>
                <UrlIpLoginPanel canEdit={can('url-ip-logins.ubah')} />
              </Suspense>
            </div>
          )}

          {menu === MENU_OCR && canOcr && (
            <div className="dash-card">
              <Suspense fallback={<Loading rows={3} />}>
                <AppKeyOcrPanel canEdit={can('app-key-ocrs.ubah')} />
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
                <RoleAccessPanel canMenu={canRoleMenu} canPermission={canRolePerm} onSaved={data.refetchAccess} />
              </Suspense>
            </div>
          )}

          {menu === MENU_HOME && (
            <HomeView
              name={name}
              today={today}
              scopeNote={scopeNote}
              can={acc}
              sales={{ rows: salesRows, known: salesKnown, dealerName: salesDealerName, isAdmin }}
              stats={stats}
              pending={pending}
              dealers={dealers}
              recentKonsumen={recentKonsumen}
              menus={menus}
              onSelect={setMenu}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
