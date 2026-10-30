import { useEffect, useState } from 'react';
import {
  errorMessage, getAgamas, getPekerjaans, getProvinsis, getKabupatens, searchKecamatans, searchKelurahans, getMasterById,
} from '../../../../api/authServices';

// Jeda setelah ketukan terakhir sebelum kecamatan/kelurahan dicari di BE (satu pencarian bisa mengambil banyak halaman)
const GEO_SEARCH_DELAY = 500;

// Kecamatan & kelurahan: BE belum menyaring per induk dan datanya ribuan, jadi dicari lewat nama (min. 3 huruf)
// lalu disaring menurut induknya. Pilihan yang sudah tersimpan selalu ikut tampil.
function useGeoSearch({ key, parentId, selectedId, path, search, term, setMaster, setBusy, setCut, setFull, setNote }) {
  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setBusy((b) => ({ ...b, [key]: true }));
      try {
        const [res, selected] = await Promise.all([
          parentId ? search(term, parentId, ctrl.signal) : { rows: [], truncated: false },
          selectedId ? getMasterById(path, selectedId).catch(() => null) : null,
        ]);
        if (!active) return;
        const found = res.rows;
        const list = selected && !found.some((o) => o.id === selected.id) ? [selected, ...found] : found;
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
  }, [parentId, selectedId, term]); // eslint-disable-line react-hooks/exhaustive-deps
}

const NONE = { kecamatan: false, kelurahan: false };

export function useKonsumenMaster(form) {
  const [master, setMaster] = useState({ agama: [], pekerjaan: [], provinsi: [], kabupaten: [], kecamatan: [], kelurahan: [], tempatLahir: [] });
  const [masterNote, setMasterNote] = useState('');
  const [geoQuery, setGeoQuery] = useState({ kecamatan: '', kelurahan: '' }); // teks yang sedang diketik
  const [geoTerm, setGeoTerm] = useState({ kecamatan: '', kelurahan: '' }); // kata kunci yang dicari (baru berubah saat user menekan Cari)
  // Dropdown yang daftarnya sudah dimuat penuh (provinsi, kabupaten/kota, agama, pekerjaan): disaring langsung saat mengetik
  const [pickText, setPickText] = useState({});
  const [pickOpen, setPickOpen] = useState('');
  const [geoBusy, setGeoBusy] = useState(NONE);
  const [geoFull, setGeoFull] = useState(NONE); // daftar penuh milik induk sudah dimuat: tampil langsung, cukup disaring
  const [geoCut, setGeoCut] = useState(NONE); // hasil pencarian terpotong: minta kata kunci lebih spesifik
  const runGeoSearch = (key) => setGeoTerm((t) => ({ ...t, [key]: geoQuery[key].trim() }));

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
    if (!form.id_provinsi) return undefined;
    getKabupatens(form.id_provinsi)
      .then((list) => { if (active) setMaster((m) => ({ ...m, kabupaten: list })); })
      .catch((err) => { if (active) setMasterNote((n) => n || errorMessage(err)); });
    return () => { active = false; };
  }, [form.id_provinsi]);

  const shared = { setMaster, setBusy: setGeoBusy, setCut: setGeoCut, setFull: setGeoFull, setNote: setMasterNote };
  useGeoSearch({ key: 'kecamatan', parentId: form.id_kabupaten_kota, selectedId: form.id_kecamatan, path: '/kecamatans', search: searchKecamatans, term: geoTerm.kecamatan, ...shared });
  useGeoSearch({ key: 'kelurahan', parentId: form.id_kecamatan, selectedId: form.id_kelurahan, path: '/kelurahans', search: searchKelurahans, term: geoTerm.kelurahan, ...shared });

  return {
    master: form.id_provinsi ? master : { ...master, kabupaten: [] }, masterNote, geoQuery, setGeoQuery, geoTerm, setGeoTerm, pickText, setPickText, pickOpen, setPickOpen,
    geoBusy, geoFull, geoCut, runGeoSearch,
  };
}
