// src/api/shared.js
// Helper bersama
import api from './axios';

// BE menyimpan email dalam huruf kecil tanpa spasi; samakan di sisi FE
export const normEmail = (email) => (email ?? '').trim().toLowerCase();

// BE membagi /users dan /dealers per halaman (10 data): { data: { data: [...], current_page, last_page, ... } }.
// Semua halaman digabung jadi satu array agar tabel, filter, dan pencarian di FE tetap bekerja pada seluruh data.
export const fetchAllPages = async (url) => {
  const first = (await api.get(url, { params: { page: 1 } })).data.data;
  if (Array.isArray(first)) return first;
  const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, async (_, i) => (await api.get(url, { params: { page: i + 2 } })).data.data));
  return [first, ...rest].flatMap((p) => p.data);
};

// Detik tunggu dari respons 429 (rate limit) BE; 0 bila bukan 429
export const retryAfterSeconds = (err) => (err.response?.status === 429 ? Number(err.response.data?.retry_after) || 0 : 0);

// Pesan error dari respons BE (validasi 422 / 409 / 403 / dll.)
export const errorMessage = (err) => {
  const data = err.response?.data;
  if (!data) return 'Tidak dapat terhubung ke server.';
  return data.errors ? Object.values(data.errors).flat().join(' ') : data.message || 'Terjadi kesalahan.';
};
