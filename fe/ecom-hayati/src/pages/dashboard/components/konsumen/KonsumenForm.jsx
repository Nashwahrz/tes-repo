import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Modal from '../Modal';
import ConfirmModal from '../ConfirmModal';
import { Spin } from '../Loading';
import KonsumenField from './KonsumenField';
import { useKonsumenMaster } from './useKonsumenMaster';
import { scanKtpToForm } from './ktpScan';
import { compressImage } from '../../../../utils/compressImage';
import { createKonsumen, updateKonsumen, checkNik, ktpUrl, errorMessage } from '../../../../api/authServices';
import { CHILD_OF, EMPTY, FIELDS, GEO_KEY, KAWIN, MAX_FILE, MAX_PICK, TARGET_FILE, nameOf, toForm, validate } from './konsumenForm';

// Leaflet (JS + CSS) hanya dimuat saat form dibuka
const MapPicker = lazy(() => import('../MapPicker'));

const without = (obj, keys) => Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

function KonsumenForm({ editing, userId, can, onClose, onSaved, onError }) {
  const [form, setForm] = useState(() => (editing ? toForm(editing) : EMPTY));
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [nikDup, setNikDup] = useState(null); // konsumen lain dengan NIK yang sama (hasil BE /konsumens/check-nik)
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressNote, setCompressNote] = useState('');
  const [scanNote, setScanNote] = useState('');
  const [ocrFilled, setOcrFilled] = useState({}); // { kolom: true } terisi otomatis dari scan KTP dan belum diubah user; diberi pengingat periksa ulang
  const [ocrMissing, setOcrMissing] = useState({}); // { kolom: true } tidak terbaca oleh scan KTP; tampil di bawah kolomnya
  const [ocrHints, setOcrHints] = useState({}); // { kolom: teks hasil OCR yang tidak cocok dengan daftar }; tampil di bawah kolomnya
  const [confirmSave, setConfirmSave] = useState(false);
  const fileRef = useRef(null);
  const scanNoteRef = useRef(null);
  const geo = useKonsumenMaster(form);
  const { master, masterNote, setGeoQuery, setGeoTerm, setPickText } = geo;

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

  // NIK lengkap diperiksa ke BE agar duplikat ketahuan sebelum submit; gagal cek tidak menghalangi pengisian
  useEffect(() => {
    if (!/^\d{16}$/.test(form.nik)) return undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      checkNik(form.nik, ctrl.signal)
        .then(({ list }) => setNikDup(list.find((k) => k.nik === form.nik && k.id !== editing?.id) ?? null))
        .catch(() => {});
    }, 400);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [form.nik, editing]);
  const shownNikDup = /^\d{16}$/.test(form.nik) ? nikDup : null;

  const errors = validate(form, file, !editing);
  const hasError = Object.keys(errors).length > 0;
  const shownPreview = file ? preview : editing ? ktpUrl(editing) : '';

  const handlePick = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setTouched((t) => ({ ...t, latitude: true, longitude: true }));
  };

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
      setForm((f) => ({ ...f, ...r.formPatch }));
      setGeoQuery(r.geoQuery);
      setGeoTerm({ kecamatan: '', kelurahan: '' });
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
    onError('');
    try {
      if (editing) await updateKonsumen(editing.id, fd);
      else await createKonsumen(fd);
      onSaved(`Data konsumen ${form.name || form.nik || ''} ${editing ? 'diperbarui' : 'ditambahkan'}.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const ctx = { form, errors, touched, setField, ocr: { hints: ocrHints, missing: ocrMissing, filled: ocrFilled }, geo };
  const field = (name, label, props) => <KonsumenField name={name} label={label} ctx={ctx} {...props} />;

  return (
    <>
      <Modal as="form" className="wide" onClose={onClose} closeOnEscape={false} onSubmit={handleSubmit} noValidate>
        <div className="dash-modal-head">
          <h3>{editing ? 'Ubah Konsumen' : 'Tambah Konsumen'}</h3>
          <button id="btn-konsumen-form-close" type="button" className="dash-modal-close" onClick={onClose} aria-label="Tutup" title="Tutup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="dash-form-group" id="konsumen-foto_ktp">
          <label>Foto KTP{!editing && ' *'}</label>
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
          {compressNote && <p id="ktp-compress-note" className="dash-map-hint" role="status">{compressNote}</p>}
          <p className="dash-map-hint">JPG/PNG. Foto di atas 2MB diperkecil otomatis.{editing && ' Kosongkan bila foto tidak diganti.'}{can.scan && ' Pilih foto baru untuk memakai OCR.'}</p>
          {touched.foto_ktp && errors.foto_ktp && <p className="dash-field-error">{errors.foto_ktp}</p>}
        </div>

        {field('nik', 'NIK', { placeholder: '16 digit angka', numeric: true, max: 16 })}
        {shownNikDup && (
          <p className="dash-alert warning" role="status">
            <strong>!</strong> NIK ini sudah terdaftar atas nama <strong>{shownNikDup.name || '-'}</strong>. Periksa kembali sebelum menyimpan.
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
          <button id="btn-konsumen-cancel" type="button" className="dash-btn outline" onClick={onClose}>Batal</button>
          <button id="btn-konsumen-save" type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
        </div>
      </Modal>

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
