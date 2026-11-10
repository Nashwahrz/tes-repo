import { scanKtp, getKabupatens, getProvinsis, searchKecamatans, searchKelurahans, searchMaster } from '../../../api/authServices';
import { CHILD_OF, LABELS, SCAN_FIELDS, TARGET_FILE, matchId, matchOpt, normName } from './konsumenFormConfig';
import { enhanceForOcr } from '../../../utils/enhanceForOcr';
import { looksLikeKtp } from './ktpCheck';

export async function scanKtpToForm(file, master) {
  // Foto diperbaiki dulu (kontras, ketajaman, ukuran) supaya foto agak blur tetap terbaca; foto yang disimpan tidak berubah
  const res = await scanKtp(await enhanceForOcr(file, TARGET_FILE));
  // NIK sudah terdaftar: BE membungkus hasil baca di scanned_data
  let data = res?.scanned_data ?? res;
  // Bukan KTP (tidak ada NIK 16 digit / kata kunci KTP): form tidak diisi, isian yang ada tidak tertimpa
  const check = looksLikeKtp(data);
  if (!check.isKtp) {
    return {
      notKtp: true,
      formPatch: {}, geoQuery: { kecamatan: '', kelurahan: '' }, hints: {}, filled: {}, missing: {}, touched: {},
      note: { ok: false, text: 'Foto ini tidak terdeteksi sebagai KTP (NIK 16 digit dan tulisan khas KTP tidak ditemukan). Pastikan yang difoto adalah KTP, seluruh kartu terlihat, jelas, dan tidak silau, lalu ganti foto.' },
    };
  }
  // OCR mengirim teks (nama wilayah, agama, pekerjaan); cocokkan ke kode master.
  // Teks yang terbaca tetapi tidak ada di daftar dicatat di `unmatched`: kolomnya dikosongkan dan user diminta mengisinya ulang.
  const found = {};
  const unmatched = []; // { key, label, text }
  const pick = (key, options, text) => {
    const t = String(text ?? '').trim();
    if (!t) return undefined;
    const id = matchId(options, t);
    if (id !== undefined) found[key] = String(id);
    else unmatched.push({ key, label: LABELS[key], text: t });
    return id;
  };
  // Induk tidak cocok -> turunannya tidak bisa dicari; tetap dicatat agar user tahu perlu diisi manual
  const skip = (key, text) => { const t = String(text ?? '').trim(); if (t) unmatched.push({ key, label: LABELS[key], text: t }); };
  pick('fk_agama', master.agama, data.agama);
  pick('fk_pekerjaan', master.pekerjaan, data.pekerjaan);
  pick('fk_temp_lahir', master.tempatLahir, data.tmp_lahir);
  let prov = pick('fk_provinsi', master.provinsi, data.provinsi);
  // Di KTP kabupaten/kota tidak berlabel: ia hanya satu baris tepat di bawah "PROVINSI ..." ("KOTA PADANG", "KAB. SOLOK", atau tanpa awalan seperti "JAKARTA SELATAN").
  // Maka kandidatnya diambil dari teks mentah OCR: baris berawalan Kota/Kab., dua baris di bawah provinsi, lalu hasil parsing BE.
  const lines = String(data.raw_text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const provLine = lines.findIndex((l) => /provinsi/i.test(l));
  const typedLines = lines.filter((l) => /^(kota|kabupaten|kab\.?)\s+\S/i.test(l)).slice(0, 3);
  const kabTexts = [...new Set([...typedLines, ...(provLine >= 0 ? lines.slice(provLine + 1, provLine + 3) : []), String(data.kabupaten_kota ?? '').trim()].filter(Boolean))];
  // Provinsi tidak terbaca/tidak cocok: cari di seluruh kabupaten/kota, provinsinya diambil dari kabupaten yang ditemukan
  const kabPool = await getKabupatens(prov).catch(() => []);
  const kabHit = kabTexts.map((t) => matchOpt(kabPool, t)).find(Boolean);
  let kab;
  if (kabHit) {
    kab = kabHit.kode;
    found.fk_kabupaten_kota = String(kab);
    if (!prov && kabHit.kode_provinsi) { // BE menghubungkan wilayah lewat kode; form konsumen juga menyimpan kode
      prov = (await getProvinsis().catch(() => [])).find((p) => String(p.kode) === String(kabHit.kode_provinsi))?.kode;
      if (prov) found.fk_provinsi = String(prov);
    }
  } else if (kabTexts.length) {
    unmatched.push({ key: 'fk_kabupaten_kota', label: LABELS.fk_kabupaten_kota, text: kabTexts[0] });
  }
  const kecText = String(data.kecamatan ?? '').trim();
  // Kabupaten/kota tidak terbaca atau tidak cocok: cari kecamatannya di seluruh wilayah; bila namanya tepat satu, kabupaten & provinsinya diambil darinya
  if (!kab && kecText.length >= 3) {
    const hits = (await searchMaster('/kecamatans/aktif', kecText, undefined, 100).catch(() => [])).filter((r) => normName(r.name) === normName(kecText));
    const kabRow = hits.length === 1 ? (await getKabupatens().catch(() => [])).find((k) => String(k.kode) === String(hits[0].kode_kabupaten_kota)) : null;
    if (kabRow) {
      kab = kabRow.kode;
      found.fk_kabupaten_kota = String(kab);
      if (!prov && kabRow.kode_provinsi) {
        prov = (await getProvinsis().catch(() => [])).find((p) => String(p.kode) === String(kabRow.kode_provinsi))?.kode;
        if (prov) found.fk_provinsi = String(prov);
      }
    }
  }
  const kec = kab && kecText.length >= 3 ? pick('fk_kecamatan', (await searchKecamatans(kecText, kab)).rows, kecText) : (skip('fk_kecamatan', kecText), undefined);
  const kelText = String(data.desa_kelurahan ?? '').trim();
  if (kec && kelText.length >= 3) pick('fk_kelurahan', (await searchKelurahans(kelText, kec)).rows, kelText);
  else skip('fk_kelurahan', kelText);
  for (let i = unmatched.length - 1; i >= 0; i -= 1) if (unmatched[i].key in found) unmatched.splice(i, 1);
  // Hasil baca OCR (nama field BE scan-ktp) -> kolom form. OCR hanya membaca satu alamat (di KTP): menjadi alamat sesuai KTP
  const OCR_TO_FORM = { nik: 'nik', name: 'konsumen_name', tgl_lahir: 'birth_date', jenis_kelamin: 'gender', alamat: 'ktp_address', rt: 'rt', rw: 'rw', status_perkawinan: 'marital_status', kewarganegaraan: 'nationality' };
  Object.entries(OCR_TO_FORM).forEach(([from, to]) => { if (data[from]) found[to] = String(data[from]); });

  const readable = Object.keys(found);
  // Induk baru dari OCR: turunan lama yang tidak ikut terbaca dikosongkan agar tidak tertinggal dari wilayah lain
  const cleared = Object.fromEntries(Object.keys({ ...found, ...Object.fromEntries(unmatched.map((u) => [u.key, 1])) }).flatMap((k) => (CHILD_OF[k] ?? []).filter((c) => !(c in found)).map((c) => [c, ''])));
  const wiped = Object.fromEntries(unmatched.map((u) => [u.key, '']));
  const missing = SCAN_FIELDS.filter((k) => !(k in found) && !unmatched.some((u) => u.key === k));

  let note;
  if (readable.length === 0) {
    note = { ok: false, text: 'KTP dipindai, tetapi tidak ada data yang terbaca. Isi data secara manual.' };
  } else if (unmatched.length || missing.length) {
    const issues = [
      unmatched.length && `${unmatched.length} data tidak cocok dengan daftar`,
      missing.length && `${missing.length} data tidak terbaca`,
    ].filter(Boolean).join(' dan ');
    note = { ok: false, text: `KTP dipindai: ${readable.length} data terisi otomatis, ${issues}. Lihat keterangan di bawah kolom yang bersangkutan dan periksa kembali semuanya.` };
  } else {
    note = { ok: true, text: `KTP berhasil dipindai: ${readable.length} data terisi otomatis. Periksa kembali hasilnya sebelum menyimpan.` };
  }

  return {
    formPatch: { ...cleared, ...wiped, ...found },
    // Kecamatan/kelurahan yang tidak cocok: kolom cari diisi teks OCR (bila induknya cocok) supaya user tinggal memilih atau mengubah ejaannya
    geoQuery: {
      kecamatan: unmatched.some((u) => u.key === 'fk_kecamatan') && kab ? kecText : '',
      kelurahan: unmatched.some((u) => u.key === 'fk_kelurahan') && kec ? kelText : '',
    },
    hints: Object.fromEntries(unmatched.map((u) => [u.key, u.text])),
    filled: Object.fromEntries(readable.map((k) => [k, true])),
    missing: Object.fromEntries(missing.map((k) => [k, true])),
    // Tandai kolom bermasalah agar pesan "wajib diisi" langsung terlihat
    touched: { nik: true, ...Object.fromEntries(unmatched.map((u) => [u.key, true])), ...Object.fromEntries(missing.map((k) => [k, true])) },
    note,
  };
}
