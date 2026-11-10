import { useEffect, useState } from 'react';
import {
  errorMessage, getAgamas, getPekerjaans, getProvinsis, getKabupatens, searchKecamatans, searchKelurahans, getMasterByKode, refreshMasterOptions,
} from '../../../api/authServices';

// Jeda setelah ketukan terakhir sebelum kecamatan/kelurahan dicari di BE (satu pencarian bisa mengambil banyak halaman)
const GEO_SEARCH_DELAY = 500;

// Kecamatan & kelurahan: BE belum menyaring per induk dan datanya ribuan, jadi dicari lewat nama (min. 3 huruf)
// lalu disaring menurut induknya. Pilihan yang sudah tersimpan selalu ikut tampil.
function useGeoSearch({ key, parentId, selectedId, path, search, term, reload, setMaster, setBusy, setCut, setFull, setNote }) {
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setBusy((b) => ({ ...b, [key]: true }));
      try {
        const [res, selected] = await Promise.all([
          parentId ? search(term, parentId, ctrl.signal) : { rows: [], truncated: false },
          selectedId ? getMasterByKode(path, selectedId).catch(() => null) : null,
        ]);
        if (!active) return;
        const found = res.rows;
        const list = selected && !found.some((o) => o.kode === selected.kode) ? [selected, ...found] : found;
        setMaster((m) => ({ ...m, [key]: list }));
        setCut((c) => ({ ...c, [key]: res.truncated }));
        setFull((f) => ({ ...f, [key]: !!res.full }));
      } catch (err) {
        if (active && err?.code !== 'ERR_CANCELED') setNote((n) => n || errorMessage(err));
      } finally {
        if (active) setBusy((b) => ({ ...b, [key]: false }));
      }
    }, term.length >= 3 ? GEO_SEARCH_DELAY : 0); // tunggu user berhenti mengetik; ganti induk/pilihan tanpa jeda
    // Cari ulang / menutup form: permintaan yang masih jalan dihentikan
    return () => { active = false; clearTimeout(timer); ctrl.abort(); };
  }, [parentId, selectedId, term, reload]); // eslint-disable-line react-hooks/exhaustive-deps
}

const NONE = { kecamatan: false, kelurahan: false };

export function useKonsumenMaster(form) {
  const [master, setMaster] = useState({ agama: [], pekerjaan: [], provinsi: [], kabupaten: [], kecamatan: [], kelurahan: [], tempatLahir: [] });
  const [masterNote, setMasterNote] = useState('');
  const [geoQuery, setGeoQuery] = useState({ kecamatan: '', kelurahan: '' }); // teks yang sedang diketik
  // Dropdown yang daftarnya sudah dimuat penuh (provinsi, kabupaten/kota, agama, pekerjaan): disaring langsung saat mengetik
  const [pickText, setPickText] = useState({});
  const [pickOpen, setPickOpen] = useState('');
  const [geoBusy, setGeoBusy] = useState(NONE);
  const [geoFull, setGeoFull] = useState(NONE); // daftar penuh milik induk sudah dimuat: tampil langsung, cukup disaring
  const [geoCut, setGeoCut] = useState(NONE); // hasil pencarian terpotong: minta kata kunci lebih spesifik
  // Kecamatan/kelurahan selalu tampil sebagai dropdown berisi semua data milik induknya (tanpa mengetik dulu).
  // Pencarian nama (min. 3 huruf) hanya dipakai bila daftar penuh induk tidak tersedia, dan berjalan otomatis tanpa tombol Cari.
  const geoTerm = Object.fromEntries(['kecamatan', 'kelurahan'].map((key) => {
    const typed = geoQuery[key].trim();
    return [key, !geoFull[key] && typed.length >= 3 ? typed : ''];
  }));

  useEffect(() => {
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
  }, []);

  // Kabupaten/kota: dimuat penuh lalu disaring menurut provinsi di FE
  useEffect(() => {
    let active = true;
    if (!form.fk_provinsi) return undefined;
    getKabupatens(form.fk_provinsi)
      .then((list) => { if (active) setMaster((m) => ({ ...m, kabupaten: list })); })
      .catch((err) => { if (active) setMasterNote((n) => n || errorMessage(err)); });
    return () => { active = false; };
  }, [form.fk_provinsi]);

  // Muat ulang daftar kecamatan/kelurahan (data baru bisa ditambahkan di tab lain lewat tautan "Tambah ...")
  const [reload, setReload] = useState({ kecamatan: 0, kelurahan: 0 });
  const reloadGeo = (key) => { refreshMasterOptions(key === 'kecamatan' ? '/kecamatans' : '/kelurahans'); setReload((r) => ({ ...r, [key]: r[key] + 1 })); };
  const emptyKey = `${!!form.fk_kabupaten_kota && master.kecamatan.length === 0}|${!!form.fk_kecamatan && master.kelurahan.length === 0}`;
  // Kembali ke tab ini dengan daftar masih kosong: otomatis dimuat ulang
  useEffect(() => {
    if (emptyKey === 'false|false') return undefined;
    const onFocus = () => { if (emptyKey.startsWith('true')) reloadGeo('kecamatan'); if (emptyKey.endsWith('true')) reloadGeo('kelurahan'); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [emptyKey]);

  const shared = { setMaster, setBusy: setGeoBusy, setCut: setGeoCut, setFull: setGeoFull, setNote: setMasterNote };
  useGeoSearch({ key: 'kecamatan', parentId: form.fk_kabupaten_kota, selectedId: form.fk_kecamatan, path: '/kecamatans', search: searchKecamatans, term: geoTerm.kecamatan, reload: reload.kecamatan, ...shared });
  useGeoSearch({ key: 'kelurahan', parentId: form.fk_kecamatan, selectedId: form.fk_kelurahan, path: '/kelurahans', search: searchKelurahans, term: geoTerm.kelurahan, reload: reload.kelurahan, ...shared });

  return {
    master: form.fk_provinsi ? master : { ...master, kabupaten: [] }, masterNote, geoQuery, setGeoQuery, pickText, setPickText, pickOpen, setPickOpen,
    geoBusy, geoFull, geoCut, reloadGeo,
  };
}
