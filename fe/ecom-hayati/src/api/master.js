// src/api/master.js
// Data master: agama, pekerjaan, dan wilayah
import api from './axios';
import { scanByParent } from './parentScan';
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

// Master agama & pekerjaan (BE: /agamas, /pekerjaans; butuh permission agamas.lihat / pekerjaans.lihat). Hasil: [{ id, kode, name, status }]
export const getAgamas = async () => activeOnly(await getMasterOptions('/agamas'));
export const getPekerjaans = async () => activeOnly(await getMasterOptions('/pekerjaans'));

// Wilayah untuk form konsumen (BE: /provinsis, /kabupaten-kotas, /kecamatans, /kelurahans).
// BE hanya mendukung ?search= (tanpa filter induk), jadi: provinsi & kabupaten/kota dimuat penuh lalu disaring di FE;
// kecamatan & kelurahan (ribuan data) dicari lewat nama, lalu disaring menurut induknya di FE.
// Relasi induk di BE lewat kode (kode_provinsi, kode_kabupaten_kota, kode_kecamatan), sedangkan konsumen menyimpan id;
// fungsi di bawah menerima id induk dan menerjemahkannya ke kode.
export const getProvinsis = async () => activeOnly(await getMasterOptions('/provinsis'));
// Kabupaten/kota milik satu provinsi menurut kode provinsi (tanpa argumen: semua)
export const getKabupatensByKode = async (kode_provinsi) =>
  activeOnly(await getMasterOptions('/kabupaten-kotas')).filter((k) => !kode_provinsi || String(k.kode_provinsi) === String(kode_provinsi));
export const getKabupatens = async (id_provinsi) => {
  if (!id_provinsi) return getKabupatensByKode();
  const prov = (await getMasterOptions('/provinsis')).find((p) => String(p.id) === String(id_provinsi));
  return prov ? getKabupatensByKode(prov.kode) : [];
};
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

// Semua baris milik satu induk (kecamatan di satu kabupaten/kota, kelurahan di satu kecamatan) lewat pencarian halaman (lihat parentScan.js).
// Halaman dan hasil disimpan di memori; dibuang setelah ada tambah/ubah/ganti status pada path itu.
const pageCache = new Map();
const parentCache = new Map();
const fetchPage100 = (path) => (n) => {
  const key = `${path}|${n}`;
  if (!pageCache.has(key)) {
    const load = async () => {
      const d = (await api.get(path, { params: { per_page: 100, page: n } })).data.data;
      return { rows: d.data ?? [], lastPage: d.last_page ?? 1 };
    };
    pageCache.set(key, load().catch((err) => { pageCache.delete(key); throw err; }));
  }
  return pageCache.get(key);
};
const listByParent = (path, parentKey, parentId) => {
  const key = `${path}|${parentKey}|${parentId}`;
  if (!parentCache.has(key)) {
    parentCache.set(key, scanByParent(fetchPage100(path), parentKey, parentId)
      .then((rows) => rows.sort((x, y) => x.name.localeCompare(y.name, 'id')))
      .catch((err) => { parentCache.delete(key); throw err; }));
  }
  return parentCache.get(key);
};
// Daftar penuh milik induk lebih dulu (full: true; user tinggal memilih/menyaring). Bila tidak ketemu (urutan data di luar dugaan),
// kembali ke pencarian nama seperti sebelumnya (full: false).
// parentId = id induk (dari form konsumen); kodenya diambil dulu karena BE menghubungkan lewat kode.
const optionsByParent = async (path, parentKey, parentPath, parentId, search, signal) => {
  const parentKode = (await getMasterById(parentPath, parentId).catch(() => null))?.kode;
  if (!parentKode) return { rows: [], truncated: false, full: false };
  const all = activeOnly(await listByParent(path, parentKey, parentKode));
  if (all.length) return { rows: all, truncated: false, full: true };
  if (search.length < 3) return { rows: [], truncated: false, full: false };
  const found = await searchByParent(path, search, parentKey, parentKode, signal);
  return { ...found, rows: activeOnly(found.rows), full: false };
};
export const searchKecamatans = (search, id_kabupaten_kota, signal) => optionsByParent('/kecamatans', 'kode_kabupaten_kota', '/kabupaten-kotas', id_kabupaten_kota, search, signal);
export const searchKelurahans = (search, id_kecamatan, signal) => optionsByParent('/kelurahans', 'kode_kecamatan', '/kecamatans', id_kecamatan, search, signal);

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
const byKodeCache = new Map();
export const getMasterByKode = (path, kode) => {
  if (!kode) return Promise.resolve(null);
  const key = `${path}#${kode}`;
  if (!byKodeCache.has(key)) {
    byKodeCache.set(key, api.get(path, { params: { search: kode, per_page: 100 } })
      .then((r) => (r.data.data.data ?? []).find((d) => String(d.kode) === String(kode)) ?? null)
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
  [[optionCache, '?'], [pageCache, '|'], [parentCache, '|']].forEach(([map, sep]) => {
    for (const k of map.keys()) if (k.startsWith(`${path}${sep}`)) map.delete(k);
  });
};
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
