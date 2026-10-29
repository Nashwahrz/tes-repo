// src/api/parentScan.js
// Ambil semua baris milik satu induk (mis. kelurahan di satu kecamatan) dari endpoint yang hanya bisa dipaginasi.
// BE mengurutkan id menurun, dan data wilayah di-seed berurutan per induk, jadi nilai kolom induk menurun mengikuti nomor halaman.
// Maka halaman berisi induk yang dicari ditemukan dengan pencarian biner (~log2(jumlah halaman) request), lalu halaman di sekitarnya
// diambil selama masih ada baris induk itu. Halaman pertama selalu ikut diperiksa karena baris baru (id terbesar) bisa milik induk lama.
// fetchPage(n) -> Promise<{ rows, lastPage }>. Mengembalikan [] bila induk tidak ditemukan.
export async function scanByParent(fetchPage, parentKey, parentId) {
  const target = Number(parentId);
  const isMine = (r) => Number(r[parentKey]) === target;
  const first = await fetchPage(1);
  const found = new Map();
  const take = (rows) => rows.filter(isMine).forEach((r) => found.set(r.id, r));
  take(first.rows);

  let lo = 2;
  let hi = first.lastPage;
  let hit = 0;
  while (lo <= hi && !hit) {
    const mid = Math.floor((lo + hi) / 2);
    const { rows } = await fetchPage(mid);
    if (rows.length === 0) break;
    if (rows.some(isMine)) { hit = mid; take(rows); break; }
    const vals = rows.map((r) => Number(r[parentKey]));
    if (Math.max(...vals) < target) hi = mid - 1; // nilai menurun: induk yang dicari ada di halaman lebih awal
    else if (Math.min(...vals) > target) lo = mid + 1;
    else break; // rentang melewati induk ini tanpa memuatnya: tidak ada baris
  }
  if (hit) {
    for (let p = hit - 1; p >= 2; p -= 1) {
      const { rows } = await fetchPage(p);
      if (!rows.some(isMine)) break;
      take(rows);
    }
    for (let p = hit + 1; p <= first.lastPage; p += 1) {
      const { rows } = await fetchPage(p);
      if (!rows.some(isMine)) break;
      take(rows);
    }
  }
  return [...found.values()];
}
