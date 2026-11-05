// src/api/master.js
// Data master: agama, pekerjaan, dan wilayah
import api from './axios';
import { errorMessage } from './shared';

// Opsi master untuk dropdown: semua halaman (100 data per halaman) digabung jadi [{ id, name }]. params: filter query BE.
// Hasil disimpan di memori per path+params agar dropdown berjenjang tidak memanggil BE berulang.
const optionCache = new Map();
export const getMasterOptions = (path, params = {}) => {
  const key = `${path}?${new URLSearchParams(params)}`;
  if (!optionCache.has(key)) {
    const load = async () => {
      const page = async (n) => (await api.get(path, { params: { ...params, per_page: 100, page: n } })).data.data;
      const first = await page(1);
      const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, (_, i) => page(i + 2)));
      // Baris utuh dipertahankan: kolom induk (kode_provinsi, kode_kabupaten_kota, kode_kecamatan) dipakai untuk menyaring di FE
      return [first, ...rest].flatMap((p) => p.data).sort((a, b) => a.name.localeCompare(b.name, 'id'));
    };
    optionCache.set(key, load().catch((err) => { optionCache.delete(key); throw err; }));
  }
  return optionCache.get(key);
};

// Pilihan di form hanya memuat data berstatus aktif (BE tidak lagi menghapus data master, hanya menonaktifkannya)
const activeOnly = (rows) => rows.filter((r) => r.status !== false);

// Pilihan di form konsumen memakai endpoint /aktif (BE: permission <menu>.lihat-aktif, yang dimiliki semua role penambah konsumen;
// permission <menu>.lihat hanya untuk admin master). Hasil: [{ id, kode, name, status }]
export const getAgamas = async () => activeOnly(await getMasterOptions('/agamas/aktif'));
export const getPekerjaans = async () => activeOnly(await getMasterOptions('/pekerjaans/aktif'));

// Wilayah untuk form konsumen (BE: /provinsis, /kabupaten-kotas, /kecamatans, /kelurahans).
// BE hanya mendukung ?search= (tanpa filter induk), jadi: provinsi & kabupaten/kota dimuat penuh lalu disaring di FE;
// kecamatan & kelurahan (ribuan data) dicari lewat nama, lalu disaring menurut induknya di FE.
// Relasi induk di BE lewat kode (kode_provinsi, kode_kabupaten_kota, kode_kecamatan), sedangkan konsumen menyimpan id;
// fungsi di bawah menerima id induk dan menerjemahkannya ke kode.
export const getProvinsis = async () => activeOnly(await getMasterOptions('/provinsis/aktif'));
// Kabupaten/kota milik satu provinsi menurut kode provinsi (tanpa argumen: semua)
export const getKabupatensByKode = async (kode_provinsi) =>
  activeOnly(await getMasterOptions('/kabupaten-kotas/aktif')).filter((k) => !kode_provinsi || String(k.kode_provinsi) === String(kode_provinsi));
