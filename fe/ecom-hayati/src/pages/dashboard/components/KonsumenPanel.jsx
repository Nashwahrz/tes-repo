// src/pages/dashboard/components/KonsumenPanel.jsx
// UI konsumen (dokumen KTP): lihat, tambah, hapus. Data tidak bisa diedit; yang ditolak diinput ulang.
// Termasuk + OCR KTP, terhubung ke API /konsumens.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';
import KonsumenDetailView from './KonsumenDetailView';
import {
  getKonsumens, getKonsumenPage, getKonsumen, createKonsumen, updateKonsumen, deleteKonsumen, verifyKonsumen, scanKtp, checkNik, ktpUrl, errorMessage,
  getAgamas, getPekerjaans, getProvinsis, getKabupatens, searchKecamatans, searchKelurahans, searchMaster, getMasterById,
} from '../../../api/authServices';

// Leaflet (JS + CSS) hanya dimuat saat form dibuka
const MapPicker = lazy(() => import('./MapPicker'));

const STATUS_LABEL = { pending: 'Menunggu Verifikasi', diterima: 'Diterima', ditolak: 'Ditolak' };
const KAWIN = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

const EMPTY = {
  nik: '', name: '', id_tmp_lahir: '', tgl_lahir: '', jenis_kelamin: '', alamat: '', latitude: '', longitude: '', rt: '', rw: '',
  id_kelurahan: '', id_kecamatan: '', id_kabupaten_kota: '', id_provinsi: '', id_agama: '', status_perkawinan: '',
  id_pekerjaan: '', kewarganegaraan: 'WNI', no_telp: '', email: '',
};
// Wilayah berjenjang: mengganti induk mengosongkan turunannya
const CHILD_OF = { id_provinsi: ['id_kabupaten_kota', 'id_kecamatan', 'id_kelurahan'], id_kabupaten_kota: ['id_kecamatan', 'id_kelurahan'], id_kecamatan: ['id_kelurahan'] };

const GEO_KEY = { id_kecamatan: 'kecamatan', id_kelurahan: 'kelurahan' }; // kolom form yang dicari lewat nama
// Nama dari OCR (teks) dicocokkan ke opsi master tanpa awalan "Kota/Kabupaten" dan tanpa beda huruf
const normName = (t) => String(t ?? '').toLowerCase().replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?|kelurahan|kel\.?|desa|provinsi|prov\.?)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();
const nameOf = (options, id) => options.find((o) => String(o.id) === String(id))?.name ?? '';
// Jenis wilayah ("KOTA X" / "KAB. X") ikut dicocokkan bila ada di teks, karena nama yang sama bisa berupa kota sekaligus kabupaten (mis. Solok).
// Hasil hanya dipakai bila tepat satu yang cocok; bila ambigu dibiarkan agar user memilih sendiri.
const typeOf = (t) => (/^\s*kota\b/i.test(t) ? 'kota' : /^\s*(kab\.?|kabupaten)(\s|$)/i.test(t) ? 'kab' : '');
const matchOpt = (options, text) => {
  const n = normName(text);
  if (!n) return undefined;
  const type = typeOf(String(text));
  const hits = options.filter((o) => normName(o.name) === n && (!type || !typeOf(o.name) || typeOf(o.name) === type));
  return hits.length === 1 ? hits[0] : undefined;
};
const matchId = (options, text) => matchOpt(options, text)?.id;
const FIELDS = Object.keys(EMPTY);
const MAX_FILE = 2 * 1024 * 1024; // 2MB, sama dengan BE

// BE mengirim tgl_lahir sebagai ISO (UTC); ambil bagian tanggalnya saja
const toForm = (k) => Object.fromEntries(FIELDS.map((f) => {
  let v = k[f] ?? '';
  if (f === 'tgl_lahir' && v) v = String(v).slice(0, 10);
  return [f, String(v)];
}));

// Field yang tercetak di KTP; yang tidak terbaca oleh scan diberi peringatan di kolomnya
const SCAN_FIELDS = [
  'nik', 'name', 'id_tmp_lahir', 'tgl_lahir', 'jenis_kelamin', 'alamat', 'rt', 'rw', 'id_kelurahan', 'id_kecamatan',
  'id_kabupaten_kota', 'id_provinsi', 'id_agama', 'status_perkawinan', 'id_pekerjaan', 'kewarganegaraan',
];

// Label field untuk pesan wajib diisi
const LABELS = {
  nik: 'NIK', name: 'Nama', id_tmp_lahir: 'Tempat lahir', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat: 'Alamat', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW', id_kelurahan: 'Kelurahan/Desa',
  id_kecamatan: 'Kecamatan', id_kabupaten_kota: 'Kabupaten/Kota', id_provinsi: 'Provinsi', id_agama: 'Agama',
  status_perkawinan: 'Status perkawinan', id_pekerjaan: 'Pekerjaan', kewarganegaraan: 'Kewarganegaraan',
  no_telp: 'No. telp', email: 'Email',
};

