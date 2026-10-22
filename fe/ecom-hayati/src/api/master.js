// src/api/master.js
// Data master: agama, pekerjaan, dan wilayah
import api from './axios';

// Opsi master untuk dropdown: semua halaman (100 data per halaman) digabung jadi [{ id, name }]. params: filter induk, mis. { id_provinsi }.
// Hasil disimpan di memori per path+params agar dropdown berjenjang tidak memanggil BE berulang.
const optionCache = new Map();
export const getMasterOptions = (path, params = {}) => {
  const key = `${path}?${new URLSearchParams(params)}`;
  if (!optionCache.has(key)) {
    const load = async () => {
      const page = async (n) => (await api.get(path, { params: { ...params, per_page: 100, page: n } })).data.data;
      const first = await page(1);
      const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, (_, i) => page(i + 2)));
      // Baris utuh dipertahankan: kolom induk (id_provinsi, id_kabupaten_kota, id_kecamatan) dipakai untuk menyaring di FE
      return [first, ...rest].flatMap((p) => p.data).sort((a, b) => a.name.localeCompare(b.name, 'id'));
    };
    optionCache.set(key, load().catch((err) => { optionCache.delete(key); throw err; }));
  }
  return optionCache.get(key);
};

// Master agama & pekerjaan (BE: /agamas, /pekerjaans; butuh permission agamas.lihat / pekerjaans.lihat). Hasil: [{ id, name }]
export const getAgamas = () => getMasterOptions('/agamas');
export const getPekerjaans = () => getMasterOptions('/pekerjaans');

// Wilayah untuk form konsumen (BE: /provinsis, /kabupaten-kotas, /kecamatans, /kelurahans).
// BE hanya mendukung ?search= (tanpa filter induk), jadi: provinsi & kabupaten/kota dimuat penuh lalu disaring di FE;
// kecamatan & kelurahan (ribuan data) dicari lewat nama, lalu disaring menurut induknya di FE.
export const getProvinsis = () => getMasterOptions('/provinsis');
export const getKabupatens = async (id_provinsi) =>
  (await getMasterOptions('/kabupaten-kotas')).filter((k) => !id_provinsi || String(k.id_provinsi) === String(id_provinsi));
// Pencarian dibatasi agar server & browser tidak kewalahan: satu kata kunci umum (mis. "ban") bisa cocok ke ribuan baris,
// padahal BE belum menyaring per induk. Halaman diambil bertahap (3 sekaligus), berhenti di batas SEARCH_MAX_PAGES (maks. 500 baris)
// dan bisa dibatalkan lewat signal saat user mengetik lagi. truncated = hasil terpotong; user diminta mengetik lebih spesifik.
const SEARCH_MAX_PAGES = 5;
const SEARCH_BATCH = 3;
const searchCache = new Map();
const searchByParent = async (path, search, parentKey, parentId, signal) => {
  const key = `${path}|${search.toLowerCase()}|${parentId}`;
  if (searchCache.has(key)) return searchCache.get(key);
  const page = async (n) => (await api.get(path, { params: { search, per_page: 100, page: n }, signal })).data.data;
  const first = await page(1);
  const last = Math.min(first.last_page ?? 1, SEARCH_MAX_PAGES);
  let rows = first.data ?? [];
  for (let n = 2; n <= last; n += SEARCH_BATCH) {
    const batch = await Promise.all(Array.from({ length: Math.min(SEARCH_BATCH, last - n + 1) }, (_, i) => page(n + i)));
    rows = rows.concat(batch.flatMap((p) => p.data ?? []));
  }
  const result = {
    rows: rows.filter((r) => String(r[parentKey]) === String(parentId)).sort((x, y) => x.name.localeCompare(y.name, 'id')),
    truncated: (first.last_page ?? 1) > SEARCH_MAX_PAGES,
  };
  searchCache.set(key, result);
  return result;
};
export const searchKecamatans = (search, id_kabupaten_kota, signal) => searchByParent('/kecamatans', search, 'id_kabupaten_kota', id_kabupaten_kota, signal);
export const searchKelurahans = (search, id_kecamatan, signal) => searchByParent('/kelurahans', search, 'id_kecamatan', id_kecamatan, signal);

// Satu data master menurut ID (GET {path}/{id}); dipakai menampilkan nama dari ID tersimpan. Hasil disimpan di memori.
const byIdCache = new Map();
export const getMasterById = (path, id) => {
  if (!id) return Promise.resolve(null);
  const key = `${path}/${id}`;
  if (!byIdCache.has(key)) {
    byIdCache.set(key, api.get(key).then((r) => r.data.data).catch((err) => { byIdCache.delete(key); throw err; }));
  }
  return byIdCache.get(key);
};

// CRUD data master (agama, pekerjaan, dan wilayah: provinsi, kabupaten/kota, kecamatan, kelurahan).
// BE memaginasi 10 data per halaman: { data: { data: [...], current_page, last_page, total } }
export const getMasterPage = async (path, page = 1, search = '') => {
  const p = (await api.get(path, { params: { page, ...(search ? { search } : {}) } })).data.data;
  return { rows: p.data ?? [], meta: { page: p.current_page ?? 1, lastPage: p.last_page ?? 1, total: p.total ?? 0 } };
};
// Cari data master menurut nama (default 20 hasil pertama); dipakai memilih induk di form data master
export const searchMaster = async (path, search, signal, perPage = 20) =>
  (await api.get(path, { params: { search, per_page: perPage }, signal })).data.data.data ?? [];
export const createMaster = async (path, payload) => (await api.post(path, payload)).data;
export const updateMaster = async (path, id, payload) => (await api.put(`${path}/${id}`, payload)).data;
export const deleteMaster = async (path, id) => (await api.delete(`${path}/${id}`)).data;