// Tanpa argumen: semua kabupaten/kota. Form konsumen menyimpan kode, jadi induk langsung berupa kode provinsi.
export const getKabupatens = async (kode_provinsi) => getKabupatensByKode(kode_provinsi);
// Pencarian dibatasi agar server & browser tidak kewalahan: satu kata kunci umum (mis. "ban") bisa cocok ke ribuan baris,
// padahal BE belum menyaring per induk. Halaman diambil bertahap (3 sekaligus), berhenti di batas SEARCH_MAX_PAGES (maks. 500 baris)
// dan bisa dibatalkan lewat signal saat user mengetik lagi. truncated = hasil terpotong; user diminta mengetik lebih spesifik.
const SEARCH_MAX_PAGES = 5;
const SEARCH_BATCH = 3;
const searchCache = new Map();
const searchByParent = async (path, search, parentKey, parentId, signal) => { // parentId: kode induk
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

// Semua baris milik satu induk (kecamatan di satu kabupaten/kota, kelurahan di satu kecamatan), diambil dari KODE induknya.
// Kode wilayah berjenjang (kode kecamatan diawali kode kabupaten/kota, kode kelurahan diawali kode kecamatan) dan ?search= di BE
// mencocokkan nama ATAU kode, jadi mencari kode induk langsung mengembalikan anak-anaknya; hasilnya disaring persis menurut kolom induk.
// Hasil disimpan di memori; dibuang setelah ada tambah/ubah/ganti status pada path itu.
const PARENT_MAX_PAGES = 10;
const parentCache = new Map();
const listByParent = (path, parentKey, parentKode) => {
  const key = `${path}|${parentKey}|${parentKode}`;
  if (!parentCache.has(key)) {
    const load = async () => {
      const page = async (n) => (await api.get(path, { params: { search: parentKode, per_page: 100, page: n } })).data.data;
      const first = await page(1);
      const last = Math.min(first.last_page ?? 1, PARENT_MAX_PAGES);
      const rest = await Promise.all(Array.from({ length: Math.max(last - 1, 0) }, (_, i) => page(i + 2)));
      return [first, ...rest].flatMap((p) => p.data ?? [])
        .filter((r) => String(r[parentKey]) === String(parentKode))
        .sort((x, y) => x.name.localeCompare(y.name, 'id'));
    };
    parentCache.set(key, load().catch((err) => { parentCache.delete(key); throw err; }));
  }
  return parentCache.get(key);
};
// Untuk layar kelola data master (semua status): semua anak dari satu induk, mis. kelurahan milik satu kecamatan
export const getChildrenByParent = (path, parentKey, parentKode) => listByParent(path, parentKey, parentKode);
// Daftar penuh milik induk (dari kode induk) lebih dulu (full: true; user tinggal memilih/menyaring). Bila kosong,
// kembali ke pencarian nama (full: false).
// parentKode = kode induk (dari form konsumen); BE menghubungkan wilayah lewat kode.
const optionsByParent = async (path, parentKey, parentKode, search, signal) => {
  if (!parentKode) return { rows: [], truncated: false, full: false };
  const all = activeOnly(await listByParent(path, parentKey, parentKode));
  if (all.length) return { rows: all, truncated: false, full: true };
  if (search.length < 3) return { rows: [], truncated: false, full: false };
  const found = await searchByParent(path, search, parentKey, parentKode, signal);
  return { ...found, rows: activeOnly(found.rows), full: false };
};
export const searchKecamatans = (search, kode_kabupaten_kota, signal) => optionsByParent('/kecamatans/aktif', 'kode_kabupaten_kota', kode_kabupaten_kota, search, signal);
export const searchKelurahans = (search, kode_kecamatan, signal) => optionsByParent('/kelurahans/aktif', 'kode_kecamatan', kode_kecamatan, search, signal);

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

// Satu data master menurut kode (BE belum punya endpoint per kode): dicari lewat ?search= lalu dicocokkan persis. Hasil disimpan di memori.
// Endpoint /aktif dicoba lebih dulu (izin lihat-aktif); data yang sudah dinonaktifkan hanya ada di endpoint penuh (izin lihat, bila role punya).
const byKodeCache = new Map();
const findKode = async (path, kode) =>
  (await api.get(path, { params: { search: kode, per_page: 100 } })).data.data.data?.find((d) => String(d.kode) === String(kode)) ?? null;
export const getMasterByKode = (path, kode) => {
  if (!kode) return Promise.resolve(null);
  const base = path.replace(/\/aktif$/, '');
  const key = `${base}#${kode}`;
  if (!byKodeCache.has(key)) {
    byKodeCache.set(key, findKode(`${base}/aktif`, kode).catch(() => null)
      .then((hit) => hit ?? findKode(base, kode))
      .catch((err) => { byKodeCache.delete(key); throw err; }));
  }
  return byKodeCache.get(key);
};

// CRUD data master (agama, pekerjaan, dan wilayah: provinsi, kabupaten/kota, kecamatan, kelurahan).
// Tambah: { kode, name, kode_<induk> }; ubah: { name, kode_<induk> } (kode tidak bisa diubah). Tidak ada hapus: data dinonaktifkan lewat status.
// BE memaginasi 10 data per halaman: { data: { data: [...], current_page, last_page, total } }
export const getMasterPage = async (path, page = 1, search = '') => {
  const p = (await api.get(path, { params: { page, ...(search ? { search } : {}) } })).data.data;
  return { rows: p.data ?? [], meta: { page: p.current_page ?? 1, lastPage: p.last_page ?? 1, total: p.total ?? 0 } };
};
// Cari data master menurut nama (default 20 hasil pertama); dipakai memilih induk di form data master
export const searchMaster = async (path, search, signal, perPage = 20) =>
  (await api.get(path, { params: { search, per_page: perPage }, signal })).data.data.data ?? [];
// Data yang dimuat penuh untuk dropdown/filter harus dibuang setelah ada perubahan, supaya tidak basi
const dropOptionCache = (path) => {
  [[optionCache, '?'], [parentCache, '|']].forEach(([map, sep]) => {
    for (const k of map.keys()) if (k.startsWith(`${path}${sep}`) || k.startsWith(`${path}/aktif${sep}`)) map.delete(k);
  });
};
// Dipakai saat data master mungkin berubah di tempat lain (mis. tab lain): daftar induk/pencarian dimuat ulang pada pemakaian berikutnya
export const refreshMasterOptions = (path) => { dropOptionCache(path); searchCache.clear(); };
export const createMaster = async (path, payload) => {
  const res = (await api.post(path, payload)).data;
  dropOptionCache(path);
  byKodeCache.clear();
  return res;
};
export const updateMaster = async (path, id, payload) => {
  const res = (await api.put(`${path}/${id}`, payload)).data;
  dropOptionCache(path);
  byIdCache.delete(`${path}/${id}`);
  byKodeCache.clear();
  return res;
};
// Aktif/nonaktifkan data master (BE: PUT {path}/{id}/status, permission *.ubah)
export const setMasterStatus = async (path, id, status) => {
  const res = (await api.put(`${path}/${id}/status`, { status })).data;
  dropOptionCache(path);
  byIdCache.delete(`${path}/${id}`);
  byKodeCache.clear();
  return res;
};

// Impor massal: tiap baris dikirim lewat POST biasa (BE belum punya endpoint impor), beberapa sekaligus.
// Baris yang ditolak BE (kode sudah ada, induk tidak ada, dll.) dicatat di failures dan tidak menghentikan baris lain.
// rows: [{ line, kode, name, [kode_induk] }]. onProgress(selesai, berhasil); isCancelled() dicek sebelum tiap baris.
export const importMaster = async (path, rows, { concurrency = 4, onProgress, isCancelled } = {}) => {
  const failures = [];
  let ok = 0;
  let done = 0;
  let next = 0;
  const worker = async () => {
    while (!isCancelled?.() && next < rows.length) {
      const { line, ...payload } = rows[next];
      next += 1;
      try {
        await api.post(path, payload);
        ok += 1;
      } catch (err) {
        failures.push({ line, kode: payload.kode, message: errorMessage(err) });
      }
      done += 1;
      onProgress?.(done, ok);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));
  dropOptionCache(path);
  byKodeCache.clear();
  return { ok, failures: failures.sort((a, b) => a.line - b.line), cancelled: !!isCancelled?.() };
};
