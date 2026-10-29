// src/api/appKeyOcr.js
import api from './axios';

// Kunci & URL layanan OCR KTP (BE: /app-key-ocrs, permission app-key-ocrs.lihat / .ubah)
// Baris: { id, url, api_key, keterangan, is_active }. Baris dibuat lewat seeder; di FE hanya bisa diubah.
export const getAppKeyOcrs = async () => {
  const data = (await api.get('/app-key-ocrs')).data.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

export const getAppKeyOcr = async (id) => (await api.get(`/app-key-ocrs/${id}`)).data.data;

// BE mewajibkan keempat field: url, api_key, keterangan, is_active
export const updateAppKeyOcr = async (id, payload) => (await api.put(`/app-key-ocrs/${id}`, payload)).data;
