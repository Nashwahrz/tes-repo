// src/api/blockedUsers.js
import api from './axios';

// Log akun/IP yang diblokir rate limit (BE: /log-blocked-users). Respons: data = paginator Laravel
// Baris: { id, email, ip_address, type, reason, attempts, blocked_at, blocked_until, status, remaining_seconds, unblocker }
export const getBlockedUsers = async ({ page = 1, search = '', type = '', status = '' } = {}) => {
  const params = { page, ...(search && { search }), ...(type && { type }), ...(status && { status }) };
  const p = (await api.get('/log-blocked-users', { params })).data.data ?? {};
  return { rows: p.data ?? [], meta: { page: p.current_page ?? 1, lastPage: p.last_page ?? 1, total: p.total ?? 0 } };
};

export const unblockUser = async (id) => (await api.post(`/log-blocked-users/${id}/unblock`)).data;
