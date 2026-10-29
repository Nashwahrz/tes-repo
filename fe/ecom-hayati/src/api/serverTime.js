// src/api/serverTime.js
// Waktu server dari header `Date` tiap respons BE. Disimpan sebagai selisih terhadap jam perangkat,
// jadi jam tetap benar walau jam perangkat salah. Header ini hanya terbaca di browser bila BE
// mengizinkannya lewat `exposed_headers` (CORS) atau FE diakses lewat proxy yang sama-origin.
let offsetMs = null;
const listeners = new Set();

export const recordServerDate = (headers) => {
  const t = Date.parse(headers?.date);
  if (Number.isNaN(t)) return;
  offsetMs = t - Date.now();
  listeners.forEach((fn) => fn());
};

// null bila belum ada respons yang membawa header Date
export const serverNow = () => (offsetMs === null ? null : new Date(Date.now() + offsetMs));

export const onServerTime = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
