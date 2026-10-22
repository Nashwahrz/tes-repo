// src/api/konsumens.js
import api from './axios';

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

// Detail satu konsumen (BE: GET /konsumens/{id}); data lebih baru daripada baris di daftar
export const getKonsumen = async (id) => (await api.get(`/konsumens/${id}`)).data.data;

// payload: FormData (ada file foto_ktp, jadi dikirim multipart)
export const createKonsumen = async (payload) =>
  (await api.post('/konsumens', payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;

// Ubah data konsumen (BE: PUT /konsumens/{id}). PHP tidak membaca multipart pada PUT, jadi dikirim POST + _method=PUT.
// foto_ktp opsional saat ubah (tanpa foto, foto lama dipakai)
export const updateKonsumen = async (id, payload) => {
  payload.append('_method', 'PUT');
  return (await api.post(`/konsumens/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
};

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
