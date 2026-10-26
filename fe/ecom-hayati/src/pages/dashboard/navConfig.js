// Ikon dan struktur sidebar
import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_WHITELIST, MENU_SMTP, MENU_URLIP, MENU_RATELIMIT, MENU_LOG, MENU_AGAMA, MENU_PEKERJAAN, MENU_PROVINSI, MENU_KABUPATEN, MENU_KECAMATAN, MENU_KELURAHAN,
} from './menuPaths';

// Url menu BE yang mengendalikan tiap menu sidebar (Produk dipertahankan walau endpoint BE-nya belum ada)
export const MENU_URL = { [MENU_HOME]: 'dashboard', [MENU_PRODUK]: 'daftar-motor' };

export const MENU_ICONS = {
  [MENU_HOME]: 'grid',
  [MENU_PRODUK]: 'box',
  [MENU_PENJUALAN]: 'chart',
  [MENU_DEALER]: 'store',
  [MENU_KONSUMEN]: 'id',
  [MENU_ACC]: 'shield',
  [MENU_ROLE]: 'shield',
  [MENU_WHITELIST]: 'mail',
  [MENU_SMTP]: 'mail',
  [MENU_URLIP]: 'shield',
  [MENU_RATELIMIT]: 'shield',
  [MENU_LOG]: 'clock',
};

// Struktur sidebar: menu tunggal (`item`) atau grup berisi submenu. Menu yang tidak diizinkan role tidak ditampilkan,
// dan grup yang hanya punya satu menu tampil sebagai menu biasa.
export const NAV = [
  { item: MENU_HOME },
  { group: 'Operasional', icon: 'store', items: [MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN] },
  { group: 'Administrasi', icon: 'shield', items: [MENU_ACC, MENU_ROLE, MENU_LOG] },
  { group: 'Pengaturan', icon: 'gear', items: [MENU_WHITELIST, MENU_SMTP, MENU_URLIP, MENU_RATELIMIT] },
  { group: 'Data Master', icon: 'box', items: [MENU_AGAMA, MENU_PEKERJAAN, MENU_PROVINSI, MENU_KABUPATEN, MENU_KECAMATAN, MENU_KELURAHAN] },
];
