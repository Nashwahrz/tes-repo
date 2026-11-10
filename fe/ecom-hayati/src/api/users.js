// src/api/users.js
// Pengguna, atasan, dan log login
import api from './axios';
import { fetchAllPages } from './shared';

// BE mengirim dealer/role di daftar user sebagai model apa adanya (dealer_name, address, role_name), sedangkan respons
// ubah-status memakai { name }. Di FE keduanya diseragamkan: dealer.name, dealer.alamat, role.name.
const normUser = (u) => ({
  ...u,
  dealer: u.dealer ? { ...u.dealer, name: u.dealer.dealer_name ?? u.dealer.name, alamat: u.dealer.address ?? u.dealer.alamat } : u.dealer,
  role: u.role ? { ...u.role, name: u.role.role_name ?? u.role.name } : u.role,
});

export const getUsers = async (status) => (await fetchAllPages(status ? `/users/${status}` : '/users')).map(normUser);

// status: 'aktif' | 'ditolak' | 'nonaktif'
// fk_atasan opsional; BE menimpa fk_atasan dengan null bila tidak dikirim
export const updateUserStatus = async (id, fk_dealer, status, fk_atasan = null) =>
  (await api.put(`/users/${id}`, { fk_dealer, fk_atasan, status })).data;

// Calon atasan menurut role (Kasir→ADH, ME→Kacab, ADH/Kacab→Super Admin); fk_dealer menyaring atasan se-dealer
export const getAtasanOptions = async (fk_role, fk_dealer) =>
  ((await api.get('/users/atasan-options', { params: { fk_role, ...(fk_dealer ? { fk_dealer } : {}) } })).data.data ?? []).map(normUser);

// Log login pengguna (BE: GET /log-users, permission log-users.lihat); dipaginasi 10 data per halaman, semua halaman digabung.
// Baris: { id, fk_user, user?: { id, name }, ip_address, browser, platform, device, city, region, country, latitude, longitude, logged_in_at }
export const getLoginLogs = () => fetchAllPages('/log-users');
