// src/api/activityLogs.js
// Riwayat perubahan data (BE: GET {path}/logs, format ActivityLogResource + paginasi). Hanya baca.
import api from './axios';
import { toMeta } from './pagination';

// menu = nama menu BE (middleware menu.access); perm = permission yang dibutuhkan BE.
// role-menus & role-permissions tidak punya permission *.logs di BE, jadi mengikuti hak kelola role.
export const LOG_SOURCES = [
  { key: 'users', group: 'Akun & Akses', label: 'Pengguna', path: '/users/logs', menu: 'users', perm: 'users.logs' },
  { key: 'role-menus', group: 'Akun & Akses', label: 'Menu per Role', path: '/role-menus/logs', menu: 'role-menus', perm: 'role-menus.kelola' },
  { key: 'role-permissions', group: 'Akun & Akses', label: 'Permission per Role', path: '/role-permissions/logs', menu: 'role-menus', perm: 'role-permissions.kelola' },
  { key: 'dealers', group: 'Master Data', label: 'Dealer', path: '/dealers/logs', menu: 'dealers', perm: 'dealers.logs' },
  { key: 'agamas', group: 'Master Data', label: 'Agama', path: '/agamas/logs', menu: 'agamas', perm: 'agamas.logs' },
  { key: 'pekerjaans', group: 'Master Data', label: 'Pekerjaan', path: '/pekerjaans/logs', menu: 'pekerjaans', perm: 'pekerjaans.logs' },
  { key: 'provinsis', group: 'Wilayah', label: 'Provinsi', path: '/provinsis/logs', menu: 'provinsis', perm: 'provinsis.logs' },
  { key: 'kabupaten-kotas', group: 'Wilayah', label: 'Kabupaten/Kota', path: '/kabupaten-kotas/logs', menu: 'kabupaten-kotas', perm: 'kabupaten-kotas.logs' },
  { key: 'kecamatans', group: 'Wilayah', label: 'Kecamatan', path: '/kecamatans/logs', menu: 'kecamatans', perm: 'kecamatans.logs' },
  { key: 'kelurahans', group: 'Wilayah', label: 'Kelurahan/Desa', path: '/kelurahans/logs', menu: 'kelurahans', perm: 'kelurahans.logs' },
  { key: 'email-whitelists', group: 'Pengaturan', label: 'Whitelist Email', path: '/email-whitelists/logs', menu: 'email-whitelists', perm: 'email-whitelists.logs' },
  { key: 'email-smtps', group: 'Pengaturan', label: 'SMTP Email', path: '/email-smtps/logs', menu: 'email-smtps', perm: 'email-smtps.logs' },
  { key: 'url-ip-logins', group: 'Pengaturan', label: 'URL/IP Login', path: '/url-ip-logins/logs', menu: 'url-ip-logins', perm: 'url-ip-logins.logs' },
  { key: 'app-key-ocrs', group: 'Pengaturan', label: 'App Key OCR', path: '/app-key-ocrs/logs', menu: 'app-key-ocrs', perm: 'app-key-ocrs.logs' },
  { key: 'configurasi-rate-limits', group: 'Pengaturan', label: 'Rate Limit', path: '/configurasi-rate-limits/logs', menu: 'configurasi-rate-limits', perm: 'configurasi-rate-limits.logs' },
];

// Sumber log yang boleh dilihat user: menu BE-nya aktif dan permission-nya dimiliki
export const availableLogSources = (hasMenu, can) => LOG_SOURCES.filter((s) => hasMenu(s.menu) && can(s.perm));

// BE memaginasi: { data: [...], meta }
export const getActivityLogs = async (path, page = 1, search = '') => {
  const body = (await api.get(path, { params: { page, ...(search ? { search } : {}) } })).data;
  const m = body.meta ?? {};
  return { rows: body.data ?? [], meta: toMeta(m) };
};
