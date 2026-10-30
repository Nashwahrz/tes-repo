import { scanKtp, getKabupatens, getProvinsis, searchKecamatans, searchKelurahans, searchMaster } from '../../../../api/authServices';
import { CHILD_OF, FIELDS, LABELS, SCAN_FIELDS, matchId, matchOpt, normName } from './konsumenForm';

export async function scanKtpToForm(file, master) {
  const data = await scanKtp(file);
  // OCR mengirim teks (nama wilayah, agama, pekerjaan); cocokkan ke ID master.
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
  pick('id_agama', master.agama, data.agama);
  pick('id_pekerjaan', master.pekerjaan, data.pekerjaan);
  pick('id_tmp_lahir', master.tempatLahir, data.tmp_lahir);
  let prov = pick('id_provinsi', master.provinsi, data.provinsi);
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
    kab = kabHit.id;
    found.id_kabupaten_kota = String(kab);
    if (!prov && kabHit.kode_provinsi) { // BE menghubungkan lewat kode; form konsumen menyimpan id
      prov = (await getProvinsis().catch(() => [])).find((p) => String(p.kode) === String(kabHit.kode_provinsi))?.id;
      if (prov) found.id_provinsi = String(prov);
    }
  } else if (kabTexts.length) {
    unmatched.push({ key: 'id_kabupaten_kota', label: LABELS.id_kabupaten_kota, text: kabTexts[0] });
  }
  const kecText = String(data.kecamatan ?? '').trim();
  // Kabupaten/kota tidak terbaca atau tidak cocok: cari kecamatannya di seluruh wilayah; bila namanya tepat satu, kabupaten & provinsinya diambil darinya
  if (!kab && kecText.length >= 3) {
    const hits = (await searchMaster('/kecamatans', kecText, undefined, 100).catch(() => [])).filter((r) => normName(r.name) === normName(kecText));
    const kabRow = hits.length === 1 ? (await getKabupatens().catch(() => [])).find((k) => String(k.kode) === String(hits[0].kode_kabupaten_kota)) : null;
    if (kabRow) {
      kab = kabRow.id;
      found.id_kabupaten_kota = String(kab);
      if (!prov && kabRow.kode_provinsi) {
        prov = (await getProvinsis().catch(() => [])).find((p) => String(p.kode) === String(kabRow.kode_provinsi))?.id;
        if (prov) found.id_provinsi = String(prov);
      }
    }
  }
  const kec = kab && kecText.length >= 3 ? pick('id_kecamatan', (await searchKecamatans(kecText, kab)).rows, kecText) : (skip('id_kecamatan', kecText), undefined);
  const kelText = String(data.desa_kelurahan ?? '').trim();
  if (kec && kelText.length >= 3) pick('id_kelurahan', (await searchKelurahans(kelText, kec)).rows, kelText);
  else skip('id_kelurahan', kelText);
  for (let i = unmatched.length - 1; i >= 0; i -= 1) if (unmatched[i].key in found) unmatched.splice(i, 1);
  FIELDS.filter((k) => !k.startsWith('id_') && data[k]).forEach((k) => { found[k] = String(data[k]); });

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
      kecamatan: unmatched.some((u) => u.key === 'id_kecamatan') && kab ? kecText : '',
      kelurahan: unmatched.some((u) => u.key === 'id_kelurahan') && kec ? kelText : '',
    },
    hints: Object.fromEntries(unmatched.map((u) => [u.key, u.text])),
    filled: Object.fromEntries(readable.map((k) => [k, true])),
    missing: Object.fromEntries(missing.map((k) => [k, true])),
    // Tandai kolom bermasalah agar pesan "wajib diisi" langsung terlihat
    touched: { nik: true, ...Object.fromEntries(unmatched.map((u) => [u.key, true])), ...Object.fromEntries(missing.map((k) => [k, true])) },
    note,
  };
}
