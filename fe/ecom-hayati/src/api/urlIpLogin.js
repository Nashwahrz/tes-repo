// src/api/urlIpLogin.js
import api from './axios';

// URL layanan geolokasi IP untuk log login (BE: /url-ip-logins, permission url-ip-logins.lihat / .ubah)
// Baris: { id, url, is_active }. URL boleh memuat {ip}; tanpa itu BE menambahkan IP di ujung URL.
export const getUrlIpLogins = async () => {
  const data = (await api.get('/url-ip-logins')).data.data;
  return Array.isArray(data) ? data : data?.data ?? [];
};

export const getUrlIpLogin = async (id) => (await api.get(`/url-ip-logins/${id}`)).data.data;

export const updateUrlIpLogin = async (id, payload) => (await api.put(`/url-ip-logins/${id}`, payload)).data;
