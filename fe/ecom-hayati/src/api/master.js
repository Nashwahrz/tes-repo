// src/api/master.js
// Data master: agama, pekerjaan, dan wilayah
import api from './axios';
import { toMeta, MAX_PER_PAGE } from './pagination';

// BE memakai nama kolom per tabel (agama_code, provinsi_name, fk_provinsi, dst.). Di FE data master tetap dipakai dengan bentuk seragam:
// { kode, name, kode_provinsi | kode_kabupaten_kota | kode_kecamatan }. Penerjemahan dilakukan di sini, saat membaca dan saat mengirim.
const SHAPES = {
  '/agamas': { code: 'agama_code', name: 'agama_name' },
  '/pekerjaans': { code: 'pekerjaan_code', name: 'pekerjaan_name' },
  '/provinsis': { code: 'provinsi_code', name: 'provinsi_name' },
  '/kabupaten-kotas': { code: 'kabupaten_kota_code', name: 'kabupaten_kota_name', parents: { kode_provinsi: 'fk_provinsi' } },
  '/kecamatans': { code: 'kecamatan_code', name: 'kecamatan_name', parents: { kode_kabupaten_kota: 'fk_kabupaten_kota' } },
  '/kelurahans': { code: 'kelurahan_code', name: 'kelurahan_name', parents: { kode_kecamatan: 'fk_kecamatan' } },
};
const shapeOf = (path) => SHAPES[path.replace(/\/(aktif|all|\d+)(\/status)?$/, '')];
const fromBe = (path, row) => {
  const s = shapeOf(path);
  if (!s || !row) return row;
  const out = { ...row, kode: row[s.code], name: row[s.name] };
  Object.entries(s.parents ?? {}).forEach(([legacy, be]) => { out[legacy] = row[be]; });
  return out;
};
const toBe = (path, payload) => {
  const s = shapeOf(path);
  if (!s) return payload;
  const out = {};
  Object.entries(payload).forEach(([k, v]) => {
    if (k === 'kode') out[s.code] = v;
    else if (k === 'name') out[s.name] = v;
    else out[s.parents?.[k] ?? k] = v;
  });
  return out;
};

