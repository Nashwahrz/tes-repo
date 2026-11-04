// src/pages/dashboard/salesPrototype.js
// PROTOTIPE: BE belum punya tabel/endpoint penjualan, jadi tampilan memakai data contoh di bawah ini.
// Saat API tersedia: ubah SALES_PROTOTYPE menjadi false, hapus SALES_ROWS, dan isi baris dari response API
// (BE sebaiknya sudah membatasi baris ke dealer milik user non-Super Admin, seperti data konsumen).
// Bentuk baris: { id, no_transaksi, tanggal: 'YYYY-MM-DD', konsumen, motor, id_dealer, dealer, unit, harga, status: 'lunas' | 'menunggu' | 'batal' }
export const SALES_PROTOTYPE = true;

export const SALES_ROWS = [
  // --- TAHUN 2024 ---
  { id: 101, no_transaksi: 'TRX-2401', tanggal: '2024-02-15', konsumen: 'Budi Santoso', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18000000, status: 'lunas' },
  { id: 102, no_transaksi: 'TRX-2402', tanggal: '2024-04-10', konsumen: 'Rina Wijaya', motor: 'Honda Vario 125', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 23500000, status: 'lunas' },
  { id: 103, no_transaksi: 'TRX-2403', tanggal: '2024-06-20', konsumen: 'Ahmad Fauzi', motor: 'Honda Scoopy', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 44000000, status: 'lunas' },
  { id: 104, no_transaksi: 'TRX-2404', tanggal: '2024-08-14', konsumen: 'Siti Rahma', motor: 'Honda PCX 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 32500000, status: 'lunas' },
  { id: 105, no_transaksi: 'TRX-2405', tanggal: '2024-10-18', konsumen: 'Doni Pratama', motor: 'Yamaha NMAX', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 32000000, status: 'lunas' },
  { id: 106, no_transaksi: 'TRX-2406', tanggal: '2024-11-25', konsumen: 'Maya Anggraini', motor: 'Honda Vario 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 27500000, status: 'lunas' },

  // --- TAHUN 2025 ---
  { id: 201, no_transaksi: 'TRX-2501', tanggal: '2025-01-18', konsumen: 'Joko Susilo', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18200000, status: 'lunas' },
  { id: 202, no_transaksi: 'TRX-2502', tanggal: '2025-02-22', konsumen: 'Eka Putri', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22500000, status: 'lunas' },
  { id: 203, no_transaksi: 'TRX-2503', tanggal: '2025-03-14', konsumen: 'Bambang Irawan', motor: 'Honda Vario 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 56400000, status: 'lunas' },
  { id: 204, no_transaksi: 'TRX-2504', tanggal: '2025-04-20', konsumen: 'Dewi Lestari', motor: 'Honda PCX 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 33000000, status: 'lunas' },
  { id: 205, no_transaksi: 'TRX-2505', tanggal: '2025-05-12', konsumen: 'Hendra Gunawan', motor: 'Yamaha NMAX', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 33500000, status: 'lunas' },
  { id: 206, no_transaksi: 'TRX-2506', tanggal: '2025-06-18', konsumen: 'Indah Permata', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 36400000, status: 'lunas' },
  { id: 207, no_transaksi: 'TRX-2507', tanggal: '2025-07-25', konsumen: 'Rudi Hartono', motor: 'Honda ADV 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 36000000, status: 'lunas' },
  { id: 208, no_transaksi: 'TRX-2508', tanggal: '2025-08-17', konsumen: 'Nurul Hidayah', motor: 'Honda Vario 125', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 47600000, status: 'lunas' },
  { id: 209, no_transaksi: 'TRX-2509', tanggal: '2025-09-09', konsumen: 'Agus Salim', motor: 'Honda Stylo 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28000000, status: 'lunas' },
  { id: 210, no_transaksi: 'TRX-2510', tanggal: '2025-10-22', konsumen: 'Fitri Handayani', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 18200000, status: 'lunas' },
  { id: 211, no_transaksi: 'TRX-2511', tanggal: '2025-11-15', konsumen: 'Aris Munandar', motor: 'Honda CBR 150R', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 37500000, status: 'lunas' },
  { id: 212, no_transaksi: 'TRX-2512', tanggal: '2025-12-20', konsumen: 'Yuliana Sari', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 45000000, status: 'lunas' },

  // --- TAHUN 2026 (Januari - September) ---
  { id: 301, no_transaksi: 'TRX-2601', tanggal: '2026-01-12', konsumen: 'Surya Kencana', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 302, no_transaksi: 'TRX-2602', tanggal: '2026-01-26', konsumen: 'Tuti Alawiyah', motor: 'Honda Vario 125', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 24200000, status: 'lunas' },
  { id: 303, no_transaksi: 'TRX-2603', tanggal: '2026-02-08', konsumen: 'Dedi Kurniawan', motor: 'Honda Scoopy', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 45600000, status: 'lunas' },
  { id: 304, no_transaksi: 'TRX-2604', tanggal: '2026-02-19', konsumen: 'Ratna Juwita', motor: 'Honda PCX 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 33500000, status: 'lunas' },
  { id: 305, no_transaksi: 'TRX-2605', tanggal: '2026-02-27', konsumen: 'Fajar Nugraha', motor: 'Honda Vario 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28900000, status: 'lunas' },
  { id: 306, no_transaksi: 'TRX-2606', tanggal: '2026-03-05', konsumen: 'Wawan Setiawan', motor: 'Yamaha NMAX', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 33900000, status: 'lunas' },
  { id: 307, no_transaksi: 'TRX-2607', tanggal: '2026-03-16', konsumen: 'Lina Marlina', motor: 'Honda ADV 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 36800000, status: 'lunas' },
  { id: 308, no_transaksi: 'TRX-2608', tanggal: '2026-03-24', konsumen: 'Rian Hidayat', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 309, no_transaksi: 'TRX-2609', tanggal: '2026-04-06', konsumen: 'Siska Amelia', motor: 'Honda Stylo 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28500000, status: 'lunas' },
  { id: 310, no_transaksi: 'TRX-2610', tanggal: '2026-04-18', konsumen: 'Teguh Prasetyo', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 45600000, status: 'lunas' },
  { id: 311, no_transaksi: 'TRX-2611', tanggal: '2026-04-29', konsumen: 'Anita Safitri', motor: 'Honda Vario 125', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 24200000, status: 'lunas' },
  { id: 312, no_transaksi: 'TRX-2612', tanggal: '2026-05-04', konsumen: 'Gunawan Wibowo', motor: 'Honda CBR 150R', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 38200000, status: 'lunas' },
  { id: 313, no_transaksi: 'TRX-2613', tanggal: '2026-05-15', konsumen: 'Erna Susanti', motor: 'Honda PCX 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 67000000, status: 'lunas' },
  { id: 314, no_transaksi: 'TRX-2614', tanggal: '2026-05-27', konsumen: 'Bayu Saputra', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 18500000, status: 'lunas' },
  { id: 315, no_transaksi: 'TRX-2615', tanggal: '2026-06-03', konsumen: 'Mira Kusuma', motor: 'Honda Vario 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28900000, status: 'lunas' },
  { id: 316, no_transaksi: 'TRX-2616', tanggal: '2026-06-12', konsumen: 'Lukman Hakim', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 45600000, status: 'lunas' },
  { id: 317, no_transaksi: 'TRX-2617', tanggal: '2026-06-22', konsumen: 'Ria Ricis', motor: 'Honda ADV 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 36800000, status: 'lunas' },
  { id: 318, no_transaksi: 'TRX-2618', tanggal: '2026-07-07', konsumen: 'Farhan Maulana', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 319, no_transaksi: 'TRX-2619', tanggal: '2026-07-16', konsumen: 'Nadia Utami', motor: 'Yamaha NMAX', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 33900000, status: 'lunas' },
  { id: 320, no_transaksi: 'TRX-2620', tanggal: '2026-07-28', konsumen: 'Rizky Febian', motor: 'Honda Stylo 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 28500000, status: 'lunas' },
  { id: 321, no_transaksi: 'TRX-2621', tanggal: '2026-08-05', konsumen: 'Iskandar Muda', motor: 'Honda PCX 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 67000000, status: 'lunas' },
  { id: 322, no_transaksi: 'TRX-2622', tanggal: '2026-08-14', konsumen: 'Halimah Yacob', motor: 'Honda Vario 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 57800000, status: 'lunas' },
  { id: 323, no_transaksi: 'TRX-2623', tanggal: '2026-08-25', konsumen: 'Gilang Ramadhan', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 3, harga: 55500000, status: 'lunas' },
  { id: 324, no_transaksi: 'TRX-2624', tanggal: '2026-09-04', konsumen: 'Wahyu Hidayat', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 45600000, status: 'lunas' },
  { id: 325, no_transaksi: 'TRX-2625', tanggal: '2026-09-15', konsumen: 'Siti Badriah', motor: 'Honda ADV 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 36800000, status: 'lunas' },
  { id: 326, no_transaksi: 'TRX-2626', tanggal: '2026-09-22', konsumen: 'Chandra Wijaya', motor: 'Honda Vario 125', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 48400000, status: 'lunas' },
  { id: 327, no_transaksi: 'TRX-2627', tanggal: '2026-09-25', konsumen: 'Dina Lorenza', motor: 'Honda CBR 150R', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 38200000, status: 'lunas' },
  { id: 328, no_transaksi: 'TRX-2628', tanggal: '2026-09-29', konsumen: 'Kusuma Wardani', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 37000000, status: 'lunas' },

  // --- TAHUN 2026 (Oktober - Minggu 1 & 2) ---
  { id: 1, no_transaksi: 'TRX-0001', tanggal: '2026-10-02', konsumen: 'Contoh Konsumen A', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18500000, status: 'lunas' },
  { id: 2, no_transaksi: 'TRX-0002', tanggal: '2026-10-04', konsumen: 'Contoh Konsumen B', motor: 'Honda Vario 125', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 24200000, status: 'lunas' },
  { id: 329, no_transaksi: 'TRX-2629', tanggal: '2026-10-05', konsumen: 'Yusuf Mansur', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22800000, status: 'lunas' },
  { id: 3, no_transaksi: 'TRX-0003', tanggal: '2026-10-07', konsumen: 'Contoh Konsumen C', motor: 'Yamaha NMAX', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 33900000, status: 'menunggu' },
  { id: 330, no_transaksi: 'TRX-2630', tanggal: '2026-10-08', konsumen: 'Hasan Basri', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 4, no_transaksi: 'TRX-0004', tanggal: '2026-10-09', konsumen: 'Contoh Konsumen D', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22800000, status: 'lunas' },
  { id: 5, no_transaksi: 'TRX-0005', tanggal: '2026-10-10', konsumen: 'Contoh Konsumen E', motor: 'Honda Beat', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 6, no_transaksi: 'TRX-0006', tanggal: '2026-10-11', konsumen: 'Contoh Konsumen F', motor: 'Yamaha Aerox', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 28700000, status: 'batal' },

  // --- TAHUN 2026 (Oktober - Minggu Aktif 12-18 Okt 2026) ---
  { id: 7, no_transaksi: 'TRX-0007', tanggal: '2026-10-12', konsumen: 'Contoh Konsumen G', motor: 'Honda PCX 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 41500000, status: 'menunggu' },
  { id: 331, no_transaksi: 'TRX-2631', tanggal: '2026-10-12', konsumen: 'Anwar Sadat', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18500000, status: 'lunas' },
  { id: 8, no_transaksi: 'TRX-0008', tanggal: '2026-10-13', konsumen: 'Contoh Konsumen H', motor: 'Honda Vario 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28900000, status: 'lunas' },
  { id: 332, no_transaksi: 'TRX-2632', tanggal: '2026-10-14', konsumen: 'Zainal Abidin', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22800000, status: 'lunas' },
  { id: 333, no_transaksi: 'TRX-2633', tanggal: '2026-10-14', konsumen: 'Marlina Octora', motor: 'Honda Vario 125', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 24200000, status: 'lunas' },
  { id: 334, no_transaksi: 'TRX-2634', tanggal: '2026-10-15', konsumen: 'Rahmat Hidayat', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 2, harga: 37000000, status: 'lunas' },
  { id: 335, no_transaksi: 'TRX-2635', tanggal: '2026-10-15', konsumen: 'Bunga Citra', motor: 'Yamaha NMAX', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 33900000, status: 'lunas' },
  { id: 336, no_transaksi: 'TRX-2636', tanggal: '2026-10-16', konsumen: 'Fadel Muhammad', motor: 'Honda ADV 160', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 36800000, status: 'lunas' },
  { id: 337, no_transaksi: 'TRX-2637', tanggal: '2026-10-16', konsumen: 'Salma Salsabil', motor: 'Honda Stylo 160', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 28500000, status: 'lunas' },
  { id: 338, no_transaksi: 'TRX-2638', tanggal: '2026-10-17', konsumen: 'Dimas Anggara', motor: 'Honda Beat', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 18500000, status: 'lunas' },
  { id: 339, no_transaksi: 'TRX-2639', tanggal: '2026-10-17', konsumen: 'Jessica Mila', motor: 'Honda Scoopy', id_dealer: 2, dealer: 'Hayati Cabang 1', unit: 1, harga: 22800000, status: 'lunas' },
  { id: 340, no_transaksi: 'TRX-2640', tanggal: '2026-10-18', konsumen: 'Gading Marten', motor: 'Honda CBR 150R', id_dealer: 1, dealer: 'Hayati Pemuda', unit: 1, harga: 38200000, status: 'lunas' },
];

// dealerId null = semua dealer (Super Admin)
export const salesFor = (dealerId) => (dealerId == null ? SALES_ROWS : SALES_ROWS.filter((r) => r.id_dealer === dealerId));

// Transaksi yang dibatalkan tidak dihitung
export const totalSales = (rows) => rows.filter((r) => r.status !== 'batal').reduce((n, r) => n + r.harga, 0);
