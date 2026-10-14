// src/pages/dashboard/salesPrototype.js
// PROTOTIPE: BE belum punya tabel/endpoint penjualan, jadi tampilan memakai data contoh di bawah ini.
// Saat API tersedia: ubah SALES_PROTOTYPE menjadi false, hapus SALES_ROWS, dan isi baris dari response API
// (BE sebaiknya sudah membatasi baris ke dealer milik user non-Super Admin, seperti data konsumen).
// Bentuk baris: { id, no_transaksi, tanggal: 'YYYY-MM-DD', konsumen, motor, id_dealer, dealer, unit, harga, status: 'lunas' | 'menunggu' | 'batal' }
export const SALES_PROTOTYPE = true;

export const SALES_ROWS = [
  { id: 1, no_transaksi: 'TRX-0001', tanggal: '2026-10-02', konsumen: 'Contoh Konsumen A', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18500000, status: 'lunas' },
  { id: 2, no_transaksi: 'TRX-0002', tanggal: '2026-10-04', konsumen: 'Contoh Konsumen B', motor: 'Honda Vario 125', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 24200000, status: 'lunas' },
  { id: 3, no_transaksi: 'TRX-0003', tanggal: '2026-10-07', konsumen: 'Contoh Konsumen C', motor: 'Yamaha NMAX', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 33900000, status: 'menunggu' },
  { id: 4, no_transaksi: 'TRX-0004', tanggal: '2026-10-09', konsumen: 'Contoh Konsumen D', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22800000, status: 'lunas' },
  { id: 5, no_transaksi: 'TRX-0005', tanggal: '2026-10-10', konsumen: 'Contoh Konsumen E', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 6, no_transaksi: 'TRX-0006', tanggal: '2026-10-11', konsumen: 'Contoh Konsumen F', motor: 'Yamaha Aerox', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 28700000, status: 'batal' },
  { id: 7, no_transaksi: 'TRX-0007', tanggal: '2026-10-12', konsumen: 'Contoh Konsumen G', motor: 'Honda PCX', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 41500000, status: 'menunggu' },
  { id: 8, no_transaksi: 'TRX-0008', tanggal: '2026-10-13', konsumen: 'Contoh Konsumen H', motor: 'Honda Vario 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28900000, status: 'lunas' },
];

// dealerId null = semua dealer (Super Admin)
export const salesFor = (dealerId) => (dealerId == null ? SALES_ROWS : SALES_ROWS.filter((r) => r.id_dealer === dealerId));

// Transaksi yang dibatalkan tidak dihitung
export const totalSales = (rows) => rows.filter((r) => r.status !== 'batal').reduce((n, r) => n + r.harga, 0);
