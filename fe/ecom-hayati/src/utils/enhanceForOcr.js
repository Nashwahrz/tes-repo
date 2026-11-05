// src/utils/enhanceForOcr.js
// Perbaiki foto KTP di browser sebelum dikirim ke OCR agar foto agak blur / kontras rendah tetap terbaca:
// perbesar bila kecil, grayscale, regangkan kontras (auto-levels), lalu pertajam (unsharp mask).
// Hanya dipakai untuk scan; foto yang disimpan tetap yang asli. Gagal / terlalu besar -> kembalikan file semula.
const TARGET_SIDE = 2000; // sisi terpanjang yang dituju (px); foto lebih kecil diperbesar, lebih besar diperkecil
const MAX_SIDE = 2600;
const SHARPEN = 1.2; // kekuatan unsharp mask
const QUALITY = 0.92;

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

// Grayscale + regangkan histogram (abaikan 1% piksel paling gelap/terang agar tahan noise)
function autoLevels(px) {
  const hist = new Uint32Array(256);
  const n = px.length / 4;
  for (let i = 0; i < px.length; i += 4) {
    const g = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000 | 0;
    px[i] = g;
    hist[g] += 1;
  }
  const cut = n * 0.01;
  let lo = 0;
  let hi = 255;
  for (let acc = 0; lo < 255; lo += 1) { acc += hist[lo]; if (acc > cut) break; }
  for (let acc = 0; hi > 0; hi -= 1) { acc += hist[hi]; if (acc > cut) break; }
  const range = Math.max(hi - lo, 32); // jangan melebihkan gambar yang memang datar
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.min(255, Math.max(0, ((px[i] - lo) * 255) / range));
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
}

// Unsharp mask: tajam = asli + k * (asli - blur 3x3). Hanya kanal R (gambar sudah grayscale).
function sharpen(px, w, h, k) {
  const src = new Uint8ClampedArray(px.length);
  src.set(px);
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = (y * w + x) * 4;
      const up = i - w * 4;
      const dn = i + w * 4;
      const blur = (src[up - 4] + src[up] + src[up + 4] + src[i - 4] + src[i] + src[i + 4] + src[dn - 4] + src[dn] + src[dn + 4]) / 9;
      const v = src[i] + k * (src[i] - blur);
      px[i] = v;
      px[i + 1] = v;
      px[i + 2] = v;
    }
  }
}

// Hasil: File JPEG yang sudah diperbaiki, atau `file` semula bila gagal / hasilnya melebihi maxBytes.
export async function enhanceForOcr(file, maxBytes) {
  try {
    const bitmap = await loadBitmap(file);
    const srcW = bitmap.width || bitmap.naturalWidth;
    const srcH = bitmap.height || bitmap.naturalHeight;
    const longest = Math.max(srcW, srcH);
    const side = longest > MAX_SIDE ? MAX_SIDE : Math.max(longest, Math.min(TARGET_SIDE, longest * 3)); // perbesar maks 3x
    const scale = side / longest;
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const img = ctx.getImageData(0, 0, w, h);
    autoLevels(img.data);
    sharpen(img.data, w, h, SHARPEN);
    ctx.putImageData(img, 0, 0);

    for (let q = QUALITY; q >= 0.7; q -= 0.1) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', q));
      if (blob && blob.size <= maxBytes) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'ktp'}-ocr.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      }
    }
  } catch { /* pakai foto semula */ }
  return file;
}
