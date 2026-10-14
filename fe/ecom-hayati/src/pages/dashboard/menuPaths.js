// Menu dashboard <-> path URL. Path unik per menu agar URL bisa di-bookmark dan tombol back/forward berfungsi.
export const MENU_HOME = 'Ringkasan';
export const MENU_PRODUK = 'Produk';
export const MENU_PENJUALAN = 'Penjualan';
export const MENU_DEALER = 'Dealer';
export const MENU_KONSUMEN = 'Konsumen';
export const MENU_ACC = 'Pengguna & Akses';
export const MENU_ROLE = 'Role & Hak Akses';
export const MENU_WHITELIST = 'Email Whitelist';

export const MENU_PATHS = {
  [MENU_HOME]: '/dashboard',
  [MENU_PRODUK]: '/produk',
  [MENU_PENJUALAN]: '/penjualan',
  [MENU_DEALER]: '/dealer',
  [MENU_KONSUMEN]: '/konsumen',
  [MENU_ACC]: '/pengguna-akses',
  [MENU_ROLE]: '/role-akses',
  [MENU_WHITELIST]: '/email-whitelist',
};

const normalize = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

// Menu untuk sebuah path; null bila path bukan halaman dashboard
export const menuFromPath = (path) => Object.keys(MENU_PATHS).find((m) => MENU_PATHS[m] === normalize(path)) ?? null;

export const isDashboardPath = (path) => menuFromPath(path) !== null;
