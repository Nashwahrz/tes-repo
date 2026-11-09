export const STATUS_LABEL = { pending: 'Menunggu Verifikasi', diterima: 'Diterima', revisi: 'Perlu Revisi', ditolak: 'Ditolak' };
export const KAWIN = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

export const EMPTY = {
  nik: '', name: '', kode_tmp_lahir: '', tgl_lahir: '', jenis_kelamin: '', alamat_ktp: '', alamat_domisili: '', latitude: '', longitude: '', rt: '', rw: '',
  kode_kelurahan: '', kode_kecamatan: '', kode_kabupaten_kota: '', kode_provinsi: '', kode_agama: '', status_perkawinan: '',
  kode_pekerjaan: '', kewarganegaraan: 'WNI', no_telp: '', email: '',
};
// Wilayah berjenjang: mengganti induk mengosongkan turunannya
export const CHILD_OF = { kode_provinsi: ['kode_kabupaten_kota', 'kode_kecamatan', 'kode_kelurahan'], kode_kabupaten_kota: ['kode_kecamatan', 'kode_kelurahan'], kode_kecamatan: ['kode_kelurahan'] };

export const GEO_KEY = { kode_kecamatan: 'kecamatan', kode_kelurahan: 'kelurahan' }; // kolom form yang dicari lewat nama
// Nama dari OCR (teks) dicocokkan ke opsi master tanpa awalan "Kota/Kabupaten" dan tanpa beda huruf
export const normName = (t) => String(t ?? '').toLowerCase().replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?|kelurahan|kel\.?|desa|provinsi|prov\.?)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
// Nilai pilihan di form = kode master (BE menyimpan dan memvalidasi konsumen lewat kode_*)
export const nameOf = (options, kode) => options.find((o) => String(o.kode) === String(kode))?.name ?? '';
// Jenis wilayah ("KOTA X" / "KAB. X") ikut dicocokkan bila ada di teks, karena nama yang sama bisa berupa kota sekaligus kabupaten (mis. Solok).
// Hasil hanya dipakai bila tepat satu yang cocok; bila ambigu dibiarkan agar user memilih sendiri.
export const typeOf = (t) => (/^\s*kota\b/i.test(t) ? 'kota' : /^\s*(kab\.?|kabupaten)(\s|$)/i.test(t) ? 'kab' : '');
export const matchOpt = (options, text) => {
  const n = normName(text);
  if (!n) return undefined;
  const type = typeOf(String(text));
  const hits = options.filter((o) => normName(o.name) === n && (!type || !typeOf(o.name) || typeOf(o.name) === type));
  return hits.length === 1 ? hits[0] : undefined;
};
export const matchId = (options, text) => matchOpt(options, text)?.kode;
export const FIELDS = Object.keys(EMPTY);
export const MAX_FILE = 2 * 1024 * 1024; // 2MB, sama dengan BE
export const MAX_PICK = 25 * 1024 * 1024; // foto asli di atas ini ditolak; di bawahnya diperkecil otomatis bila melebihi MAX_FILE
export const TARGET_FILE = 1.9 * 1024 * 1024; // sasaran hasil perkecilan, sedikit di bawah batas BE

// tgl_lahir dari BE bisa "YYYY-MM-DD" (daftar) atau ISO UTC (model Eloquent, mis. hasil cek NIK).
// ISO UTC dari tanggal Jakarta mundur sehari (1990-05-10 -> "1990-05-09T17:00:00Z"), jadi dikembalikan ke zona waktu BE (Asia/Jakarta)
// agar tanggal yang tidak diubah user tidak terkirim sebagai tanggal berbeda (yang memicu verifikasi ulang)
export const tglLahirOf = (v) => {
  if (!v) return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s) || !/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
};
export const toForm = (k) => Object.fromEntries(FIELDS.map((f) => {
  let v = k[f] ?? '';
  if (f === 'tgl_lahir' && v) v = tglLahirOf(v);
  return [f, String(v)];
}));

// Field yang tercetak di KTP; yang tidak terbaca oleh scan diberi peringatan di kolomnya
export const SCAN_FIELDS = [
  'nik', 'name', 'kode_tmp_lahir', 'tgl_lahir', 'jenis_kelamin', 'alamat_ktp', 'rt', 'rw', 'kode_kelurahan', 'kode_kecamatan',
  'kode_kabupaten_kota', 'kode_provinsi', 'kode_agama', 'status_perkawinan', 'kode_pekerjaan', 'kewarganegaraan',
];

// Label field untuk pesan wajib diisi
export const LABELS = {
  nik: 'NIK', name: 'Nama', kode_tmp_lahir: 'Tempat lahir', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat_ktp: 'Alamat sesuai KTP', alamat_domisili: 'Alamat domisili', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW', kode_kelurahan: 'Kelurahan/Desa',
  kode_kecamatan: 'Kecamatan', kode_kabupaten_kota: 'Kabupaten/Kota', kode_provinsi: 'Provinsi', kode_agama: 'Agama',
  status_perkawinan: 'Status perkawinan', kode_pekerjaan: 'Pekerjaan', kewarganegaraan: 'Kewarganegaraan',
  no_telp: 'No. telp', email: 'Email',
};

// Validasi mengikuti be/app/Http/Requests/KonsumenRequest.php (semua field wajib)
export function validate(form, file, needFoto) {
  const e = {};
  if (needFoto && !file) e.foto_ktp = 'Foto KTP wajib diunggah.';
  FIELDS.forEach((k) => {
    if (!String(form[k]).trim()) e[k] = `${LABELS[k]} wajib diisi.`;
  });
  if (!e.nik && !/^\d{16}$/.test(form.nik)) e.nik = 'NIK harus terdiri dari 16 digit angka.';
  // No. telp: angka saja, boleh diawali + (kode negara), harus diawali 0 atau 62, 10-15 digit (BE: maks. 20 karakter)
  if (!e.no_telp) {
    const tel = form.no_telp.trim();
    if (!/^\+?\d+$/.test(tel)) e.no_telp = 'No. telp hanya boleh berisi angka (boleh diawali +).';
    else if (!/^(\+?62|0)/.test(tel)) e.no_telp = 'No. telp harus diawali 0 atau 62 (contoh: 08123456789).';
    else if (tel.replace('+', '').length < 10 || tel.replace('+', '').length > 15) e.no_telp = 'No. telp harus 10-15 digit.';
  }
  // Email: satu @, nama dan domain tanpa spasi, domain punya titik dan akhiran min. 2 huruf, tanpa titik berurutan
  if (!e.email) {
    const mail = form.email.trim();
    if (mail.length > 255) e.email = 'Maksimal 255 karakter.';
    else if (!/^[^\s@.][^\s@]*@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/.test(mail) || mail.includes('..')) e.email = 'Format email tidak valid (contoh: nama@domain.com).';
  }
  [['latitude', 90], ['longitude', 180]].forEach(([k, max]) => {
    if (e[k]) return;
    const n = Number(form[k]);
    if (Number.isNaN(n) || Math.abs(n) > max) e[k] = `${LABELS[k]} harus berupa angka antara -${max} dan ${max}.`;
  });
  [['name', 255], ['alamat_ktp', 255], ['alamat_domisili', 255], ['rt', 3], ['rw', 3], ['no_telp', 20]].forEach(([k, max]) => {
    if (!e[k] && form[k].length > max) e[k] = `Maksimal ${max} karakter.`;
  });
  return e;
}