// Validasi mengikuti be/app/Http/Requests/KonsumenRequest.php (semua field wajib)
function validate(form, file, needFoto) {
  const e = {};
  if (needFoto && !file) e.foto_ktp = 'Foto KTP wajib diunggah.';
  FIELDS.forEach((k) => {
    if (!String(form[k]).trim()) e[k] = `${LABELS[k]} wajib diisi.`;
  });
  if (!e.nik && !/^\d{16}$/.test(form.nik)) e.nik = 'NIK harus terdiri dari 16 digit angka.';
  if (!e.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Format email tidak valid.';
  [['latitude', 90], ['longitude', 180]].forEach(([k, max]) => {
    if (e[k]) return;
    const n = Number(form[k]);
    if (Number.isNaN(n) || Math.abs(n) > max) e[k] = `${LABELS[k]} harus berupa angka antara -${max} dan ${max}.`;
  });
  [['name', 255], ['alamat', 255], ['rt', 3], ['rw', 3], ['no_telp', 20]].forEach(([k, max]) => {
    if (!e[k] && form[k].length > max) e[k] = `Maksimal ${max} karakter.`;
  });
  return e;
}

// onChanged: dipanggil setelah data berubah (tambah/ubah/verifikasi/hapus) agar lencana di sidebar ikut diperbarui
// dealers & myDealerId: filter dealer tampil untuk semua role. Awalnya hanya konsumen dealer user sendiri; "Semua dealer" menampilkan lintas dealer.
function KonsumenPanel({ can, userId, onChanged, dealers = [], myDealerId = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dealerFilter, setDealerFilter] = useState(myDealerId != null ? String(myDealerId) : ''); // id dealer penginput; kosong = semua dealer
  const dealerPicked = useRef(false); // true setelah user memilih sendiri, agar bawaan tidak menimpa pilihan
  // Dealer user bisa baru diketahui setelah daftar akun termuat: jadikan bawaan selama belum memilih
  useEffect(() => {
    if (!dealerPicked.current && myDealerId != null) setDealerFilter(String(myDealerId));
  }, [myDealerId]);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null); // info halaman dari BE; null saat mencari (semua data dimuat)
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // konsumen yang sedang diubah (null = menambah baru)
  const [form, setForm] = useState(EMPTY);
  // Master dari BE: agama, pekerjaan, dan wilayah berjenjang; kosong bila belum termuat atau gagal (lihat masterNote)
  const [master, setMaster] = useState({ agama: [], pekerjaan: [], provinsi: [], kabupaten: [], kecamatan: [], kelurahan: [], tempatLahir: [] });
  const [masterNote, setMasterNote] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [touched, setTouched] = useState({});
  const [nikDup, setNikDup] = useState(null); // konsumen lain dengan NIK yang sama (hasil BE /konsumens/check-nik)
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [ocrFilled, setOcrFilled] = useState({}); // { kolom: true } terisi otomatis dari scan KTP dan belum diubah user; diberi pengingat periksa ulang
  const [ocrMissing, setOcrMissing] = useState({}); // { kolom: true } tidak terbaca oleh scan KTP; tampil di bawah kolomnya
  const [ocrHints, setOcrHints] = useState({}); // { kolom: teks hasil OCR yang tidak cocok dengan daftar }; tampil di bawah kolomnya
  const [confirmSave, setConfirmSave] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toVerify, setToVerify] = useState(null); // { konsumen, status: 'diterima' | 'ditolak' }
  const [catatan, setCatatan] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  // Detail ikut memakai data terbaru (URL foto baru) setelah daftar dimuat ulang
  const [detailFresh, setDetailFresh] = useState(null);
  const detail = detailRow ? { ...(rows.find((r) => r.id === detailRow.id) ?? detailRow), ...(detailFresh?.id === detailRow.id ? detailFresh : {}) } : null;
  const setDetail = setDetailRow;
  const fileRef = useRef(null);
  const scanNoteRef = useRef(null);

  // Muat satu halaman saat filter/halaman berubah atau reloadKey naik (setelah simpan).
 
  // Dealer konsumen = dealer penginputnya (relasi `me`); BE belum menyaring per dealer, jadi filter dijalankan di FE pada seluruh data
  const dealerOf = (k) => k.me?.id_dealer;
  const dealerName = (k) => dealers.find((d) => d.id === dealerOf(k))?.name;
  const searching = query.trim() !== '';
  const loadAll = searching || dealerFilter !== '';
  useEffect(() => {
    let active = true;
    const load = loadAll
      ? getKonsumens(filter).then((data) => ({ rows: dealerFilter ? data.filter((k) => String(dealerOf(k)) === dealerFilter) : data, meta: null }))
      : getKonsumenPage(filter, page);
    load
      .then((res) => {
        if (!active) return;
        // Halaman terakhir baru saja kosong (data dihapus): mundur ke halaman terakhir yang ada
        if (res.meta && res.rows.length === 0 && page > 1) {
          setPage(Math.max(res.meta.lastPage, 1));
          return;
        }
        setRows(res.rows);
        setMeta(res.meta);
        setError('');
        setLoading(false);
      })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [filter, dealerFilter, page, reloadKey, loadAll]);

  const reload = () => { setLoading(true); setReloadKey((n) => n + 1); };

  // BE hanya mengirim ID wilayah/agama/pekerjaan; namanya diambil per ID saat detail dibuka (hasilnya di-cache)
  const [detailNames, setDetailNames] = useState({});
  const detailId = detail?.id;
  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const refs = {
      tempatLahir: ['/kabupaten-kotas', detail.id_tmp_lahir], kelurahan: ['/kelurahans', detail.id_kelurahan],
      kecamatan: ['/kecamatans', detail.id_kecamatan], kabupaten: ['/kabupaten-kotas', detail.id_kabupaten_kota],
      provinsi: ['/provinsis', detail.id_provinsi], agama: ['/agamas', detail.id_agama], pekerjaan: ['/pekerjaans', detail.id_pekerjaan],
    };
    setDetailNames({});
    Promise.all(Object.entries(refs).map(async ([k, [path, id]]) => [k, (await getMasterById(path, id).catch(() => null))?.name]))
      .then((pairs) => { if (active) setDetailNames(Object.fromEntries(pairs)); });
    return () => { active = false; };
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Segarkan detail dari BE; gagal = pakai data daftar
  useEffect(() => {
    if (!detailId) return undefined;
    let active = true;
    getKonsumen(detailId).then((k) => active && setDetailFresh(k)).catch(() => {});
    return () => { active = false; setDetailFresh(null); };
  }, [detailId, reloadKey]);

  // URL foto dari BE kedaluwarsa dalam 10 menit: bila gambar gagal dimuat, ambil ulang daftar (paling sering sekali per 30 detik)
  const lastPhotoRefresh = useRef(0);
  const refreshExpiredPhotos = () => {
    if (Date.now() - lastPhotoRefresh.current < 30000) return;
    lastPhotoRefresh.current = Date.now();
    setReloadKey((n) => n + 1);
  };

  // Pratinjau foto yang baru dipilih; URL lama dilepas saat diganti, ditutup, atau panel ditinggalkan
  const previewRef = useRef('');

  // Hasil pindai muncul tepat di bawah tombol; pastikan terlihat walau form sedang di-scroll
  useEffect(() => {
    if (scanNote) scanNoteRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scanNote]);
  const setPicked = (f) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : '';
    setFile(f);
    setPreview(previewRef.current);
  };
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const errors = formOpen ? validate(form, file, !editing) : {};
  const hasError = Object.keys(errors).length > 0;
  const shownPreview = file ? preview : editing ? ktpUrl(editing) : '';

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((k) => `${k.name ?? ''} ${k.nik ?? ''} ${k.no_telp ?? ''}`.toLowerCase().includes(q))
    : rows;

  // prefill: data konsumen yang diubah; foto lama dipakai bila tidak memilih foto baru
  const openForm = (prefill) => {
    setEditing(prefill ?? null);
    setSuccess('');
    setError('');
    setTouched({});
    setScanNote('');
    setPicked(null);
    setForm(prefill ? toForm(prefill) : EMPTY);
    setGeoQuery({ kecamatan: '', kelurahan: '' });
    setGeoTerm({ kecamatan: '', kelurahan: '' });
    setPickText({});
    setOcrHints({});
    setOcrFilled({});
    setOcrMissing({});
    setFormOpen(true);
  };
  // NIK lengkap diperiksa ke BE agar duplikat ketahuan sebelum submit; gagal cek tidak menghalangi pengisian
  useEffect(() => {
    if (!formOpen || !/^\d{16}$/.test(form.nik)) { setNikDup(null); return undefined; }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      checkNik(form.nik, ctrl.signal)
        .then(({ list }) => setNikDup(list.find((k) => k.nik === form.nik && k.id !== editing?.id) ?? null))
        .catch(() => {});
    }, 400);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [form.nik, formOpen, editing]);

  const closeForm = () => { setFormOpen(false); setPicked(null); setEditing(null); };

  const handlePick = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setTouched((t) => ({ ...t, latitude: true, longitude: true }));
  };

  useEffect(() => {
    if (!formOpen) return;
    let active = true;
    Promise.allSettled([getAgamas(), getPekerjaans(), getProvinsis(), getKabupatens()]).then(([a, p, pv, kb]) => {
      if (!active) return;
      const failed = [['Agama', a], ['Pekerjaan', p], ['Provinsi', pv], ['Kabupaten/Kota', kb]].filter(([, r]) => r.status === 'rejected');
      failed.forEach(([label, r]) => console.warn(`Master ${label} gagal dimuat:`, r.reason));
      setMasterNote(failed.map(([label, r]) => `${label}: ${errorMessage(r.reason)}`).join(' · '));
      const val = (r) => (r.status === 'fulfilled' ? r.value : []);
      setMaster((m) => ({ ...m, agama: val(a), pekerjaan: val(p), provinsi: val(pv), tempatLahir: val(kb) }));
    });
    return () => { active = false; };
  }, [formOpen]);

  // Kabupaten/kota: dimuat penuh lalu disaring menurut provinsi di FE
  useEffect(() => {
    if (!formOpen) return undefined;
    let active = true;
    if (!form.id_provinsi) { setMaster((m) => (m.kabupaten.length ? { ...m, kabupaten: [] } : m)); return undefined; }
    getKabupatens(form.id_provinsi)
      .then((list) => { if (active) setMaster((m) => ({ ...m, kabupaten: list })); })
      .catch((err) => { if (active) setMasterNote((n) => n || errorMessage(err)); });
    return () => { active = false; };
  }, [formOpen, form.id_provinsi]);

  // Kecamatan & kelurahan: BE belum menyaring per induk dan datanya ribuan, jadi dicari lewat nama (min. 3 huruf)
  // lalu disaring menurut induknya. Pilihan yang sudah tersimpan selalu ikut tampil.
  const [geoQuery, setGeoQuery] = useState({ kecamatan: '', kelurahan: '' }); // teks yang sedang diketik
  const [geoTerm, setGeoTerm] = useState({ kecamatan: '', kelurahan: '' }); // kata kunci yang dicari (baru berubah saat user menekan Cari)
  // Dropdown yang daftarnya sudah dimuat penuh (provinsi, kabupaten/kota, agama, pekerjaan): disaring langsung saat mengetik
  const [pickText, setPickText] = useState({});
  const [pickOpen, setPickOpen] = useState('');
  const runGeoSearch = (key) => setGeoTerm((t) => ({ ...t, [key]: geoQuery[key].trim() }));
  const [geoBusy, setGeoBusy] = useState({ kecamatan: false, kelurahan: false });
  const [geoFull, setGeoFull] = useState({ kecamatan: false, kelurahan: false }); // daftar penuh milik induk sudah dimuat: tampil langsung, cukup disaring
  const [geoCut, setGeoCut] = useState({ kecamatan: false, kelurahan: false }); // hasil pencarian terpotong: minta kata kunci lebih spesifik
  // Jeda setelah ketukan terakhir sebelum kecamatan/kelurahan dicari di BE (satu pencarian bisa mengambil banyak halaman)
  const GEO_SEARCH_DELAY = 500;
  const useGeoSearch = (key, parentId, selectedId, path, search) => {
    const term = geoTerm[key];
    useEffect(() => {
      if (!formOpen) return undefined;
      let active = true;
      const ctrl = new AbortController();
      const timer = setTimeout(async () => {
        setGeoBusy((b) => ({ ...b, [key]: true }));
        try {
          const [res, selected] = await Promise.all([
            parentId ? search(term, parentId, ctrl.signal) : { rows: [], truncated: false },
            selectedId ? getMasterById(path, selectedId).catch(() => null) : null,
          ]);
          if (!active) return;
          const found = res.rows;
          const list = selected && !found.some((o) => o.id === selected.id) ? [selected, ...found] : found;
          setMaster((m) => ({ ...m, [key]: list }));
          setGeoCut((c) => ({ ...c, [key]: res.truncated }));
          setGeoFull((f) => ({ ...f, [key]: !!res.full }));
        } catch (err) {
          if (active && err?.code !== 'ERR_CANCELED') setMasterNote((n) => n || errorMessage(err));
        } finally {
          if (active) setGeoBusy((b) => ({ ...b, [key]: false }));
        }
      }, term.length >= 3 ? GEO_SEARCH_DELAY : 0); // tunggu user berhenti mengetik; ganti induk/pilihan tanpa jeda
      // Cari ulang / menutup form: permintaan yang masih jalan dihentikan
      return () => { active = false; clearTimeout(timer); ctrl.abort(); };
    }, [formOpen, parentId, selectedId, term]); // eslint-disable-line react-hooks/exhaustive-deps
  };
  useGeoSearch('kecamatan', form.id_kabupaten_kota, form.id_kecamatan, '/kecamatans', searchKecamatans);
  useGeoSearch('kelurahan', form.id_kecamatan, form.id_kelurahan, '/kelurahans', searchKelurahans);

  const setField = (key) => (e) => {
    const value = e.target.value;
    const children = CHILD_OF[key] ?? [];
    setForm((f) => ({ ...f, [key]: value, ...Object.fromEntries(children.map((c) => [c, ''])) }));
    const cleared = Object.fromEntries(children.filter((c) => c in GEO_KEY).map((c) => [GEO_KEY[c], '']));
    setGeoQuery((g) => ({ ...g, ...cleared }));
    setGeoTerm((g) => ({ ...g, ...cleared }));
    setPickText((t) => ({ ...t, ...Object.fromEntries(children.map((c) => [c, ''])) }));
    setTouched((t) => ({ ...t, [key]: true }));
    // diubah user = sudah diperiksa: pengingat hasil scan hilang (juga pada turunannya yang dikosongkan)
    setOcrFilled((o) => (key in o || children.some((c) => c in o) ? Object.fromEntries(Object.entries(o).filter(([k]) => k !== key && !children.includes(k))) : o));
    // peringatan OCR tetap tampil selama user mengetik; hilang setelah ada pilihan
    setOcrMissing((m) => (value && key in m ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== key)) : m));
    setOcrHints((h) => (value && key in h ? Object.fromEntries(Object.entries(h).filter(([k]) => k !== key)) : h));
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Format file harus JPG, JPEG, atau PNG.');
      return;
    }
    if (f.size > MAX_FILE) {
      setError('Ukuran file maksimal 2MB.');
      return;
    }
    setError('');
    setScanNote('');
    setPicked(f);
    setTouched((t) => ({ ...t, foto_ktp: true }));
  };

  // OCR: isi form dari hasil baca KTP; hanya field yang terbaca yang menimpa isian
  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    setError('');
    setScanNote('');
    setOcrHints({});
    setOcrFilled({});
    setOcrMissing({});
    try {
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
      // Hitung field terbaca di luar updater setForm (updater dijalankan React belum tentu langsung)
      const readable = Object.keys(found);
      // Induk baru dari OCR: turunan lama yang tidak ikut terbaca dikosongkan agar tidak tertinggal dari wilayah lain
      const cleared = Object.fromEntries(Object.keys({ ...found, ...Object.fromEntries(unmatched.map((u) => [u.key, 1])) }).flatMap((k) => (CHILD_OF[k] ?? []).filter((c) => !(c in found)).map((c) => [c, ''])));
      const wiped = Object.fromEntries(unmatched.map((u) => [u.key, '']));
      setForm((f) => ({ ...f, ...cleared, ...wiped, ...found }));
      // Kecamatan/kelurahan yang tidak cocok: kolom cari diisi teks OCR (bila induknya cocok) supaya user tinggal memilih atau mengubah ejaannya
      setGeoQuery({
        kecamatan: unmatched.some((u) => u.key === 'id_kecamatan') && kab ? kecText : '',
        kelurahan: unmatched.some((u) => u.key === 'id_kelurahan') && kec ? kelText : '',
      });
      setGeoTerm({ kecamatan: '', kelurahan: '' });
      // Tandai kolom bermasalah agar pesan "wajib diisi" langsung terlihat
      setTouched((t) => ({ ...t, nik: true, ...Object.fromEntries(unmatched.map((u) => [u.key, true])) }));
      setOcrHints(Object.fromEntries(unmatched.map((u) => [u.key, u.text])));
      setOcrFilled(Object.fromEntries(readable.map((k) => [k, true])));
      const missing = SCAN_FIELDS.filter((k) => !(k in found) && !unmatched.some((u) => u.key === k));
      setOcrMissing(Object.fromEntries(missing.map((k) => [k, true])));
      setTouched((t) => ({ ...t, ...Object.fromEntries(missing.map((k) => [k, true])) }));
      if (readable.length === 0) {
        setScanNote({ ok: false, text: 'KTP dipindai, tetapi tidak ada data yang terbaca. Isi data secara manual.' });
      } else if (unmatched.length || missing.length) {
        const issues = [
          unmatched.length && `${unmatched.length} data tidak cocok dengan daftar`,
          missing.length && `${missing.length} data tidak terbaca`,
        ].filter(Boolean).join(' dan ');
        setScanNote({ ok: false, text: `KTP dipindai: ${readable.length} data terisi otomatis, ${issues}. Lihat keterangan di bawah kolom yang bersangkutan dan periksa kembali semuanya.` });
      } else {
        setScanNote({ ok: true, text: `KTP berhasil dipindai: ${readable.length} data terisi otomatis. Periksa kembali hasilnya sebelum menyimpan.` });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries([...FIELDS, 'foto_ktp'].map((k) => [k, true])));
    if (hasError) {
      // Pesan kesalahan tiap kolom ada di dalam form; bawa kolom pertama yang salah ke layar
      const first = ['foto_ktp', ...FIELDS].find((k) => errors[k]);
      document.getElementById(`konsumen-${first}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setConfirmSave(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);
    const fd = new FormData();
    fd.append('id_me', editing?.id_me ?? userId);
    FIELDS.forEach((k) => {
      let v = String(form[k]).trim();
      // BE memakai aturan decimal:7 -> harus tepat 7 angka di belakang koma
      if (k === 'latitude' || k === 'longitude') v = Number(v).toFixed(7);
      fd.append(k, v);
    });
    if (file) fd.append('foto_ktp', file);

    setSaving(true);
    setError('');
    try {
      if (editing) await updateKonsumen(editing.id, fd);
      else await createKonsumen(fd);
      setSuccess(`Data konsumen ${form.name || form.nik || ''} ${editing ? 'diperbarui' : 'ditambahkan'}.`);
      closeForm();
      reload();
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openVerify = (konsumen, status) => {
    setCatatan('');
    setError('');
    setToVerify({ konsumen, status });
  };

  // Verifikasi (terima/tolak); BE mengembalikan konsumen terbaru
  const handleVerify = async () => {
    const { konsumen, status } = toVerify;
    const note = catatan.trim();
    if (status === 'ditolak' && !note) {
      setError('Catatan penolakan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await verifyKonsumen(konsumen.id, status, note);
      // Bila sedang memfilter status tertentu, baris yang statusnya berubah keluar dari daftar
      setRows((list) => list
        .map((k) => (k.id === konsumen.id ? res.data : k))
        .filter((k) => !filter || k.status === filter));
      setSuccess(`Data konsumen ${konsumen.name || konsumen.nik || ''} ${status === 'diterima' ? 'diterima' : 'ditolak'}.`);
      setToVerify(null);
      setDetail(null);
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteKonsumen(toDelete.id);
      setRows((list) => list.filter((k) => k.id !== toDelete.id));
      setSuccess(`Data konsumen ${toDelete.name || toDelete.nik || ''} dihapus.`);
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  const field = (key, label, props = {}) => {
    const cls = `dash-input${touched[key] && errors[key] ? ' invalid' : ''}`;
    const id = `konsumen-${key}`;
    const selected = props.options?.find((o) => o.toLowerCase() === String(form[key]).trim().toLowerCase());
    return (
      <div className="dash-form-group">
        <label htmlFor={id}>{label} *</label>
        {props.idOptions ? (
          // Opsi master [{ id, name }]; yang tersimpan adalah ID-nya. searchKey: opsi diisi lewat pencarian nama (min. 3 huruf)
          props.searchKey ? (() => {
            // Satu kolom: daftar milik induk tampil langsung dan disaring saat mengetik. Bila daftar penuh tidak tersedia,
            // ketik nama, klik Cari, lalu pilih dari saran. Nama yang persis sama langsung terpilih.
            const sk = props.searchKey;
            const full = geoFull[sk];
            const typed = geoQuery[sk].trim().toLowerCase();
            const shown = full && typed ? props.idOptions.filter((o) => o.name.toLowerCase().includes(typed)) : props.idOptions;
            return (
            <>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  id={id} data-testid={id}
                  className={cls}
                  type="text"
                  autoComplete="off"
                  value={form[key] ? (props.idOptions.find((o) => String(o.id) === String(form[key]))?.name ?? geoQuery[props.searchKey]) : geoQuery[props.searchKey]}
                  onChange={(e) => {
                    const text = e.target.value;
                    const hit = props.idOptions.find((o) => o.name.toLowerCase() === text.trim().toLowerCase());
                    setField(key)({ target: { value: hit ? String(hit.id) : '' } });
                    setGeoQuery((g) => ({ ...g, [props.searchKey]: text }));
                  }}
                  // Enter = Cari (bukan menyimpan form)
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!form[key] && geoQuery[props.searchKey].trim().length >= 3) runGeoSearch(props.searchKey); } }}
                  placeholder={props.disabled ? props.hint : full ? `Pilih atau ketik untuk menyaring ${label.toLowerCase()}` : `Ketik min. 3 huruf nama ${label.toLowerCase()}, lalu klik Cari`}
                  disabled={props.disabled}
                />
                {full ? (geoBusy[sk] && <Spin />) : (
                  <button id={`btn-konsumen-search-${sk}`} data-testid={`btn-konsumen-search-${sk}`}
                    type="button"
                    className="dash-btn outline"
                    onClick={() => runGeoSearch(sk)}
                    disabled={props.disabled || geoBusy[sk] || geoQuery[sk].trim().length < 3}
                  >
                    {geoBusy[sk] ? <Spin /> : 'Cari'}
                  </button>
                )}
              </div>
              {!props.disabled && !form[key] && !geoBusy[sk] && (full || geoTerm[sk].length >= 3) && (
                <p className="dash-field-hint" style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
                  {shown.length === 0
                    ? (geoCut[sk] ? 'Terlalu banyak hasil, ketik lebih spesifik' : 'Tidak ditemukan di wilayah ini')
                    : `${shown.length} ${full ? `${label.toLowerCase()} di wilayah ini` : 'hasil'} — pilih salah satu`}
                </p>
              )}
              {!props.disabled && !form[key] && !geoBusy[sk] && shown.length > 0 && (
                <ul className="dash-geo-list" role="listbox" aria-label={label}>
                  {shown.map((o) => (
                    <li key={o.id}>
                      <button id={`btn-konsumen-option-${key}-${o.id}`} data-testid={`btn-konsumen-option-${key}-${o.id}`} type="button" role="option" onClick={() => setField(key)({ target: { value: String(o.id) } })}>{o.name}</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
            );
          })() : (
            // Satu kolom: klik/ketik untuk menyaring daftar, lalu pilih salah satu
            <>
              <input
                id={id} data-testid={id}
                className={cls}
                type="text"
                autoComplete="off"
                value={form[key] ? (props.idOptions.find((o) => String(o.id) === String(form[key]))?.name ?? '') : (pickText[key] ?? '')}
                onChange={(e) => {
                  setPickText((t) => ({ ...t, [key]: e.target.value }));
                  if (form[key]) setField(key)({ target: { value: '' } });
                  setPickOpen(key);
                }}
                onFocus={(e) => { setPickOpen(key); if (form[key]) e.target.select(); }}
                onBlur={() => setPickOpen((k) => (k === key ? '' : k))}
                placeholder={props.disabled ? props.hint : `Cari / pilih ${label.toLowerCase()}`}
                disabled={props.disabled}
              />
              {pickOpen === key && !props.disabled && !form[key] && (() => {
                const q = (pickText[key] ?? '').trim().toLowerCase();
                const list = props.idOptions.filter((o) => o.name.toLowerCase().includes(q));
                return (
                  <ul className="dash-geo-list" role="listbox" aria-label={label}>
                    {list.length === 0 && <li className="dash-geo-empty">Tidak ditemukan</li>}
                    {list.map((o) => (
                      <li key={o.id}>
                        {/* mousedown dicegah agar kolom tidak blur sebelum klik terbaca */}
                        <button id={`btn-konsumen-option-${key}-${o.id}`} data-testid={`btn-konsumen-option-${key}-${o.id}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => { setField(key)({ target: { value: String(o.id) } }); setPickOpen(''); }}>{o.name}</button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </>
          )
        ) : props.options ? (
          <select id={id} data-testid={id} className={cls} value={selected ?? form[key]} onChange={setField(key)} disabled={props.disabled}>
            <option value="">- Pilih -</option>
            {/* Nilai yang belum ada di daftar (hasil OCR/data lama) tetap ditampilkan */}
            {(form[key] && !selected ? [form[key], ...props.options] : props.options).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            id={id} data-testid={id}
            className={cls}
            type={props.type || 'text'}
            value={form[key]}
            onChange={setField(key)}
            placeholder={props.placeholder}
            inputMode={props.numeric ? 'numeric' : undefined}
            maxLength={props.max}
          />
        )}
        {ocrHints[key] && !form[key] && (
          <p data-testid="field-error" className="dash-field-error" role="alert">
            Hasil scan KTP: "{ocrHints[key]}" tidak ada di daftar. Ketik ulang{props.searchKey ? ' lalu klik Cari' : ''} atau pilih manual.
          </p>
        )}
        {ocrMissing[key] && !form[key] && (
          <p data-testid="field-error" className="dash-field-error" role="alert">Tidak terbaca dari scan KTP. Isi manual sesuai KTP.</p>
        )}
        {ocrFilled[key] && form[key] && (
          <p className="dash-field-warn">Terbaca dari scan KTP, mohon cek lagi dan pastikan sesuai dengan KTP.</p>
        )}
        {touched[key] && errors[key] && !((ocrHints[key] || ocrMissing[key]) && !form[key]) && <p data-testid="field-error" className="dash-field-error">{errors[key]}</p>}
      </div>
    );
  };

  const statusTag = (s) => <span className={`dash-status ${s}`}>{STATUS_LABEL[s] ?? s}</span>;

  const closeDetail = () => { setDetail(null); setToVerify(null); };

  return (
    <div>
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {detail ? (
        <KonsumenDetailView
          detail={detail}
          names={detailNames}
          dealerName={dealerName(detail)}
          statusNode={statusTag(detail.status)}
          canEdit={can.ubah}
          canVerify={can.verifikasi}
          verify={toVerify ? { status: toVerify.status, catatan, onCatatan: setCatatan, saving, own: toVerify.konsumen.id_me === userId, onConfirm: handleVerify, onCancel: () => setToVerify(null) } : null}
          onVerify={(status) => openVerify(detail, status)}
          onEdit={(k) => { closeDetail(); openForm(k); }}
          onBack={closeDetail}
          onPhotoError={refreshExpiredPhotos}
        />
      ) : (<>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><circle cx="16" cy="11" r="1.5" /></svg>
          Data Konsumen
        </h3>
        {can.tambah && <button id="btn-konsumen-add" data-testid="btn-konsumen-add" className="dash-btn solid" onClick={() => openForm()}>+ Tambah Konsumen</button>}
      </div>
      <p className="dash-card-desc">Kelola dokumen KTP konsumen. Unggah foto KTP lalu pindai dengan OCR untuk mengisi data otomatis.</p>

      <div className="dash-toolbar">
        <input data-testid="konsumen-search"
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, NIK, atau no. telp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select data-testid="konsumen-filter-status" className="dash-input dash-select-filter" value={filter} onChange={(e) => { setLoading(true); setPage(1); setFilter(e.target.value); }}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(dealers.length > 0 || myDealerId != null) && (
          <select data-testid="konsumen-filter-dealer" className="dash-input dash-select-filter" value={dealerFilter} aria-label="Filter dealer" onChange={(e) => { dealerPicked.current = true; setLoading(true); setPage(1); setDealerFilter(e.target.value); }}>
            <option value="">Semua dealer</option>
            {/* Role tanpa akses daftar dealer (mis. ME) hanya mendapat pilihan dealernya sendiri */}
            {dealers.length > 0
              ? dealers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.id === myDealerId ? ' (dealer Anda)' : ''}</option>)
              : <option value={myDealerId}>Dealer saya</option>}
          </select>
        )}
      </div>


      {loading ? (
        <Loading rows={5} />
      ) : visible.length === 0 ? (
        <p className="dash-empty">{q || filter ? 'Konsumen tidak ditemukan.' : 'Belum ada data konsumen.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table konsumen-table">
            <thead>
              <tr>
                <th>Konsumen</th>
                <th className="col-telp">No. Telp</th>
                <th className="col-status">Status</th>
                {can.verifikasi && <th>Verifikasi</th>}
                <th className="col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((k) => (
                <tr key={k.id} className={k.status === 'ditolak' ? 'row-rejected' : undefined}>
                  <td>
                    <strong className="dash-cell-name">{k.name || '-'}</strong>
                    <small className="dash-cell-sub">NIK {k.nik || '-'}{dealerName(k) && ` · ${dealerName(k)}`}</small>
                  </td>
                  <td>{k.no_telp || '-'}</td>
                  <td>
                    {statusTag(k.status)}
                  </td>
                  {can.verifikasi && (
                    <td>
                      {k.status === 'pending' ? (
                        <div className="dash-verify">
                          <IconButton id={`btn-konsumen-accept-${k.id}`} data-testid={`btn-konsumen-accept-${k.id}`} icon="check" label="Terima" tone="ok" onClick={() => openVerify(k, 'diterima')} />
                          <IconButton id={`btn-konsumen-reject-${k.id}`} data-testid={`btn-konsumen-reject-${k.id}`} icon="close" label="Tolak" tone="danger" onClick={() => openVerify(k, 'ditolak')} />
                        </div>
                      ) : (
                        <span className="acc-muted">-</span>
                      )}
                    </td>
                  )}
                  <td className="col-aksi">
                    <div className="dash-actions">
                      <IconButton id={`btn-konsumen-detail-${k.id}`} data-testid={`btn-konsumen-detail-${k.id}`} icon="view" label="Detail" onClick={() => setDetail(k)} />
                      {can.hapus && <IconButton id={`btn-konsumen-delete-${k.id}`} data-testid={`btn-konsumen-delete-${k.id}`} icon="delete" label="Hapus" tone="danger" onClick={() => setToDelete(k)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="konsumen" onPage={(p) => { setLoading(true); setPage(p); }} />
      )}

      </>)}

      {formOpen && (
        <div className="dash-modal-bg">
          <form className="dash-modal wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <div className="dash-modal-head">
              <h3>{editing ? 'Ubah Konsumen' : 'Tambah Konsumen'}</h3>
              <button id="btn-konsumen-form-close" data-testid="btn-konsumen-form-close" type="button" className="dash-modal-close" onClick={closeForm} aria-label="Tutup" title="Tutup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            <div className="dash-form-group" id="konsumen-foto_ktp">
              <label>Foto KTP{!editing && ' *'}</label>
              {shownPreview && <img className="dash-ktp-big" src={shownPreview} alt="Pratinjau KTP" />}
              <input data-testid="konsumen-ktp-file" ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleFile} />
              <div className="dash-actions">
                <button id="btn-konsumen-upload-ktp" data-testid="btn-konsumen-upload-ktp" type="button" className="dash-btn outline" onClick={() => fileRef.current?.click()}>
                  {shownPreview ? 'Ganti Foto' : 'Pilih Foto KTP'}
                </button>
                {can.scan && (
                  <button id="btn-konsumen-scan" data-testid="btn-konsumen-scan" type="button" className="dash-btn soft" onClick={handleScan} disabled={!file || scanning}>
                    {scanning ? <><Spin />Memindai...</> : 'Pindai KTP (OCR)'}
                  </button>
                )}
              </div>
              {scanNote && (
                <p ref={scanNoteRef} className={`dash-alert dash-alert-big ${scanNote.ok ? 'yellow' : 'warning'}`} role="status">
                  <strong>{scanNote.ok ? '✓' : '!'}</strong> {scanNote.text}
                </p>
              )}
              <p className="dash-map-hint">JPG/PNG, maksimal 2MB.{editing && ' Kosongkan bila foto tidak diganti.'}{can.scan && ' Pilih foto baru untuk memakai OCR.'}</p>
              {touched.foto_ktp && errors.foto_ktp && <p data-testid="field-error" className="dash-field-error">{errors.foto_ktp}</p>}
            </div>

            {field('nik', 'NIK', { placeholder: '16 digit angka', numeric: true, max: 16 })}
            {nikDup && (
              <p className="dash-alert warning" role="status">
                <strong>!</strong> NIK ini sudah terdaftar atas nama <strong>{nikDup.name || '-'}</strong>. Periksa kembali sebelum menyimpan.
              </p>
            )}
            {field('name', 'Nama Lengkap')}
            <div className="dash-form-row">
              {field('id_tmp_lahir', 'Tempat Lahir', { idOptions: master.tempatLahir })}
              {field('tgl_lahir', 'Tanggal Lahir', { type: 'date' })}
            </div>
            <div className="dash-form-row">
              {field('jenis_kelamin', 'Jenis Kelamin', { options: ['Laki-laki', 'Perempuan'] })}
              {field('id_agama', 'Agama', { idOptions: master.agama })}
            </div>
            {field('alamat', 'Alamat')}
            <div className="dash-form-group">
              <label>Lokasi di Peta *</label>
              <Suspense fallback={<div className="dash-map" />}>
                <MapPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onPick={handlePick}
                  desa={nameOf(master.kelurahan, form.id_kelurahan)}
                  kabupaten={nameOf(master.kabupaten, form.id_kabupaten_kota)}
                  kecamatan={nameOf(master.kecamatan, form.id_kecamatan)}
                  provinsi={nameOf(master.provinsi, form.id_provinsi)}
                />
              </Suspense>
              <p className="dash-map-hint">Cari alamat, klik peta, atau geser marker untuk menentukan titik lokasi konsumen.</p>
            </div>
            <div className="dash-form-row">
              {field('latitude', 'Latitude', { numeric: true, placeholder: '-0.9471000' })}
              {field('longitude', 'Longitude', { numeric: true, placeholder: '100.4172000' })}
            </div>
            <div className="dash-form-row">
              {field('rt', 'RT', { max: 3, numeric: true })}
              {field('rw', 'RW', { max: 3, numeric: true })}
            </div>
            <div className="dash-form-row">
              {field('id_provinsi', 'Provinsi', { idOptions: master.provinsi })}
              {field('id_kabupaten_kota', 'Kabupaten / Kota', { idOptions: master.kabupaten, disabled: !form.id_provinsi, hint: 'Pilih provinsi dulu' })}
            </div>
            <div className="dash-form-row">
              {field('id_kecamatan', 'Kecamatan', { idOptions: master.kecamatan, searchKey: 'kecamatan', disabled: !form.id_kabupaten_kota, hint: 'Pilih kabupaten/kota dulu' })}
            </div>
            <div className="dash-form-row">
              {field('id_kelurahan', 'Kelurahan / Desa', { idOptions: master.kelurahan, searchKey: 'kelurahan', disabled: !form.id_kecamatan, hint: 'Pilih kecamatan dulu' })}
            </div>
            <div className="dash-form-row">
              {field('status_perkawinan', 'Status Perkawinan', { options: KAWIN })}
              {field('id_pekerjaan', 'Pekerjaan', { idOptions: master.pekerjaan })}
            </div>
            {masterNote && <p className="dash-map-hint">Sebagian daftar master dari server tidak dapat dimuat. {masterNote}</p>}
            {field('kewarganegaraan', 'Kewarganegaraan', { options: ['WNI', 'WNA'] })}
            <div className="dash-form-row">
              {field('no_telp', 'No. Telp', { numeric: true, max: 20 })}
              {field('email', 'Email', { type: 'email' })}
            </div>

            <div className="dash-modal-actions">
              <button id="btn-konsumen-cancel" data-testid="btn-konsumen-cancel" type="button" className="dash-btn outline" onClick={closeForm}>Batal</button>
              <button id="btn-konsumen-save" data-testid="btn-konsumen-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmSave && (
        <ConfirmModal
          title={editing ? 'Simpan Perubahan' : 'Tambah Konsumen'}
          confirmLabel={editing ? 'Ya, Simpan' : 'Ya, Tambah'}
          onConfirm={handleSave}
          onCancel={() => setConfirmSave(false)}
        >
          <p className="dash-card-desc">
            Yakin ingin {editing ? 'menyimpan perubahan data' : 'menambahkan'} konsumen <strong>{form.name.trim() || form.nik || 'ini'}</strong>?
          </p>
        </ConfirmModal>
      )}

      {toVerify && !detail && (
        <ConfirmModal
          title={toVerify.status === 'diterima' ? 'Terima Konsumen' : 'Tolak Konsumen'}
          confirmLabel={toVerify.status === 'diterima' ? 'Ya, Terima' : 'Ya, Tolak'}
          busyLabel="Memproses..."
          busy={saving}
          confirmDisabled={toVerify.status === 'ditolak' && !catatan.trim()}
          onConfirm={handleVerify}
          onCancel={() => setToVerify(null)}
        >
          <p className="dash-card-desc">
            {toVerify.status === 'diterima'
              ? <>Yakin menerima data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong>? Pastikan data dan foto KTP sudah diperiksa.</>
              : <>Data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong> akan ditolak. Tulis alasan penolakan agar penginput dapat memperbaikinya.</>}
          </p>
          {toVerify.konsumen.id_me === userId && (
            <p className="dash-alert warning" role="alert">
              <strong>!</strong> Data ini diinput oleh Anda sendiri. Apakah Anda yakin ingin {toVerify.status === 'diterima' ? 'menerima' : 'menolak'} data tersebut?
            </p>
          )}
          {toVerify.status === 'ditolak' && (
            <div className="dash-form-group">
              <label htmlFor="konsumen-catatan">Catatan penolakan *</label>
              <textarea
                id="konsumen-catatan" data-testid="konsumen-catatan"
                className="dash-input"
                rows={3}
                maxLength={255}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Foto KTP buram, NIK tidak sesuai"
                autoFocus
              />
              <small className="dash-map-hint">{catatan.length}/255</small>
            </div>
          )}
        </ConfirmModal>
      )}

      {toDelete && (
        <ConfirmModal title="Hapus Konsumen" confirmLabel="Ya, Hapus" busy={saving} onConfirm={handleDelete} onCancel={() => setToDelete(null)}>
          <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name || toDelete.nik || 'konsumen ini'}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default KonsumenPanel;
