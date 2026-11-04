// Detik -> "9 menit 25 detik" (menit dihilangkan bila kurang dari semenit)
export const formatWait = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} menit ${s} detik` : `${s} detik`;
};
