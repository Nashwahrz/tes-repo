// Cache per-sesi tab: dashboard langsung tampil dari data terakhir, lalu diperbarui di latar belakang
const CACHE_KEY = 'dash-cache';
export const NO_KONSUMEN = { total: 0, rows: [] };

export const readCache = (userId) => {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    return c && c.userId === userId ? c : null;
  } catch {
    return null;
  }
};

export const writeCache = (userId, users, dealers, access, konsumenStats) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, users, dealers, access, konsumenStats }));
  } catch {
    // storage penuh/diblokir: abaikan
  }
};

export const clearCache = () => sessionStorage.removeItem(CACHE_KEY);

// Hak akses dari BE: url menu (role-menus) & nama permission (role-permissions)
export const toAccess = (menus, permissions) => ({
  menus: menus.map((m) => m.url),
  permissions: permissions.map((p) => p.nama_permission),
});
