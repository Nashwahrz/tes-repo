// src/api/masterExcel.js
// Template & pembacaan Excel (.xlsx) untuk impor data master. Urutan kolom sama dengan file seeder BE:
// Kode | Kode Induk (hanya wilayah yang punya induk) | Nama. Dibaca di browser; baris dikirim satu per satu lewat POST biasa.
// Library Excel dimuat saat dipakai saja (dynamic import) agar tidak membebani bundel awal.

const text = (v) => String(v ?? '').trim();
// Kode yang terbaca sebagai angka desimal (mis. 11.0) dirapikan; kode berawalan nol aman bila kolomnya bertipe teks (seperti di template)
const kodeText = (v) => (typeof v === 'number' && Number.isInteger(v) ? String(v) : text(v).replace(/\.0+$/, ''));

const headers = (tab) => ['Kode', ...(tab.parent ? [`Kode ${tab.parent.label}`] : []), 'Nama'];

export const downloadMasterTemplate = async (tab) => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const head = headers(tab).map((value) => ({ value, fontWeight: 'bold' }));
  const cell = (value) => ({ value, type: String }); // teks, supaya kode berawalan nol tidak hilang
  const example = tab.parent ? [cell('1101'), cell('11'), cell(`Contoh ${tab.label}`)] : [cell('01'), cell(`Contoh ${tab.label}`)];
  const notes = [
    [{ value: `Petunjuk impor ${tab.label}`, fontWeight: 'bold' }],
    [`Isi data mulai baris ke-2 pada sheet "Data". Baris pertama adalah judul kolom dan tidak diimpor.`],
    [`Kode: wajib, hanya angka (1-10 digit), harus unik, dan tidak dapat diubah setelah disimpan. Format kolom sebaiknya Teks.`],
    ...(tab.parent ? [[`${head[1].value}: wajib, harus kode ${tab.parent.label.toLowerCase()} yang sudah terdaftar.`]] : []),
    [`Nama: wajib, maksimal 255 karakter.`],
    [`Data berstatus aktif saat dibuat. Kode yang sudah terdaftar akan ditolak oleh server.`],
    [`Contoh baris (jangan ikut diimpor):`],
    [example.map((c) => c.value).join('  |  ')],
  ];
  const widths = tab.parent ? [14, 22, 40] : [14, 40];
  await writeXlsxFile([
    { sheet: 'Data', data: [head], columns: widths.map((width) => ({ width })) },
    { sheet: 'Petunjuk', data: notes, columns: [{ width: 100 }] },
  ]).toFile(`template_master_${tab.key}.xlsx`);
};

// Hasil: { rows: [{ line, kode, [parentField], name }], errors: [{ line, message }] }
// line = nomor baris di Excel. Baris bermasalah dilewati dan dilaporkan; sisanya tetap bisa diimpor.
export const parseMasterExcel = async (file, tab) => {
  const { readSheet } = await import('read-excel-file/browser');
  const sheet = await readSheet(file);
  const width = tab.parent ? 3 : 2;
  const rows = [];
  const errors = [];
  const seen = new Set();
  sheet.forEach((cols, i) => {
    const line = i + 1;
    const kode = kodeText(cols[0]);
    const parent = tab.parent ? kodeText(cols[1]) : '';
    const name = text(cols[width - 1]);
    if (!kode && !parent && !name) return;
    if (i === 0 && kode.toLowerCase() === 'kode') return;
    const fail = (message) => errors.push({ line, message });
    if (!kode) return fail('Kode kosong.');
    if (!/^\d{1,10}$/.test(kode)) return fail(`Kode "${kode}" harus berupa angka 1-10 digit.`);
    if (seen.has(kode)) return fail(`Kode "${kode}" dobel di dalam file.`);
    if (!name) return fail('Nama kosong.');
    if (name.length > 255) return fail('Nama lebih dari 255 karakter.');
    if (tab.parent && !parent) return fail(`Kode ${tab.parent.label.toLowerCase()} kosong.`);
    seen.add(kode);
    rows.push({ line, kode, ...(tab.parent ? { [tab.parent.field]: parent } : {}), name });
  });
  return { rows, errors };
};
