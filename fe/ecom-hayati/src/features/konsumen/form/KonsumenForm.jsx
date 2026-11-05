import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import Modal from '../../../shared/components/Modal';
import { Spin } from '../../../shared/components/Loading';
import KonsumenField from './KonsumenField';
import { useKonsumenMaster } from './useKonsumenMaster';
import { scanKtpToForm } from './ktpScan';
import { checkPhoto } from './ktpCheck';
import { compressImage } from '../../../utils/compressImage';
import { createKonsumen, updateKonsumen, checkNik, ktpUrl, errorMessage } from '../../../api/authServices';
import { CHILD_OF, EMPTY, FIELDS, GEO_KEY, KAWIN, LABELS, MAX_FILE, MAX_PICK, TARGET_FILE, nameOf, toForm, validate } from './konsumenFormConfig';

// Leaflet (JS + CSS) hanya dimuat saat form dibuka
const MapPicker = lazy(() => import('../../../shared/map/MapPicker'));

const without = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

function KonsumenForm({ editing, can, onClose, onSaved, onError }) {
  const [form, setForm] = useState(() => (editing ? toForm(editing) : EMPTY));
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [nikList, setNikList] = useState([]); // konsumen terdaftar yang NIK-nya cocok dengan yang diketik
  const [pickedRecord, setPickedRecord] = useState(null); // konsumen terdaftar yang datanya diambil ke form (acuan untuk mendeteksi perubahan)
  const [pickedNik, setPickedNik] = useState(''); // NIK yang datanya sudah diambil dari daftar (daftar disembunyikan)
  const [nikDup, setNikDup] = useState(null); // konsumen lain dengan NIK yang sama (hasil BE /konsumens/check-nik)
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressNote, setCompressNote] = useState('');
  const [scanNote, setScanNote] = useState('');
  const [photoWarn, setPhotoWarn] = useState([]); // peringatan kualitas foto (arah, buram) sebelum dipindai
  const [ktpCheck, setKtpCheck] = useState('unchecked'); // hasil validasi KTP lewat OCR: unchecked | valid | invalid | override
  const [ocrFilled, setOcrFilled] = useState({}); // { kolom: true } terisi otomatis dari scan KTP dan belum diubah user; diberi pengingat periksa ulang
  const [ocrMissing, setOcrMissing] = useState({}); // { kolom: true } tidak terbaca oleh scan KTP; tampil di bawah kolomnya
  const [ocrHints, setOcrHints] = useState({}); // { kolom: teks hasil OCR yang tidak cocok dengan daftar }; tampil di bawah kolomnya
  const [confirmSave, setConfirmSave] = useState(false);
  const [ktpWarn, setKtpWarn] = useState(false); // peringatan: foto baru belum diperiksa sebagai KTP
  const fileRef = useRef(null);
  const pageRef = useRef(null);
  useEffect(() => { pageRef.current?.scrollIntoView({ block: 'start' }); }, []); // halaman penuh: mulai dari atas
  const scanNoteRef = useRef(null);
  const geo = useKonsumenMaster(form);
  const { master, masterNote, setGeoQuery, setPickText } = geo;

  // Pratinjau foto; URL lama dilepas saat diganti atau form ditutup
  const previewRef = useRef('');
  const setPicked = (f) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : '';
    setFile(f);
    setPreview(previewRef.current);
  };
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  useEffect(() => {
    if (scanNote) scanNoteRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [scanNote]);

  // NIK (min. 12 digit) dicari ke BE: daftar NIK yang cocok ditampilkan untuk dipilih, dan NIK lengkap yang sama persis ditandai duplikat; gagal cek tidak menghalangi pengisian
  useEffect(() => {
    if (!/^\d{12,16}$/.test(form.nik)) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      checkNik(form.nik, ctrl.signal)
        .then(({ list }) => {
          const others = list.filter((k) => String(k.nik).startsWith(form.nik) && k.id !== editing?.id);
          setNikList(others);
          setNikDup(others.find((k) => k.nik === form.nik) ?? null);
        })
        .catch(() => {});
    }, 400);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [form.nik, editing]);

  // Konsumen terdaftar dipilih dari daftar: datanya diambil ke form (user tetap bebas mengubah)
  const pickKonsumen = (k) => {
    setForm((f) => ({ ...f, ...toForm(k) }));
    setPickedRecord(k);
    setPickedNik(String(k.nik));
    setOcrFilled({});
    setOcrMissing({});
    setOcrHints({});
    setScanNote({ ok: true, text: `Data konsumen ${k.name || '-'} (NIK ${k.nik}) diambil ke form. Periksa kembali sebelum menyimpan.` });
  };
  const showNikList = !editing && /^\d{12,16}$/.test(form.nik) && nikList.length > 0 && pickedNik !== form.nik && nikList.every((k) => String(k.nik).startsWith(form.nik));
  const shownNikDup = /^\d{16}$/.test(form.nik) ? nikDup : null;

  // NIK yang sudah terdaftar: BE memakai foto KTP yang ada bila tidak ada foto baru
  const baseErrors = validate(form, file, !editing && !shownNikDup);
  // Foto yang sudah dipindai dan tidak terdeteksi sebagai KTP menahan penyimpanan, kecuali pemakai memilih tetap memakainya
  const errors = ktpCheck === 'invalid' && file ? { ...baseErrors, foto_ktp: 'Foto tidak terdeteksi sebagai KTP. Ganti foto, atau pilih "Tetap gunakan foto ini" bila yakin itu KTP.' } : baseErrors;
  const hasError = Object.keys(errors).length > 0;
  // Data konsumen terdaftar yang diambil: BE tidak meminta verifikasi ulang bila data sama persis (tanpa foto baru, tanpa kolom berubah)
  // dan konsumen itu sudah pernah diterima. Perubahan sekecil apa pun (termasuk foto baru) dianggap data baru dan menunggu verifikasi.
  const reuse = !editing && pickedRecord && form.nik === String(pickedRecord.nik) ? pickedRecord : null;
  const reuseBase = reuse ? toForm(reuse) : null;
  const changedKeys = reuse ? FIELDS.filter((k) => String(form[k]).trim() !== reuseBase[k].trim()) : [];
  const shownPreview = file ? preview : editing || reuse ? ktpUrl(editing || reuse) : '';

  const handlePick = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setTouched((t) => ({ ...t, latitude: true, longitude: true }));
  };

  const setField = (key) => (e) => {
    let value = e.target.value;
    // No. telp: hanya angka, dan + hanya di awal
    if (key === 'no_telp') value = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    const children = CHILD_OF[key] ?? [];
    setForm((f) => ({ ...f, [key]: value, ...Object.fromEntries(children.map((c) => [c, ''])) }));
    const cleared = Object.fromEntries(children.filter((c) => c in GEO_KEY).map((c) => [GEO_KEY[c], '']));
    setGeoQuery((g) => ({ ...g, ...cleared }));
    setPickText((t) => ({ ...t, ...Object.fromEntries(children.map((c) => [c, ''])) }));
    setTouched((t) => ({ ...t, [key]: true }));
    // diubah user = sudah diperiksa: pengingat hasil scan hilang (juga pada turunannya yang dikosongkan)
    setOcrFilled((o) => (key in o || children.some((c) => c in o) ? without(o, [key, ...children]) : o));
    // peringatan OCR tetap tampil selama user mengetik; hilang setelah ada pilihan
    setOcrMissing((m) => (value && key in m ? without(m, [key]) : m));
    setOcrHints((h) => (value && key in h ? without(h, [key]) : h));
  };

  const handleFile = async (e) => {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    if (!['image/jpeg', 'image/png'].includes(original.type)) {
      onError('Format file harus JPG, JPEG, atau PNG.');
      return;
    }
    if (original.size > MAX_PICK) {
      onError('Ukuran foto terlalu besar (maksimal 25MB).');
      return;
    }
    onError('');
    setScanNote('');
    // Cek gambar dulu: resolusi terlalu kecil ditolak, arah/buram hanya diperingatkan
    const quality = await checkPhoto(original);
    if (quality.reject) {
      onError(quality.reject);
      return;
    }
    setPhotoWarn(quality.warnings);
    setKtpCheck('unchecked');
    let f = original;
    // Melebihi 2MB: foto diperkecil otomatis di browser sebelum dipakai
    if (original.size > MAX_FILE) {
      setCompressing(true);
      try {
        const res = await compressImage(original, TARGET_FILE);
        f = res.file;
        setCompressNote(`Foto diperkecil otomatis dari ${(original.size / 1048576).toFixed(1)}MB menjadi ${(f.size / 1048576).toFixed(1)}MB.`);
      } catch (err) {
        onError(err.message || 'Foto tidak dapat diperkecil.');
        return;
      } finally {
        setCompressing(false);
      }
    } else {
      setCompressNote('');
    }
    setPicked(f);
    setTouched((t) => ({ ...t, foto_ktp: true }));
  };

  // OCR: isi form dari hasil baca KTP; hanya field yang terbaca yang menimpa isian
  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    onError('');
    setScanNote('');
    setOcrHints({});
    setOcrFilled({});
    setOcrMissing({});
    try {
      const r = await scanKtpToForm(file, master);
      if (r.notKtp) { // bukan KTP: jangan isi form
        setKtpCheck('invalid');
        setScanNote(r.note);
        setTouched((t) => ({ ...t, foto_ktp: true }));
        return;
      }
      setKtpCheck('valid');
      setForm((f) => ({ ...f, ...r.formPatch }));
      setGeoQuery(r.geoQuery);
      setTouched((t) => ({ ...t, ...r.touched }));
      setOcrHints(r.hints);
      setOcrFilled(r.filled);
      setOcrMissing(r.missing);
      setScanNote(r.note);
    } catch (err) {
      onError(errorMessage(err));
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
    // Foto baru yang belum dipindai belum bisa dipastikan KTP: beri peringatan dulu sebelum konfirmasi simpan
    if (file && ktpCheck === 'unchecked') {
      setKtpWarn(true);
      return;
    }
    setConfirmSave(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);
    const fd = new FormData();
    FIELDS.forEach((k) => {
      let v = String(form[k]).trim();
      // BE memakai aturan decimal:7 -> harus tepat 7 angka di belakang koma
      if (k === 'latitude' || k === 'longitude') v = Number(v).toFixed(7);
      // Kolom yang tidak diubah dikirim persis seperti dari BE, supaya perbedaan format tidak dianggap perubahan data (yang memicu verifikasi ulang)
      if (reuse && !changedKeys.includes(k)) v = k === 'latitude' || k === 'longitude' ? String(reuse[k]) : v;
      fd.append(k, v);
    });
    if (file) fd.append('foto_ktp', file);

    setSaving(true);
    onError('');
    try {
      let res = null;
      if (editing) await updateKonsumen(editing.id, fd);
      else res = await createKonsumen(fd);
      // Konsumen yang sudah terdaftar: pakai pesan BE (menjelaskan data ditemukan dan masuk ke daftar Anda)
      onSaved(reuse && res?.message ? res.message : `Data konsumen ${form.name || form.nik || ''} ${editing ? 'diperbarui' : 'ditambahkan'}.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const ctx = { can, form, errors, touched, setField, ocr: { hints: ocrHints, missing: ocrMissing, filled: ocrFilled }, geo };
  const field = (name, label, props) => <KonsumenField name={name} label={label} ctx={ctx} {...props} />;

  return (
    <>
      <form ref={pageRef} className="konsumen-page konsumen-form-page" onSubmit={handleSubmit} noValidate>
        <div className="dash-card-head">
          <h3>{editing ? 'Ubah Konsumen' : 'Tambah Konsumen'}</h3>
          <button id="btn-konsumen-form-close" type="button" className="dash-btn outline" onClick={onClose} disabled={saving}>← Kembali ke daftar</button>
        </div>

        <div className="dash-form-group" id="konsumen-foto_ktp">
          <label>Foto KTP{!editing && !reuse && ' *'}</label>
          {shownPreview && <img className="dash-ktp-big" src={shownPreview} alt="Pratinjau KTP" />}
          <input id="konsumen-ktp-file" ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleFile} />
          <div className="dash-actions">
            <button id="btn-konsumen-upload-ktp" type="button" className="dash-btn outline" onClick={() => fileRef.current?.click()} disabled={compressing}>
              {compressing ? <><Spin />Memperkecil foto...</> : shownPreview ? 'Ganti Foto' : 'Pilih Foto KTP'}
            </button>
            {can.scan && (
              <button id="btn-konsumen-scan" type="button" className="dash-btn soft" onClick={handleScan} disabled={!file || scanning || compressing}>
                {scanning ? <><Spin />Memindai...</> : 'Pindai KTP (OCR)'}
              </button>
            )}
          </div>
          {scanNote && (
            <p ref={scanNoteRef} className={`dash-alert dash-alert-big ${scanNote.ok ? 'yellow' : 'warning'}`} role="status">
              <strong>{scanNote.ok ? '✓' : '!'}</strong> {scanNote.text}
            </p>
          )}
          {ktpCheck === 'invalid' && (
            <div className="dash-actions">
              <button id="btn-konsumen-ktp-override" type="button" className="dash-btn outline" onClick={() => { setKtpCheck('override'); setScanNote(''); }}>Tetap gunakan foto ini</button>
            </div>
          )}
          {photoWarn.map((w) => <p key={w} className="dash-alert warning" role="status"><strong>!</strong> {w}</p>)}
          {compressNote && <p id="ktp-compress-note" className="dash-map-hint" role="status">{compressNote}</p>}
          <p className="dash-map-hint">JPG/PNG. Foto di atas 2MB diperkecil otomatis.{editing && ' Kosongkan bila foto tidak diganti.'}{can.scan && ' Pilih foto baru untuk memakai OCR.'}</p>
          {touched.foto_ktp && errors.foto_ktp && <p className="dash-field-error">{errors.foto_ktp}</p>}
        </div>

        <div className="dash-form-row">
          {field('nik', 'NIK', { placeholder: '16 digit angka', numeric: true, max: 16 })}
          {field('name', 'Nama Lengkap')}
        </div>
        {shownNikDup && (
          <p className="dash-alert warning" role="status">
            <strong>!</strong> NIK <strong>{shownNikDup.nik}</strong> sudah terdaftar atas nama <strong>{shownNikDup.name || '-'}</strong>. Periksa kembali sebelum menyimpan.
          </p>
        )}
        {reuse && (
          changedKeys.length === 0 && !file ? (
            <p className="dash-alert dash-alert-big yellow" role="status">
              <strong>✓</strong> Data sama dengan yang sudah terdaftar. Bila konsumen ini sudah pernah diverifikasi, datanya langsung diterima tanpa verifikasi ulang. Foto KTP yang sudah ada dipakai, tidak perlu diunggah lagi.
            </p>
          ) : (
            <div className="dash-alert warning" role="status">
              <strong>!</strong>{' '}
              {changedKeys.length > 0 && <>Data berbeda dari yang sudah terdaftar ({changedKeys.map((k) => LABELS[k]).join(', ')}). </>}
              {file && <>Foto baru dipilih. </>}
              Perubahan dianggap data baru dan akan menunggu verifikasi ulang.
              {file && <> <button id="btn-konsumen-use-existing-photo" type="button" className="dash-link" onClick={() => { setPicked(null); setCompressNote(''); setPhotoWarn([]); setKtpCheck('unchecked'); }}>Pakai foto yang sudah ada</button></>}
            </div>
          )
        )}
        {showNikList && (
          <ul className="dash-nik-list" role="listbox" aria-label="NIK terdaftar">
            <li className="dash-map-hint">NIK terdaftar — pilih untuk mengambil datanya:</li>
            {nikList.map((k) => (
              <li key={k.id}>
                <button type="button" role="option" className="dash-nik-item" onClick={() => pickKonsumen(k)}>
                  <strong>{k.nik}</strong> — {k.name || '-'}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="dash-form-row">
          {field('kode_tmp_lahir', 'Tempat Lahir', { idOptions: master.tempatLahir })}
          {field('tgl_lahir', 'Tanggal Lahir', { type: 'date' })}
        </div>
        <div className="dash-form-row">
          {field('jenis_kelamin', 'Jenis Kelamin', { options: ['Laki-laki', 'Perempuan'] })}
          {field('kode_agama', 'Agama', { idOptions: master.agama })}
        </div>
        <div className="dash-form-row">
          {field('alamat_ktp', 'Alamat Sesuai KTP')}
          {field('alamat_domisili', 'Alamat Domisili')}
        </div>
        <div className="dash-form-group">
          <label>Lokasi di Peta *</label>
          <Suspense fallback={<div className="dash-map" />}>
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onPick={handlePick}
              desa={nameOf(master.kelurahan, form.kode_kelurahan)}
              kabupaten={nameOf(master.kabupaten, form.kode_kabupaten_kota)}
              kecamatan={nameOf(master.kecamatan, form.kode_kecamatan)}
              provinsi={nameOf(master.provinsi, form.kode_provinsi)}
            />
          </Suspense>
          <p className="dash-map-hint">Cari alamat, klik peta, atau geser marker untuk menentukan titik lokasi konsumen.</p>
        </div>
        <div className="dash-form-row">
          {field('latitude', 'Latitude', { numeric: true, placeholder: '-0.9471000' })}
          {field('longitude', 'Longitude', { numeric: true, placeholder: '100.4172000' })}
        </div>
        <div className="dash-form-row">
          {field('kode_provinsi', 'Provinsi', { idOptions: master.provinsi })}
          {field('kode_kabupaten_kota', 'Kabupaten / Kota', { idOptions: master.kabupaten, disabled: !form.kode_provinsi, hint: 'Pilih provinsi dulu' })}
        </div>
        <div className="dash-form-row">
          {field('kode_kecamatan', 'Kecamatan', { idOptions: master.kecamatan, searchKey: 'kecamatan', disabled: !form.kode_kabupaten_kota, hint: 'Pilih kabupaten/kota dulu' })}
          {field('kode_kelurahan', 'Kelurahan / Desa', { idOptions: master.kelurahan, searchKey: 'kelurahan', disabled: !form.kode_kecamatan, hint: 'Pilih kecamatan dulu' })}
        </div>
        <div className="dash-form-row three">
          {field('rt', 'RT', { max: 3, numeric: true })}
          {field('rw', 'RW', { max: 3, numeric: true })}
          {field('kewarganegaraan', 'Kewarganegaraan', { options: ['WNI', 'WNA'] })}
        </div>
        <div className="dash-form-row">
          {field('status_perkawinan', 'Status Perkawinan', { options: KAWIN })}
          {field('kode_pekerjaan', 'Pekerjaan', { idOptions: master.pekerjaan })}
        </div>
        {masterNote && <p className="dash-map-hint">Sebagian daftar master dari server tidak dapat dimuat. {masterNote}</p>}
        <div className="dash-form-row">
          {field('no_telp', 'No. Telp', { numeric: true, max: 20 })}
          {field('email', 'Email', { type: 'email' })}
        </div>

        <div className="dash-modal-actions">
          <button id="btn-konsumen-cancel" type="button" className="dash-btn outline" onClick={onClose}>Batal</button>
          <button id="btn-konsumen-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
        </div>
      </form>

      {ktpWarn && (
        <Modal onClose={() => setKtpWarn(false)} dismissOnBackdrop>
          <h3>Foto belum diperiksa sebagai KTP</h3>
          <p className="dash-card-desc">
            Foto yang Anda pilih belum dipindai, jadi belum bisa dipastikan bahwa itu KTP.
            {can.scan ? ' Disarankan memindai dulu agar foto dan data diperiksa.' : ' Pastikan foto adalah KTP yang jelas dan seluruh kartunya terlihat.'}
          </p>
          <div className="dash-modal-actions">
            <button id="btn-konsumen-ktp-warn-cancel" type="button" className="dash-btn outline" onClick={() => setKtpWarn(false)}>Batal</button>
            {can.scan && (
              <button id="btn-konsumen-ktp-warn-scan" type="button" className="dash-btn soft" onClick={() => { setKtpWarn(false); handleScan(); }}>Pindai KTP dulu</button>
            )}
            <button id="btn-konsumen-ktp-warn-continue" type="button" className="dash-btn solid" onClick={() => { setKtpWarn(false); setKtpCheck('override'); setConfirmSave(true); }}>Tetap gunakan foto ini</button>
          </div>
        </Modal>
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
    </>
  );
}

export default KonsumenForm;
