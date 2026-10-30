export const STATUS_LABEL = { pending: 'Menunggu Verifikasi', diterima: 'Diterima', ditolak: 'Ditolak' };
export const KAWIN = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

export const EMPTY = {
  nik: '', name: '', id_tmp_lahir: '', tgl_lahir: '', jenis_kelamin: '', alamat: '', latitude: '', longitude: '', rt: '', rw: '',
  id_kelurahan: '', id_kecamatan: '', id_kabupaten_kota: '', id_provinsi: '', id_agama: '', status_perkawinan: '',
  id_pekerjaan: '', kewarganegaraan: 'WNI', no_telp: '', email: '',
};
// Wilayah berjenjang: mengganti induk mengosongkan turunannya
export const CHILD_OF = { id_provinsi: ['id_kabupaten_kota', 'id_kecamatan', 'id_kelurahan'], id_kabupaten_kota: ['id_kecamatan', 'id_kelurahan'], id_kecamatan: ['id_kelurahan'] };

export const GEO_KEY = { id_kecamatan: 'kecamatan', id_kelurahan: 'kelurahan' }; // kolom form yang dicari lewat nama
// Nama dari OCR (teks) dicocokkan ke opsi master tanpa awalan "Kota/Kabupaten" dan tanpa beda huruf
export const normName = (t) => String(t ?? '').toLowerCase().replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?|kelurahan|kel\.?|desa|provinsi|prov\.?)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
export const nameOf = (options, id) => options.find((o) => String(o.id) === String(id))?.name ?? '';
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
export const matchId = (options, text) => matchOpt(options, text)?.id;
export const FIELDS = Object.keys(EMPTY);
export const MAX_FILE = 2 * 1024 * 1024; // 2MB, sama dengan BE
export const MAX_PICK = 25 * 1024 * 1024; // foto asli di atas ini ditolak; di bawahnya diperkecil otomatis bila melebihi MAX_FILE
export const TARGET_FILE = 1.9 * 1024 * 1024; // sasaran hasil perkecilan, sedikit di bawah batas BE

// BE mengirim tgl_lahir sebagai ISO (UTC); ambil bagian tanggalnya saja
export const toForm = (k) => Object.fromEntries(FIELDS.map((f) => {
  let v = k[f] ?? '';
  if (f === 'tgl_lahir' && v) v = String(v).slice(0, 10);
  return [f, String(v)];
}));

// Field yang tercetak di KTP; yang tidak terbaca oleh scan diberi peringatan di kolomnya
export const SCAN_FIELDS = [
  'nik', 'name', 'id_tmp_lahir', 'tgl_lahir', 'jenis_kelamin', 'alamat', 'rt', 'rw', 'id_kelurahan', 'id_kecamatan',
  'id_kabupaten_kota', 'id_provinsi', 'id_agama', 'status_perkawinan', 'id_pekerjaan', 'kewarganegaraan',
];

// Label field untuk pesan wajib diisi
export const LABELS = {
  nik: 'NIK', name: 'Nama', id_tmp_lahir: 'Tempat lahir', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat: 'Alamat', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW', id_kelurahan: 'Kelurahan/Desa',
  id_kecamatan: 'Kecamatan', id_kabupaten_kota: 'Kabupaten/Kota', id_provinsi: 'Provinsi', id_agama: 'Agama',
  status_perkawinan: 'Status perkawinan', id_pekerjaan: 'Pekerjaan', kewarganegaraan: 'Kewarganegaraan',
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
  if (!e.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email tidak valid.';
  [['latitude', 90], ['longitude', 180]].forEach(([k, max]) => {
    if (e[k]) return;
    const n = Number(form[k]);
    if (Number.isNaN(n) || Math.abs(n) > max) e[k] = `${LABELS[k]} harus berupa angka antara -${max} dan ${max}.`;
  });
  [['name', 255], ['alamat', 255], ['rt', 3], ['rw', 3], ['no_telp', 20]].forEach(([k, max]) => {
    if (!e[k] && form[k].length > max) e[k] = `Maksimal ${max} karakter.`;
  });
  return e;
}
