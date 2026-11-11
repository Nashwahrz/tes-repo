// src/api/masterExcel.js
// Template Excel (.xlsx) untuk impor data master. Header harus persis seperti yang diminta BE (urutan: kode, nama, kode induk):
//   agama: agama_code, agama_name | pekerjaan: pekerjaan_code, pekerjaan_name | provinsi: provinsi_code, provinsi_name
//   kabupaten: kabupaten_kota_code, kabupaten_kota_name, provinsi_code | kecamatan: ..., kabupaten_kota_code | kelurahan: ..., kecamatan_code
// File diunggah apa adanya ke BE (lihat importMaster di master.js); pembacaan dan validasi baris dilakukan BE.
// Library Excel dimuat saat dipakai saja (dynamic import) agar tidak membebani bundel awal.

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024; // batas BE: 2MB

// Panjang kode per master (BE: rule `size:N`, harus persis N karakter)
export const MASTER_CODE_LENGTH = { agama: 3, pekerjaan: 3, provinsi: 4, kabupaten: 4, kecamatan: 6, kelurahan: 10 };

const PREFIX = { agama: 'agama', pekerjaan: 'pekerjaan', provinsi: 'provinsi', kabupaten: 'kabupaten_kota', kecamatan: 'kecamatan', kelurahan: 'kelurahan' };
const PARENT_CODE = { kabupaten: 'provinsi_code', kecamatan: 'kabupaten_kota_code', kelurahan: 'kecamatan_code' };

export const masterImportHeaders = (tab) => [`${PREFIX[tab.key]}_code`, `${PREFIX[tab.key]}_name`, ...(PARENT_CODE[tab.key] ? [PARENT_CODE[tab.key]] : [])];

export const downloadMasterTemplate = async (tab) => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const heads = masterImportHeaders(tab);
  const head = heads.map((value) => ({ value, fontWeight: 'bold' }));
  const cell = (value) => ({ value, type: String }); // teks, supaya kode berawalan nol tidak hilang
  const example = tab.parent ? [cell('1'.padEnd(MASTER_CODE_LENGTH[tab.key], '0')), cell(`Contoh ${tab.label}`), cell('11')] : [cell('1'.padEnd(MASTER_CODE_LENGTH[tab.key], '0')), cell(`Contoh ${tab.label}`)];
  const notes = [
    [{ value: `Petunjuk impor ${tab.label}`, fontWeight: 'bold' }],
    [`Isi data mulai baris ke-2 pada sheet "Data". Baris pertama adalah judul kolom (${heads.join(', ')}) dan jangan diubah.`],
    [`${heads[0]}: wajib, harus persis ${MASTER_CODE_LENGTH[tab.key]} digit angka, dan unik. Format kolom sebaiknya Teks agar kode berawalan nol tidak hilang.`],
    [`${heads[1]}: wajib, maksimal 255 karakter.`],
    ...(tab.parent ? [[`${heads[2]}: wajib, harus kode ${tab.parent.label.toLowerCase()} yang sudah terdaftar.`]] : []),
    [`Data berstatus aktif saat dibuat. Baris yang tidak valid (kode sudah ada, induk tidak ditemukan, dll.) dilewati dan dilaporkan oleh server.`],
    [`Format .xlsx atau .xls, ukuran maksimal 2MB.`],
    [`Contoh baris (jangan ikut diimpor):`],
    [example.map((c) => c.value).join('  |  ')],
  ];
  await writeXlsxFile([
    { sheet: 'Data', data: [head], columns: heads.map((h) => ({ width: Math.max(h.length + 4, 16) })) },
    { sheet: 'Petunjuk', data: notes, columns: [{ width: 100 }] },
  ]).toFile(`template_master_${tab.key}.xlsx`);
};
