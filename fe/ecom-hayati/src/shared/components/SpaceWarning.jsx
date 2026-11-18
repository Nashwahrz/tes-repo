// Peringatan (tidak memblokir) untuk spasi yang tidak terlihat di isian teks:
// spasi di awal/akhir (dihapus otomatis saat disimpan) dan spasi ganda di tengah (tidak dihapus, perlu dicek).
const spaceIssues = (value) => {
  const v = String(value ?? '');
  if (!v.trim()) return []; // kosong / hanya spasi ditangani pesan "wajib diisi"
  const issues = [];
  if (v !== v.trimStart() && v !== v.trimEnd()) issues.push('Ada spasi di awal dan akhir teks. Spasi itu dihapus otomatis saat disimpan.');
  else if (v !== v.trimStart()) issues.push('Ada spasi di awal teks. Spasi itu dihapus otomatis saat disimpan.');
  else if (v !== v.trimEnd()) issues.push('Ada spasi di akhir teks. Spasi itu dihapus otomatis saat disimpan.');
  if (/\S {2,}\S/.test(v)) issues.push('Ada spasi ganda di dalam teks. Periksa kembali penulisannya.');
  return issues;
};

function SpaceWarning({ value }) {
  const issues = spaceIssues(value);
  if (issues.length === 0) return null;
  return issues.map((text) => <p key={text} className="dash-field-warn" role="status">⚠ {text}</p>);
}

export default SpaceWarning;
