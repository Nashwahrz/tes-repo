// src/api/authService.js
import api from './axios';

// BE menyimpan email dalam huruf kecil tanpa spasi; samakan di sisi FE
const normEmail = (email) => (email ?? '').trim().toLowerCase();

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email: normEmail(email), password });
  return response.data;
  // response.data = { message, data: { id, email }, token }
};

export const registerUser = async (name, email, password, password_confirmation, id_role) => {
  const response = await api.post('/register', { name, email: normEmail(email), password, password_confirmation, id_role });
  return response.data;
};

// BE membagi /users dan /dealers per halaman (10 data): { data: { data: [...], current_page, last_page, ... } }.
// Semua halaman digabung jadi satu array agar tabel, filter, dan pencarian di FE tetap bekerja pada seluruh data.
const fetchAllPages = async (url) => {
  const first = (await api.get(url, { params: { page: 1 } })).data.data;
  if (Array.isArray(first)) return first;
  const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, async (_, i) => (await api.get(url, { params: { page: i + 2 } })).data.data));
  return [first, ...rest].flatMap((p) => p.data);
};

export const getUsers = (status) => fetchAllPages(status ? `/users/${status}` : '/users');

export const getDealers = () => fetchAllPages('/dealers');

// status: 'aktif' | 'ditolak' | 'nonaktif'
// id_atasan opsional; BE menimpa id_atasan dengan null bila tidak dikirim
export const updateUserStatus = async (id, id_dealer, status, id_atasan = null) =>
  (await api.put(`/users/${id}`, { id_dealer, id_atasan, status })).data;

// Calon atasan menurut role (Kasir→ADH, ME→Kacab, ADH/Kacab→Super Admin); id_dealer menyaring atasan se-dealer
export const getAtasanOptions = async (id_role, id_dealer) =>
  (await api.get('/users/atasan-options', { params: { id_role, ...(id_dealer ? { id_dealer } : {}) } })).data.data;

export const sendOtp = async (email) => (await api.post('/otp/send', { email: normEmail(email) })).data;

export const verifyOtp = async (email, otp) => (await api.post('/otp/verify', { email: normEmail(email), otp })).data;

// Reset password (BE: 3 langkah). OTP reset hanya untuk email yang sudah terverifikasi; OTP berlaku 5 menit.
export const sendResetPasswordOtp = async (email) => (await api.post('/otp/send-reset-password', { email: normEmail(email) })).data;

// Respons: { reset_token } (berlaku 15 menit, dipakai di langkah terakhir)
export const verifyResetPasswordOtp = async (email, otp) => (await api.post('/otp/verify-reset-password', { email: normEmail(email), otp })).data;

export const resetPassword = async (email, reset_token, password, password_confirmation) =>
  (await api.post('/reset-password', { email: normEmail(email), reset_token, password, password_confirmation })).data;

// Dealer (BE: /dealers, butuh permission dealers.*)
export const createDealer = async (payload) => (await api.post('/dealers', payload)).data;

export const updateDealer = async (id, payload) => (await api.put(`/dealers/${id}`, payload)).data;

export const deleteDealer = async (id) => (await api.delete(`/dealers/${id}`)).data;

// Konsumen / dokumen KTP (BE: /konsumens, butuh permission konsumens.*)
// status: 'pending' | 'diterima' | 'ditolak' (kosong = semua)
// BE membagi hasil per halaman (10 data): { data: { data: [...], current_page, last_page, per_page, total, ... } }
const fetchKonsumenPage = async (status, page) =>
  (await api.get('/konsumens/status', { params: { ...(status ? { status } : {}), page } })).data.data;

// Satu halaman saja: { rows, meta: { page, lastPage, total, perPage } }
export const getKonsumenPage = async (status, page = 1) => {
  const p = await fetchKonsumenPage(status, page);
  if (Array.isArray(p)) return { rows: p, meta: { page: 1, lastPage: 1, total: p.length, perPage: p.length } };
  return { rows: p.data, meta: { page: p.current_page, lastPage: p.last_page, total: p.total, perPage: p.per_page } };
};

// Semua halaman digabung jadi satu array (lebih berat; dipakai hanya untuk pencarian dan hitungan khusus)
export const getKonsumens = async (status) => {
  const first = await fetchKonsumenPage(status, 1);
  if (Array.isArray(first)) return first;
  const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, (_, i) => fetchKonsumenPage(status, i + 2)));
  return [first, ...rest].flatMap((p) => p.data);
};

// Total konsumen dari satu request (halaman pertama); rows ikut dikembalikan agar bisa dipakai tanpa request tambahan
export const getKonsumenTotal = async () => {
  const { rows, meta } = await getKonsumenPage(undefined, 1);
  return { total: meta.total, rows };
};

