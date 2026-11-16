// src/api/otpLogs.js
// Riwayat OTP (BE: GET /log-otps, permission log-otps.lihat). Hanya baca.
import api from './axios';
import { toPage } from './pagination';

// Filter opsional: search, purpose ('register' | 'reset_password'), action ('REQUESTED' | 'VERIFIED' | 'FAILED')
export const getOtpLogs = async (page = 1, search = '', purpose = '', action = '') => {
  const params = { page, ...(search ? { search } : {}), ...(purpose ? { purpose } : {}), ...(action ? { action } : {}) };
  return toPage((await api.get('/log-otps', { params })).data);
};
