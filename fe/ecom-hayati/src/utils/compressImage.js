// src/utils/compressImage.js
// Perkecil foto di browser (canvas) bila ukurannya melebihi batas. Hasilnya JPEG; foto yang sudah kecil dikembalikan apa adanya.
// Dimensi dan kualitas diturunkan bertahap, tetapi tidak di bawah batas minimum agar teks KTP masih terbaca (OCR).
const START_SIDE = 2400; // sisi terpanjang awal (px)
const MIN_SIDE = 1200;
const START_QUALITY = 0.9;
const MIN_QUALITY = 0.6;

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' }); // hormati rotasi EXIF
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

const toBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

// Hasil: { file, compressed }. Melempar Error bila foto tidak bisa dibaca atau tetap terlalu besar.
export async function compressImage(file, maxBytes) {
  if (file.size <= maxBytes) return { file, compressed: false };

  const bitmap = await loadBitmap(file);
  const srcW = bitmap.width || bitmap.naturalWidth;
  const srcH = bitmap.height || bitmap.naturalHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let side = Math.min(START_SIDE, Math.max(srcW, srcH));
  let blob = null;
  while (true) {
    const scale = Math.min(1, side / Math.max(srcW, srcH));
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    ctx.fillStyle = '#fff'; // PNG transparan -> latar putih (JPEG tidak punya alpha)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (let q = START_QUALITY; q >= MIN_QUALITY - 0.001; q -= 0.1) {
      blob = await toBlob(canvas, q);
      if (blob && blob.size <= maxBytes) break;
    }
    if (blob && blob.size <= maxBytes) break;
    if (side <= MIN_SIDE) break;
    side = Math.max(MIN_SIDE, Math.round(side * 0.8));
  }
  bitmap.close?.();
  if (!blob || blob.size > maxBytes) throw new Error('Foto tidak dapat diperkecil sampai batas ukuran. Gunakan foto lain.');

  const name = `${file.name.replace(/\.[^.]+$/, '') || 'ktp'}.jpg`;
  return { file: new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() }), compressed: true };
}
