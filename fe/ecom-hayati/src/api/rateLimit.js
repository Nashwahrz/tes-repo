// src/api/rateLimit.js
import api from './axios';
import { fetchAllPages } from './shared';

// Konfigurasi rate limit (BE: /configurasi-rate-limits; permission .lihat / .ubah). Baris: { id, name, request_per_minutes, minutes, is_active }
export const getRateLimits = () => fetchAllPages('/configurasi-rate-limits');
export const updateRateLimit = async (id, payload) => (await api.put(`/configurasi-rate-limits/${id}`, payload)).data;