// Jumlah konsumen menunggu verifikasi dan ditolak (total dari halaman pertama tiap status)
export const getKonsumenStatusTotals = async () => {
  const [pending, ditolak] = await Promise.all(
    ['pending', 'ditolak'].map(async (st) => (await getKonsumenPage(st, 1)).meta.total),
  );
  return { pending, ditolak };
};

// payload: FormData (ada file foto_ktp, jadi dikirim multipart)
export const createKonsumen = async (payload) =>
  (await api.post('/konsumens', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;

// Ubah data konsumen (BE: PUT /konsumens/{id}). PHP tidak membaca multipart pada PUT, jadi dikirim POST + _method=PUT.
// foto_ktp opsional saat ubah (tanpa foto, foto lama dipakai)
export const updateKonsumen = async (id, payload) => {
  payload.append('_method', 'PUT');
  return (await api.post(`/konsumens/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

// Whitelist domain email untuk registrasi (BE: /email-whitelists, permission email-whitelists.*)
// payload: { domain: '@gmail.com', is_active: true, created_by: <id user> }; domain wajib berawalan @ dan unik
export const getEmailWhitelists = async () => (await api.get('/email-whitelists')).data.data;

export const createEmailWhitelist = async (payload) => (await api.post('/email-whitelists', payload)).data;

export const updateEmailWhitelist = async (id, payload) => (await api.put(`/email-whitelists/${id}`, payload)).data;

export const deleteEmailWhitelist = async (id) => (await api.delete(`/email-whitelists/${id}`)).data;

// Verifikasi konsumen oleh atasan (BE: PUT /konsumens/activate/{id}).
// status: 'diterima' | 'ditolak'; catatan_penolakan wajib (maks 255 karakter) bila ditolak
export const verifyKonsumen = async (id, status, catatan_penolakan) =>
  (await api.put(`/konsumens/activate/${id}`, { status, ...(status === 'ditolak' ? { catatan_penolakan } : {}) })).data;

// Riwayat aktivitas konsumen (BE: GET /konsumens/logs, butuh permission konsumens.logs); BE memaginasi: { data: [...], meta }
export const getKonsumenLogs = async (page = 1, search = '') => {
  const body = (await api.get('/konsumens/logs', { params: { page, ...(search ? { search } : {}) } })).data;
  const m = body.meta ?? {};
  return { rows: body.data ?? [], meta: { page: m.current_page ?? 1, lastPage: m.last_page ?? 1, total: m.total ?? 0, perPage: m.per_page ?? 10 } };
};

export const deleteKonsumen = async (id) => (await api.delete(`/konsumens/${id}`)).data;

// OCR KTP: kirim gambar, terima field hasil baca (nik, name, tgl_lahir, dst.)
export const scanKtp = async (file) => {
  const fd = new FormData();
  fd.append('foto_ktp', file);
  return (await api.post('/konsumens/scan-ktp', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })).data.data;
};

// Foto KTP disimpan di disk privat BE; foto_ktp_url berupa URL bertanda tangan relatif yang berlaku 10 menit
export const ktpUrl = (konsumen) =>
  (konsumen?.foto_ktp_url ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${konsumen.foto_ktp_url}` : '');

// Log login pengguna (BE: GET /log-users, permission log-users.lihat); dipaginasi 10 data per halaman, semua halaman digabung.
// Baris: { id, id_user, user?: { id, name }, ip_address, browser, platform, device, city, region, country, latitude, longitude, logged_in_at }
export const getLoginLogs = () => fetchAllPages('/log-users');

// Menu & permission milik user yang sedang login
export const getUserMenus = async () => (await api.get('/role-menus/user-menus')).data.data;

export const getUserPermissions = async () => (await api.get('/role-permissions/user-permissions')).data.data;

// Kelola hak akses role (butuh role-menus.kelola / role-permissions.kelola)
// data: { roles: [{ id, name, menus: [] }], menus: [] }
export const getRoleMenus = async () => (await api.get('/role-menus')).data.data;

export const updateRoleMenus = async (roleId, menu_ids) => (await api.put(`/role-menus/${roleId}`, { menu_ids })).data;

// data: { roles: [{ id, name, permissions: [] }], permissions: [] }
export const getRolePermissions = async () => (await api.get('/role-permissions')).data.data;

export const updateRolePermissions = async (roleId, permission_ids) => (await api.put(`/role-permissions/${roleId}`, { permission_ids })).data;

// Pesan error dari respons BE (validasi 422 / 409 / 403 / dll.)
export const errorMessage = (err) => {
  const data = err.response?.data;
  if (!data) return 'Tidak dapat terhubung ke server.';
  return data.errors ? Object.values(data.errors).flat().join(' ') : data.message || 'Terjadi kesalahan.';
};