// Opsi master untuk dropdown: semua halaman (100 data per halaman) digabung jadi [{ id, name }]. params: filter query BE.
// Hasil disimpan di memori per path+params agar dropdown berjenjang tidak memanggil BE berulang.
const optionCache = new Map();
export const getMasterOptions = (path, params = {}) => {
  const key = `${path}?${new URLSearchParams(params)}`;
  if (!optionCache.has(key)) {
    const load = async () => {
      const page = async (n) => (await api.get(path, { params: { ...params, per_page: MAX_PER_PAGE, page: n } })).data.data;
      const first = await page(1);
      const rest = await Promise.all(Array.from({ length: Math.max((first.last_page ?? 1) - 1, 0) }, (_, i) => page(i + 2)));
      // Baris utuh dipertahankan: kolom induk (kode_provinsi, kode_kabupaten_kota, kode_kecamatan) dipakai untuk menyaring di FE
      return [first, ...rest].flatMap((p) => p.data).map((r) => fromBe(path, r)).sort((a, b) => a.name.localeCompare(b.name, 'id'));
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
// Tree hierarki pekerjaan (BE: GET /pekerjaans, permission pekerjaans.lihat).
// Hasil: [{ pekerjaan_code, pekerjaan_name, sequence, type_header, sector_job, is_selectable, children: [...] }]
let pekerjaanTreeCache = null;
export const getPekerjaanTree = async () => {
  if (!pekerjaanTreeCache) {
    pekerjaanTreeCache = api.get('/pekerjaans')
      .then((res) => res.data?.data ?? [])
      .catch((err) => { pekerjaanTreeCache = null; throw err; });
  }
  return pekerjaanTreeCache;
};

// Opsi pekerjaan untuk dropdown (diratakan dari hierarki pekerjaan aktif)
export const getPekerjaans = async () => {
  const tree = await getPekerjaanTree();
  const list = [];
  (Array.isArray(tree) ? tree : []).forEach((h) => {
    if (h.is_selectable) {
      list.push({
        id: h.id,
        kode: h.pekerjaan_code,
        name: h.pekerjaan_name,
        sequence: h.sequence,
        type_header: h.type_header?.value ?? h.type_header,
        sector_job: h.sector_job,
        is_header: true,
        status: true,
      });
    }
    (h.children ?? []).forEach((c) => {
      list.push({
        id: c.id,
        kode: c.pekerjaan_code,
        name: c.pekerjaan_name,
        sequence: c.sequence,
        type_header: c.type_header?.value ?? c.type_header,
        sector_job: c.sector_job,
        parent_code: h.pekerjaan_code,
        parent_name: h.pekerjaan_name,
        is_header: false,
        status: true,
      });
    });
  });
  return list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
};

// Daftar khusus header pekerjaan (untuk pilihan induk pekerjaan tipe Detail)
export const getPekerjaanHeaders = async () => {
  const tree = await getPekerjaanTree();
  return (Array.isArray(tree) ? tree : [])
    .filter((h) => (h.type_header?.value ?? h.type_header) === 'H' || !h.type_header)
    .map((h) => ({
      id: h.id,
      kode: h.pekerjaan_code,
      name: h.pekerjaan_name,
      sequence: h.sequence,
      sector_job: h.sector_job,
      type_header: h.type_header?.value ?? h.type_header ?? 'H',
    }))
    .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.name.localeCompare(b.name, 'id'));
};

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
  const page = async (n) => (await api.get(path, { params: { search, per_page: MAX_PER_PAGE, page: n }, signal })).data.data;
  const first = await page(1);
  const last = Math.min(first.last_page ?? 1, SEARCH_MAX_PAGES);
  let rows = (first.data ?? []).map((r) => fromBe(path, r));
  for (let n = 2; n <= last; n += SEARCH_BATCH) {
    const batch = await Promise.all(Array.from({ length: Math.min(SEARCH_BATCH, last - n + 1) }, (_, i) => page(n + i)));
    rows = rows.concat(batch.flatMap((p) => (p.data ?? []).map((r) => fromBe(path, r))));
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
      const page = async (n) => (await api.get(path, { params: { search: parentKode, per_page: MAX_PER_PAGE, page: n } })).data.data;
      const first = await page(1);
      const last = Math.min(first.last_page ?? 1, PARENT_MAX_PAGES);
      const rest = await Promise.all(Array.from({ length: Math.max(last - 1, 0) }, (_, i) => page(i + 2)));
      return [first, ...rest].flatMap((p) => p.data ?? []).map((r) => fromBe(path, r))
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
    byIdCache.set(key, api.get(key).then((r) => fromBe(path, r.data.data)).catch((err) => { byIdCache.delete(key); throw err; }));
  }
  return byIdCache.get(key);
};

// Satu data master menurut kode (BE belum punya endpoint per kode): dicari lewat ?search= lalu dicocokkan persis. Hasil disimpan di memori.
// Endpoint /aktif dicoba lebih dulu (izin lihat-aktif); data yang sudah dinonaktifkan hanya ada di endpoint penuh (izin lihat, bila role punya).
const byKodeCache = new Map();
const findKode = async (path, kode) => {
  const targetPath = path === '/pekerjaans' || path === '/pekerjaans/all' ? '/pekerjaans/all' : path;
  const res = (await api.get(targetPath, { params: { search: kode, per_page: MAX_PER_PAGE } })).data;
  const list = res.data?.data ?? res.data ?? [];
  return (Array.isArray(list) ? list : []).map((r) => fromBe(path, r)).find((d) => String(d.kode) === String(kode)) ?? null;
};
export const getMasterByKode = (path, kode) => {
  if (!kode) return Promise.resolve(null);
  const base = path.replace(/\/(aktif|all)$/, '');
  const key = `${base}#${kode}`;
  if (!byKodeCache.has(key)) {
    if (base === '/pekerjaans') {
      byKodeCache.set(key, findKode('/pekerjaans/all', kode).catch((err) => { byKodeCache.delete(key); throw err; }));
    } else {
      byKodeCache.set(key, findKode(`${base}/aktif`, kode).catch(() => null)
        .then((hit) => hit ?? findKode(base, kode))
        .catch((err) => { byKodeCache.delete(key); throw err; }));
    }
  }
  return byKodeCache.get(key);
};

// CRUD data master (agama, pekerjaan, dan wilayah: provinsi, kabupaten/kota, kecamatan, kelurahan).
// Tambah: { kode, name, kode_<induk> }; ubah: { name, kode_<induk> } (kode tidak bisa diubah). Tidak ada hapus: data dinonaktifkan lewat status.
// BE memaginasi 10 data per halaman: { data: { data: [...], current_page, last_page, total } }
export const getMasterPage = async (path, page = 1, search = '') => {
  const targetPath = path === '/pekerjaans' ? '/pekerjaans/all' : path;
  const p = (await api.get(targetPath, { params: { page, ...(search ? { search } : {}) } })).data.data;
  return { rows: (p.data ?? []).map((r) => fromBe(path, r)), meta: toMeta(p) };
};
// Cari data master menurut nama (default 20 hasil pertama); dipakai memilih induk di form data master
export const searchMaster = async (path, search, signal, perPage = 20) =>
  (await api.get(path, { params: { search, per_page: perPage }, signal })).data.data.data?.map((r) => fromBe(path, r)) ?? [];
// Data yang dimuat penuh untuk dropdown/filter harus dibuang setelah ada perubahan, supaya tidak basi
const dropOptionCache = (path) => {
  if (path.startsWith('/pekerjaans')) pekerjaanTreeCache = null;
  [[optionCache, '?'], [parentCache, '|']].forEach(([map, sep]) => {
    for (const k of map.keys()) if (k.startsWith(`${path}${sep}`) || k.startsWith(`${path}/aktif${sep}`)) map.delete(k);
  });
};
// Dipakai saat data master mungkin berubah di tempat lain (mis. tab lain): daftar induk/pencarian dimuat ulang pada pemakaian berikutnya
export const refreshMasterOptions = (path) => { dropOptionCache(path); searchCache.clear(); };
export const createMaster = async (path, payload) => {
  const res = (await api.post(path, toBe(path, payload))).data;
  dropOptionCache(path);
  byKodeCache.clear();
  return res;
};
export const updateMaster = async (path, id, payload) => {
  const res = (await api.put(`${path}/${id}`, toBe(path, payload))).data;
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


// Impor massal lewat Excel: file diunggah apa adanya ke POST {path}/import (BE: permission <menu>.tambah, .xlsx/.xls maks. 2MB).
// Header Excel harus persis seperti yang diminta BE (lihat masterExcel.js). Baris yang ditolak tidak membatalkan baris lain.
// Hasil: { ok, failed, errors: ['Baris 3: ...'] }. Bila format file salah (tidak ada baris berhasil), BE membalas 422 dan fungsi ini melempar error.
export const importMaster = async (path, file) => {
  const body = new FormData();
  body.append('file', file);
  const d = (await api.post(`${path}/import`, body, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data ?? {};
  dropOptionCache(path);
  byKodeCache.clear();
  return { ok: d.success_count ?? 0, failed: d.failed_count ?? 0, errors: d.errors ?? [] };
};

// Export Excel (BE: GET {path}/export, permission <menu>.lihat). Ikut ?search= bila ada; respons berupa file .xlsx yang langsung diunduh.
export const exportMaster = async (path, { search = '', fallbackName = 'data_master' } = {}) => {
  const res = await api.get(`${path}/export`, { params: search ? { search } : {}, responseType: 'blob' });
  const name = /filename="?([^";]+)"?/i.exec(res.headers?.['content-disposition'] ?? '')?.[1] ?? `${fallbackName}.xlsx`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Ditunda: mencabut URL langsung setelah click bisa membatalkan unduhan di Firefox/Safari
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
