// src/api/konsumens.js
import api from './axios';
import { toMeta, MAX_PER_PAGE } from './pagination';

// Konsumen / dokumen KTP (BE: /konsumens, butuh permission konsumens.*)
// BE menyimpan status verifikasi per relasi penginput (tabel konsumen_mes), bukan di konsumen:
//   GET /konsumens      -> konsumen milik user yang login
//   GET /konsumens/all  -> semua konsumen (permission konsumens.lihat-semua)
//   GET /konsumens/dealer-all -> konsumen yang diinput ME satu dealer dengan user (permission konsumens.lihat-dealer)
// Ketiganya berpaginasi { data: [konsumen + konsumen_mes[]], meta } dan belum bisa difilter status di BE.
// FE meratakan tiap konsumen_mes menjadi satu baris: id = id konsumen, konsumen_me_id = id yang dipakai untuk verifikasi,
// lalu status, note, verified_by, fk_me, dan me diambil dari relasi tersebut.
// status: 'pending' | 'diterima' | 'revisi' | 'ditolak' (kosong = semua)
const PER_PAGE = MAX_PER_PAGE;
export const PAGE_SIZE = 10; // baris per halaman di daftar konsumen

const currentUserId = () => {
  try { return JSON.parse(localStorage.getItem('user'))?.id ?? null; } catch { return null; }
};

const currentDealerId = () => {
  try { return JSON.parse(localStorage.getItem('user'))?.fk_dealer ?? null; } catch { return null; }
};

// mode: 'all' (semua konsumen) | 'dealer' (konsumen dealer user) | 'mine' (milik sendiri). Boolean lama tetap diterima: true = 'all', false = 'mine'.
const normMode = (mode) => (mode === true ? 'all' : mode === false || !mode ? 'mine' : mode);
const ENDPOINT = { all: '/konsumens/all', dealer: '/konsumens/dealer-all', mine: '/konsumens' };

export const flattenKonsumen = (k, modeArg) => {
  const mode = normMode(modeArg);
  // Format BE baru (gabungan temp_konsumens + konsumens): baris sudah datar, satu baris per penginput; BE sudah menyaring per user/dealer.
  // id_temp = id pengajuan di temp_konsumens (dipakai untuk verifikasi); null untuk konsumen yang sudah diterima.
  if (!Array.isArray(k.konsumen_mes)) {
    return [{
      ...k,
      konsumen_me_id: k.id_temp ?? null,
      me: k.me ?? null,
      verified_by: k.verified_by ?? null,
    }];
  }
  const { konsumen_mes: mes = [], ...base } = k;
  const uid = currentUserId();
  const dealer = currentDealerId();
  // BE dealer-all mengembalikan semua penginput sebuah konsumen; yang ditampilkan hanya penginput di dealer user
  const mine = mode === 'all' ? mes
    : mode === 'dealer' ? (dealer == null ? mes : mes.filter((m) => String(m.me?.fk_dealer) === String(dealer)))
      : mes.filter((m) => m.fk_me === uid);
  return mine.map((m) => ({
    ...base,
    konsumen_me_id: m.id,
    fk_me: m.fk_me,
    me: m.me ?? null,
    status: m.status,
    note: m.note,
    verified_by: m.verified_by ?? null,
  }));
};

// perPage: isi satu halaman; memuat semua data memakai PER_PAGE (besar), tampilan daftar memakai PAGE_SIZE
const fetchPage = async (all, page, search, perPage = PER_PAGE) => {
  const mode = normMode(all);
  const body = (await api.get(ENDPOINT[mode], { params: { page, per_page: perPage, ...(search ? { search } : {}) } })).data;
  const m = body.meta ?? {};
  return {
    rows: (body.data ?? []).flatMap((k) => flattenKonsumen(k, mode)),
    meta: toMeta(m, perPage),
  };
};

const byStatus = (rows, status) => (status ? rows.filter((r) => r.status === status) : rows);

// Satu halaman: { rows, meta: { page, lastPage, total, perPage } }. Tanpa filter status memakai paginasi BE;
// dengan filter status semua halaman dimuat (BE belum menyaring status) dan meta = null
export const getKonsumenPage = async (all, status, page = 1) => {
  if (status) return { rows: await getKonsumens(all, status), meta: null };
  return fetchPage(all, page, undefined, PAGE_SIZE);
};

// Semua halaman digabung jadi satu array (lebih berat; dipakai untuk pencarian, filter, dan hitungan)
export const getKonsumens = async (all, status) => {
  const first = await fetchPage(all, 1);
  const rest = await Promise.all(Array.from({ length: Math.max(first.meta.lastPage - 1, 0) }, (_, i) => fetchPage(all, i + 2)));
  return byStatus([first, ...rest].flatMap((p) => p.rows), status);
};

// Total konsumen dari halaman pertama; rows ikut dikembalikan agar bisa dipakai tanpa request tambahan
export const getKonsumenTotal = async (all) => {
  const { rows, meta } = await fetchPage(all, 1);
  return { total: meta.total, rows };
};

// Jumlah konsumen menunggu verifikasi dan yang perlu diinput ulang (ditolak + revisi), dihitung dari seluruh data
export const getKonsumenStatusTotals = async (all) => {
  const rows = await getKonsumens(all);
  return { pending: byStatus(rows, 'pending').length, ditolak: byStatus(rows, 'ditolak').length + byStatus(rows, 'revisi').length };
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

// Verifikasi konsumen oleh atasan (BE: PUT /konsumens/activate/{id}); id = konsumen_me_id (bukan id konsumen)
// status: 'diterima' | 'revisi' | 'ditolak'; note wajib (maks 255 karakter) bila revisi/ditolak
export const verifyKonsumen = async (id, status, note) =>
  (await api.put(`/konsumens/activate/${id}`, { status, ...(status !== 'diterima' ? { note } : {}) })).data;

// Riwayat aktivitas konsumen (BE: GET /konsumens/logs, butuh permission konsumens.logs); BE memaginasi: { data: [...], meta }
export const getKonsumenLogs = async (page = 1, search = '', logName = '') => {
  const body = (await api.get('/konsumens/logs', { params: { page, ...(search ? { search } : {}), ...(logName ? { log_name: logName } : {}) } })).data;
  const m = body.meta ?? {};
  return { rows: body.data ?? [], meta: toMeta(m) };
};

// Cari konsumen menurut NIK/nama (BE: POST /konsumens/check-nik, 12-16 karakter). Hasil: { isRegistered, list }
export const checkNik = async (nik, signal) => {
  const d = (await api.post('/konsumens/check-nik', { nik }, { signal })).data.data ?? {};
  return { isRegistered: !!d.is_registered, list: d.list ?? [] };
};

// OCR KTP: kirim gambar, terima field hasil baca (nik, name, tgl_lahir, dst.)
export const scanKtp = async (file) => {
  const fd = new FormData();
  fd.append('foto_ktp', file);
  return (await api.post('/konsumens/scan-ktp', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 })).data.data;
};

// Foto KTP disimpan di disk privat BE; foto_ktp_url berupa URL bertanda tangan relatif yang berlaku 10 menit
export const ktpUrl = (konsumen) =>
  (konsumen?.foto_ktp_url ? `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${konsumen.foto_ktp_url}` : '');
