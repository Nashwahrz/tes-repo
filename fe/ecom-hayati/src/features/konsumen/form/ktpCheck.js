// src/features/konsumen/form/ktpCheck.js
// Validasi "apakah foto ini KTP" di browser, tanpa mengubah BE. Dua lapis:
//  1. checkPhoto: pemeriksaan gambar sebelum dipakai (resolusi, arah, ketajaman). Hanya foto yang benar-benar kecil ditolak;
//     resolusi rendah diterima (diperbesar otomatis saat dipindai, lihat utils/enhanceForOcr) dan sekadar diperingatkan.
//  2. looksLikeKtp: penilaian dari hasil OCR BE (raw_text + kolom yang terbaca): NIK 16 digit dan kata kunci khas KTP.
// Keduanya heuristik: foto KTP yang sangat buram bisa lolos/terblokir keliru, sehingga pemakai tetap diberi pilihan melanjutkan.

const HARD_MIN_SHORT_SIDE = 240; // di bawah ini teks KTP praktis tidak terbaca walau diperbesar: ditolak
const LOW_SHORT_SIDE = 480; // di bawah ini foto diperbesar otomatis untuk OCR, hasil bisa kurang akurat: diperingatkan
const BLUR_LIMIT = 25; // varians Laplacian; makin kecil makin buram

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch { /* lanjut ke <img> */ }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Foto tidak dapat dibaca.'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

// Ketajaman: varians Laplacian pada versi kecil (sisi terpanjang 480 px) berwarna abu-abu
function sharpness(bitmap, w, h) {
  const scale = Math.min(1, 480 / Math.max(w, h));
  const cw = Math.max(Math.round(w * scale), 3);
  const ch = Math.max(Math.round(h * scale), 3);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch).data;
  const gray = new Float32Array(cw * ch);
  for (let i = 0; i < gray.length; i += 1) gray[i] = (px[i * 4] * 299 + px[i * 4 + 1] * 587 + px[i * 4 + 2] * 114) / 1000;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < ch - 1; y += 1) {
    for (let x = 1; x < cw - 1; x += 1) {
      const i = y * cw + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - cw] - gray[i + cw];
      sum += lap;
      sumSq += lap * lap;
      n += 1;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

// Hasil: { reject: string|null, warnings: string[] }
export async function checkPhoto(file) {
  let bitmap;
  try {
    bitmap = await loadBitmap(file);
  } catch {
    return { reject: 'Foto tidak dapat dibaca. Pilih file gambar lain.', warnings: [] };
  }
  const w = bitmap.width || bitmap.naturalWidth;
  const h = bitmap.height || bitmap.naturalHeight;
  if (Math.min(w, h) < HARD_MIN_SHORT_SIDE) {
    return { reject: `Resolusi foto terlalu kecil (${w}×${h}px), teks KTP tidak akan terbaca walau diperbesar. Gunakan foto minimal ${HARD_MIN_SHORT_SIDE}px pada sisi terpendek.`, warnings: [] };
  }
  const warnings = [];
  if (Math.min(w, h) < LOW_SHORT_SIDE) {
    warnings.push(`Resolusi foto rendah (${w}×${h}px). Foto diperbesar otomatis saat dipindai, tetapi hasil baca bisa kurang akurat; foto yang lebih besar dan jelas lebih baik.`);
  }
  const ratio = w / h;
  if (ratio < 1) warnings.push('Foto berorientasi tegak. KTP biasanya difoto mendatar; pastikan foto tidak terputar dan seluruh KTP terlihat.');
  else if (ratio > 2.6) warnings.push('Bentuk foto terlalu memanjang untuk sebuah KTP. Pastikan seluruh kartu terlihat.');
  try {
    if (sharpness(bitmap, w, h) < BLUR_LIMIT) warnings.push('Foto tampak buram. Foto yang jelas dan terang memudahkan pembacaan KTP.');
  } catch { /* abaikan: pemeriksaan ketajaman opsional */ }
  if (typeof bitmap.close === 'function') bitmap.close();
  return { reject: null, warnings };
}

// Kata kunci khas yang tercetak di KTP (huruf kecil; OCR sering menyisipkan titik/spasi, jadi polanya longgar)
const KEYWORDS = [
  /provinsi/, /kabupaten|\bkota\b/, /\bnik\b/, /\bnama\b/, /tempat.{0,6}lahir|tgl.{0,3}lahir|tanggal.{0,3}lahir/, /jenis.{0,3}kelamin/,
  /gol.{0,8}darah/, /alamat/, /\brt\b.{0,3}\brw\b|rt\s*\/\s*rw/, /kel.{0,6}desa|kelurahan/, /kecamatan/, /agama/,
  /status.{0,3}perkawinan/, /pekerjaan/, /kewarganegaraan/, /berlaku.{0,3}hingga/,
];
const READ_FIELDS = ['nik', 'name', 'tgl_lahir', 'jenis_kelamin', 'alamat', 'agama', 'pekerjaan', 'provinsi', 'kecamatan', 'desa_kelurahan'];

// data: hasil OCR BE ({ raw_text, nik, name, ... }). Hasil: { isKtp, hasNik, keywords, fields }
export function looksLikeKtp(data) {
  const text = String(data?.raw_text ?? '').toLowerCase();
  const nik = String(data?.nik ?? '').replace(/\D/g, '');
  const hasNik = nik.length === 16 || /(?<!\d)\d{16}(?!\d)/.test(text.replace(/[\s.:-]/g, ''));
  const keywords = KEYWORDS.filter((re) => re.test(text)).length;
  const fields = READ_FIELDS.filter((k) => String(data?.[k] ?? '').trim()).length;
  const isKtp = (hasNik && (keywords >= 3 || fields >= 4)) || keywords >= 6 || fields >= 6;
  return { isKtp, hasNik, keywords, fields };
}
