// Menu dashboard <-> path URL. Path unik per menu agar URL bisa di-bookmark dan tombol back/forward berfungsi.
export const MENU_HOME = 'Dashboard';
export const MENU_PRODUK = 'Daftar Motor';
export const MENU_PENJUALAN = 'Penjualan';
export const MENU_DEALER = 'Daftar Dealer';
export const MENU_KONSUMEN = 'Daftar Konsumen';
export const MENU_ACC = 'Manajemen User';
export const MENU_ROLE = 'Role & Hak Akses';
export const MENU_WHITELIST = 'Email WhiteList';
export const MENU_SMTP = 'Email SMTP';
export const MENU_URLIP = 'URL IP Login';
export const MENU_OCR = 'App Key OCR';
export const MENU_RATELIMIT = 'Setting Rate Limit';
export const MENU_LOG = 'Log Aktivitas';
export const MENU_AGAMA = 'Agama';
export const MENU_PEKERJAAN = 'Pekerjaan';
export const MENU_PROVINSI = 'Provinsi';
export const MENU_KABUPATEN = 'Kabupaten / Kota';
export const MENU_KECAMATAN = 'Kecamatan';
export const MENU_KELURAHAN = 'Kelurahan';

// Submenu Data Master -> tab data di MasterPanel
export const MASTER_MENUS = {
  [MENU_AGAMA]: 'agama',
  [MENU_PEKERJAAN]: 'pekerjaan',
  [MENU_PROVINSI]: 'provinsi',
  [MENU_KABUPATEN]: 'kabupaten',
  [MENU_KECAMATAN]: 'kecamatan',
  [MENU_KELURAHAN]: 'kelurahan',
};

export const MENU_PATHS = {
  [MENU_HOME]: '/dashboard',
  [MENU_PRODUK]: '/produk',
  [MENU_PENJUALAN]: '/penjualan',
  [MENU_DEALER]: '/dealer',
  [MENU_KONSUMEN]: '/konsumen',
  [MENU_ACC]: '/pengguna-akses',
  [MENU_ROLE]: '/role-akses',
  [MENU_WHITELIST]: '/email-whitelist',
  [MENU_SMTP]: '/email-smtp',
  [MENU_URLIP]: '/url-ip-login',
  [MENU_OCR]: '/app-key-ocr',
  [MENU_RATELIMIT]: '/rate-limit',
  [MENU_LOG]: '/log-aktivitas',
  [MENU_AGAMA]: '/data-master/agama',
  [MENU_PEKERJAAN]: '/data-master/pekerjaan',
  [MENU_PROVINSI]: '/data-master/provinsi',
  [MENU_KABUPATEN]: '/data-master/kabupaten-kota',
  [MENU_KECAMATAN]: '/data-master/kecamatan',
  [MENU_KELURAHAN]: '/data-master/kelurahan',
};

const normalize = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path);

// Menu untuk sebuah path; null bila path bukan halaman dashboard
export const menuFromPath = (path) => Object.keys(MENU_PATHS).find((m) => MENU_PATHS[m] === normalize(path)) ?? null;

export const isDashboardPath = (path) => menuFromPath(path) !== null;
