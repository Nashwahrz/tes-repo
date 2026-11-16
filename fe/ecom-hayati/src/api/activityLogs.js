// src/api/activityLogs.js
// Riwayat perubahan data (BE: GET {path}/logs, format ActivityLogResource + paginasi). Hanya baca.
import api from './axios';
import { toPage } from './pagination';

// menu = nama menu BE (middleware menu.access); perm = permission yang dibutuhkan BE.
// role-menus & role-permissions tidak punya permission *.logs di BE, jadi mengikuti hak kelola role.
export const LOG_SOURCES = [
  { key: 'users', group: 'Akun & Akses', label: 'Pengguna', path: '/users/logs', menu: 'users', perm: 'users.logs' },
  { key: 'role-menus', group: 'Akun & Akses', label: 'Menu per Role', path: '/role-menus/logs', menu: 'role-menus', perm: 'role-menus.kelola' },
  { key: 'role-permissions', group: 'Akun & Akses', label: 'Permission per Role', path: '/role-permissions/logs', menu: 'role-menus', perm: 'role-permissions.kelola' },
];
// Rute /logs untuk dealer, master (agama, pekerjaan), wilayah, SMTP, URL/IP login, App Key OCR, dan rate limit dinonaktifkan di BE
// (log Spatie dihapus). Tambahkan lagi ke daftar ini bila BE sudah menyediakan rute log barunya.

// Sumber log yang boleh dilihat user: menu BE-nya aktif dan permission-nya dimiliki
export const availableLogSources = (hasMenu, can) => LOG_SOURCES.filter((s) => hasMenu(s.menu) && can(s.perm));

// Daftar menu/permission (array objek) dari log sync role => satu teks "A, B, C" agar bisa dibandingkan per field
const listOf = (arr, key, label) => (Array.isArray(arr) ? { [label]: arr.map((x) => x?.[key] ?? `#${x?.id}`).join(', ') || '-' } : arr);
const asListData = (data, l) => {
  if (!Array.isArray(data)) return data ?? null;
  const first = data[0] ?? {};
  if ('permission_name' in first || l.permission) return listOf(data, 'permission_name', 'permission');
  return listOf(data, 'menu_name', 'menu');
};

// BE log tersendiri (pengguna, menu role, permission role): { action, description, user_target | role, causer, old_data, new_data, created_at }
// diubah ke bentuk ActivityLogResource yang dipakai ActivityLogPanel
export const normalizeActivityLog = (l) => {
  if (l.action === undefined) return l;
  const target = l.user_target ?? l.role ?? null;
  return {
    id: l.id,
    aksi: String(l.action).toLowerCase(),
    deskripsi: l.description ?? l.action_label ?? l.action,
    subject: target ? { id: target.id, name: l.role ? `Role ${target.name ?? `#${target.id}`}` : target.name } : null,
    oleh: l.causer ?? null,
    waktu: l.created_at,
    data_lama: asListData(l.old_data, l),
    data_baru: asListData(l.new_data, l),
  };
};

// BE memaginasi: { data: [...], meta }
export const getActivityLogs = async (path, page = 1, search = '') => {
  const body = (await api.get(path, { params: { page, ...(search ? { search } : {}) } })).data;
  const res = toPage(body);
  return { ...res, rows: res.rows.map(normalizeActivityLog) };
};
