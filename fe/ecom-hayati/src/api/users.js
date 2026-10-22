// src/api/users.js
// Pengguna, atasan, dan log login
import api from './axios';
import { fetchAllPages } from './shared';

export const getUsers = (status) => fetchAllPages(status ? `/users/${status}` : '/users');

// status: 'aktif' | 'ditolak' | 'nonaktif'
// id_atasan opsional; BE menimpa id_atasan dengan null bila tidak dikirim
export const updateUserStatus = async (id, id_dealer, status, id_atasan = null) =>
  (await api.put(`/users/${id}`, { id_dealer, id_atasan, status })).data;

// Calon atasan menurut role (Kasir→ADH, ME→Kacab, ADH/Kacab→Super Admin); id_dealer menyaring atasan se-dealer
export const getAtasanOptions = async (id_role, id_dealer) =>
  (await api.get('/users/atasan-options', { params: { id_role, ...(id_dealer ? { id_dealer } : {}) } })).data.data;

// Log login pengguna (BE: GET /log-users, permission log-users.lihat); dipaginasi 10 data per halaman, semua halaman digabung.
// Baris: { id, id_user, user?: { id, name }, ip_address, browser, platform, device, city, region, country, latitude, longitude, logged_in_at }
export const getLoginLogs = () => fetchAllPages('/log-users');
