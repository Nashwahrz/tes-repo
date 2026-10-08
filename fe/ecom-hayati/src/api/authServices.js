// src/api/authService.js
import api from './axios';

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
  // response.data = { message, data: { id, email }, token }
};

export const registerUser = async (name, email, password, password_confirmation, id_role) => {
  const response = await api.post('/register', { name, email, password, password_confirmation, id_role });
  return response.data;
};

export const getUsers = async (status) => (await api.get(status ? `/users/${status}` : '/users')).data.data;

export const getDealers = async () => (await api.get('/dealers')).data.data;

// status: 'aktif' | 'ditolak' | 'nonaktif'
export const updateUserStatus = async (id, id_dealer, status) => (await api.put(`/users/${id}`, { id_dealer, status })).data;

export const sendOtp = async (email) => (await api.post('/otp/send', { email })).data;

export const verifyOtp = async (email, otp) => (await api.post('/otp/verify', { email, otp })).data;

// Dealer (BE: /dealers, butuh permission dealers.*)
export const createDealer = async (payload) => (await api.post('/dealers', payload)).data;

export const updateDealer = async (id, payload) => (await api.put(`/dealers/${id}`, payload)).data;

export const deleteDealer = async (id) => (await api.delete(`/dealers/${id}`)).data;

// Konsumen / dokumen KTP (BE: /konsumens, butuh permission konsumens.*)
// status: 'pending' | 'diterima' | 'ditolak' (kosong = semua)
export const getKonsumens = async (status) =>
  (await api.get('/konsumens/status', { params: status ? { status } : {} })).data.data;

// payload: FormData (ada file foto_ktp, jadi dikirim multipart)
export const createKonsumen = async (payload) =>
  (await api.post('/konsumens', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;

export const deleteKonsumen = async (id) => (await api.delete(`/konsumens/${id}`)).data;

// OCR KTP: kirim gambar, terima field hasil baca (nik, name, tgl_lahir, dst.)
export const scanKtp = async (file) => {
  const fd = new FormData();
  fd.append('foto_ktp', file);
  return (await api.post('/konsumens/scan-ktp', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })).data.data;
};

// Foto KTP disimpan di disk public BE (butuh `php artisan storage:link`)
export const ktpUrl = (path) => (path ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}/storage/${path}` : '');

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
