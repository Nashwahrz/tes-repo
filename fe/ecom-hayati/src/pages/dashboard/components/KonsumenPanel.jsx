// src/pages/dashboard/components/KonsumenPanel.jsx
// UI konsumen (dokumen KTP): lihat, tambah, hapus. Data tidak bisa diedit; yang ditolak diinput ulang.
// Termasuk + OCR KTP, terhubung ke API /konsumens.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import {
  getKonsumens, createKonsumen, deleteKonsumen, scanKtp, ktpUrl, errorMessage,
} from '../../../api/authServices';

// Leaflet (JS + CSS) hanya dimuat saat form dibuka
const MapPicker = lazy(() => import('./MapPicker'));

const STATUS_LABEL = { pending: 'Menunggu Verifikasi', diterima: 'Diterima', ditolak: 'Ditolak' };
const AGAMA = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const KAWIN = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];

const EMPTY = {
  nik: '', name: '', tmp_lahir: '', tgl_lahir: '', jenis_kelamin: '', alamat: '', latitude: '', longitude: '', rt: '', rw: '',
  desa_kelurahan: '', kecamatan: '', kabupaten_kota: '', provinsi: '', agama: '', status_perkawinan: '',
  pekerjaan: '', kewarganegaraan: 'WNI', no_telp: '', email: '',
};
const FIELDS = Object.keys(EMPTY);
const MAX_FILE = 2 * 1024 * 1024; // 2MB, sama dengan BE

// BE mengirim tgl_lahir sebagai ISO (UTC); ambil bagian tanggalnya saja
const toForm = (k) => Object.fromEntries(FIELDS.map((f) => {
  let v = k[f] ?? '';
  if (f === 'tgl_lahir' && v) v = String(v).slice(0, 10);
  return [f, v];
}));

// Label field untuk pesan wajib diisi
const LABELS = {
  nik: 'NIK', name: 'Nama', tmp_lahir: 'Tempat lahir', tgl_lahir: 'Tanggal lahir', jenis_kelamin: 'Jenis kelamin',
  alamat: 'Alamat', latitude: 'Latitude', longitude: 'Longitude', rt: 'RT', rw: 'RW', desa_kelurahan: 'Kelurahan/Desa',
  kecamatan: 'Kecamatan', kabupaten_kota: 'Kabupaten/Kota', provinsi: 'Provinsi', agama: 'Agama',
  status_perkawinan: 'Status perkawinan', pekerjaan: 'Pekerjaan', kewarganegaraan: 'Kewarganegaraan',
  no_telp: 'No. telp', email: 'Email',
};

// Validasi mengikuti be/app/Http/Requests/KonsumenRequest.php (semua field wajib)
function validate(form, file) {
  const e = {};
  if (!file) e.foto_ktp = 'Foto KTP wajib diunggah.';
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
  [['name', 255], ['tmp_lahir', 100], ['alamat', 255], ['rt', 3], ['rw', 3], ['no_telp', 20]].forEach(([k, max]) => {
    if (!e[k] && form[k].length > max) e[k] = `Maksimal ${max} karakter.`;
  });
  return e;
}

function KonsumenPanel({ can, userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [toRedo, setToRedo] = useState(null); // konsumen ditolak yang akan diinput ulang
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [confirmSave, setConfirmSave] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [detail, setDetail] = useState(null);
  const fileRef = useRef(null);

  // Muat daftar saat filter berubah atau reloadKey naik (setelah simpan)
  useEffect(() => {
    let active = true;
    getKonsumens(filter)
      .then((data) => { if (active) { setRows(data); setError(''); } })
      .catch((err) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, reloadKey]);

  const reload = () => { setLoading(true); setReloadKey((n) => n + 1); };

  // Pratinjau foto yang baru dipilih; URL lama dilepas saat diganti, ditutup, atau panel ditinggalkan
  const previewRef = useRef('');
  const setPicked = (f) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = f ? URL.createObjectURL(f) : '';
    setFile(f);
    setPreview(previewRef.current);
  };
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const errors = formOpen ? validate(form, file) : {};
  const hasError = Object.keys(errors).length > 0;
  const shownPreview = file ? preview : '';

  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((k) => `${k.name ?? ''} ${k.nik ?? ''} ${k.no_telp ?? ''}`.toLowerCase().includes(q))
    : rows;

  // prefill: data konsumen lama (input ulang); foto selalu harus diunggah lagi
  const openForm = (prefill) => {
    setSuccess('');
    setError('');
    setTouched({});
    setScanNote('');
    setPicked(null);
    setForm(prefill ? toForm(prefill) : EMPTY);
    setFormOpen(true);
  };
  const closeForm = () => { setFormOpen(false); setPicked(null); };

  const handlePick = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setTouched((t) => ({ ...t, latitude: true, longitude: true }));
  };

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTouched((t) => ({ ...t, [key]: true }));
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
    try {
      const data = await scanKtp(file);
      let filled = 0;
      setForm((f) => {
        const next = { ...f };
        FIELDS.forEach((k) => {
          if (data[k]) { next[k] = String(data[k]); filled += 1; }
        });
        return next;
      });
      setTouched((t) => ({ ...t, nik: true }));
      setScanNote(`KTP dipindai. Periksa kembali hasilnya sebelum menyimpan.`);
      if (!filled) setScanNote('KTP dipindai, tetapi tidak ada data yang terbaca. Isi manual.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries([...FIELDS, 'foto_ktp'].map((k) => [k, true])));
    if (hasError) return;
    setConfirmSave(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);
    const fd = new FormData();
    fd.append('id_me', userId);
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
      await createKonsumen(fd);
      setSuccess(`Data konsumen ${form.name || form.nik || ''} ditambahkan.`);
      closeForm();
      reload();
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
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  // Data ditolak tidak bisa diedit: hapus data lama (NIK harus unik), lalu isi ulang dari data tersebut
  const handleRedo = async () => {
    setSaving(true);
    setError('');
    try {
      await deleteKonsumen(toRedo.id);
      setRows((list) => list.filter((k) => k.id !== toRedo.id));
      openForm(toRedo);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToRedo(null);
    }
  };

  const field = (key, label, props = {}) => {
    const cls = `dash-input${touched[key] && errors[key] ? ' invalid' : ''}`;
    const id = `konsumen-${key}`;
    return (
      <div className="dash-form-group">
        <label htmlFor={id}>{label} *</label>
        {props.options ? (
          <select id={id} className={cls} value={form[key]} onChange={setField(key)}>
            <option value="">- Pilih -</option>
            {props.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            id={id}
            className={cls}
            type={props.type || 'text'}
            value={form[key]}
            onChange={setField(key)}
            placeholder={props.placeholder}
            inputMode={props.numeric ? 'numeric' : undefined}
            maxLength={props.max}
          />
        )}
        {touched[key] && errors[key] && <p className="dash-field-error">{errors[key]}</p>}
      </div>
    );
  };

  const statusTag = (s) => <span className={`dash-status ${s}`}>{STATUS_LABEL[s] ?? s}</span>;

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><circle cx="16" cy="11" r="1.5" /></svg>
          Data Konsumen
        </h3>
        {can.tambah && <button className="dash-btn solid" onClick={() => openForm()}>+ Tambah Konsumen</button>}
      </div>
      <p className="dash-card-desc">Kelola dokumen KTP konsumen. Unggah foto KTP lalu pindai dengan OCR untuk mengisi data otomatis.</p>

      <div className="dash-toolbar">
        <input
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, NIK, atau no. telp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="dash-input dash-select-filter" value={filter} onChange={(e) => { setLoading(true); setFilter(e.target.value); }}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {success && <p className="dash-alert success">{success}</p>}
      {error && !formOpen && <p className="dash-alert error">{error}</p>}

      {loading ? (
        <p className="dash-empty">Memuat...</p>
      ) : visible.length === 0 ? (
        <p className="dash-empty">{q || filter ? 'Konsumen tidak ditemukan.' : 'Belum ada data konsumen.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>KTP</th>
                <th>NIK</th>
                <th>Nama</th>
                <th>No. Telp</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((k) => (
                <tr key={k.id}>
                  <td><img className="dash-ktp-thumb" src={ktpUrl(k.foto_ktp)} alt="KTP" loading="lazy" /></td>
                  <td>{k.nik || '-'}</td>
                  <td><strong className="dash-cell-name">{k.name || '-'}</strong></td>
                  <td>{k.no_telp || '-'}</td>
                  <td>
                    {statusTag(k.status)}
                    {k.status === 'ditolak' && k.catatan_penolakan && <small className="dash-note">{k.catatan_penolakan}</small>}
                  </td>
                  <td>
                    <div className="dash-actions">
                      <button className="dash-btn outline" onClick={() => setDetail(k)}>Detail</button>
                      {k.status === 'ditolak' && can.tambah && can.hapus && (
                        <button className="dash-btn outline" onClick={() => setToRedo(k)}>Input Ulang</button>
                      )}
                      {can.hapus && <button className="dash-btn soft" onClick={() => setToDelete(k)}>Hapus</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="dash-modal-bg" onClick={() => setDetail(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-head">
              <h3>Detail Konsumen</h3>
              <button type="button" className="dash-modal-close" onClick={() => setDetail(null)} aria-label="Tutup" title="Tutup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <img className="dash-ktp-big" src={ktpUrl(detail.foto_ktp)} alt="Foto KTP" />
            <dl className="dash-detail">
              {[
                ['NIK', detail.nik], ['Nama', detail.name],
                ['Tempat, Tgl Lahir', [detail.tmp_lahir, detail.tgl_lahir && String(detail.tgl_lahir).slice(0, 10)].filter(Boolean).join(', ')],
                ['Jenis Kelamin', detail.jenis_kelamin], ['Alamat', detail.alamat],
                ['Koordinat', detail.latitude && detail.longitude ? `${detail.latitude}, ${detail.longitude}` : ''],
                ['RT/RW', [detail.rt, detail.rw].filter(Boolean).join('/')],
                ['Kel/Desa', detail.desa_kelurahan], ['Kecamatan', detail.kecamatan],
                ['Kab/Kota', detail.kabupaten_kota], ['Provinsi', detail.provinsi],
                ['Agama', detail.agama], ['Status Perkawinan', detail.status_perkawinan],
                ['Pekerjaan', detail.pekerjaan], ['Kewarganegaraan', detail.kewarganegaraan],
                ['No. Telp', detail.no_telp], ['Email', detail.email],
                ['Didaftarkan oleh', detail.me?.name ?? detail.me?.email],
                ['Diverifikasi oleh', detail.verified_by?.name ?? detail.verifiedBy?.name],
              ].map(([l, v]) => (
                <div key={l}><dt>{l}</dt><dd>{v || '-'}</dd></div>
              ))}
              <div><dt>Status</dt><dd>{statusTag(detail.status)}</dd></div>
              {detail.status === 'ditolak' && <div><dt>Catatan Penolakan</dt><dd>{detail.catatan_penolakan || '-'}</dd></div>}
            </dl>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="dash-modal-bg" onClick={closeForm}>
          <form className="dash-modal wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <h3>Tambah Konsumen</h3>
            {error && <p className="dash-alert error">{error}</p>}
            {scanNote && <p className="dash-alert info">{scanNote}</p>}

            <div className="dash-form-group">
              <label>Foto KTP *</label>
              {shownPreview && <img className="dash-ktp-big" src={shownPreview} alt="Pratinjau KTP" />}
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleFile} />
              <div className="dash-actions">
                <button type="button" className="dash-btn outline" onClick={() => fileRef.current?.click()}>
                  {shownPreview ? 'Ganti Foto' : 'Pilih Foto KTP'}
                </button>
                {can.scan && (
                  <button type="button" className="dash-btn soft" onClick={handleScan} disabled={!file || scanning}>
                    {scanning ? 'Memindai...' : 'Pindai KTP (OCR)'}
                  </button>
                )}
              </div>
              <p className="dash-map-hint">JPG/PNG, maksimal 2MB.{can.scan && ' Pilih foto baru untuk memakai OCR.'}</p>
              {touched.foto_ktp && errors.foto_ktp && <p className="dash-field-error">{errors.foto_ktp}</p>}
            </div>

            {field('nik', 'NIK', { placeholder: '16 digit angka', numeric: true, max: 16 })}
            {field('name', 'Nama Lengkap')}
            <div className="dash-form-row">
              {field('tmp_lahir', 'Tempat Lahir')}
              {field('tgl_lahir', 'Tanggal Lahir', { type: 'date' })}
            </div>
            <div className="dash-form-row">
              {field('jenis_kelamin', 'Jenis Kelamin', { options: ['Laki-laki', 'Perempuan'] })}
              {field('agama', 'Agama', { options: AGAMA })}
            </div>
            {field('alamat', 'Alamat')}
            <div className="dash-form-group">
              <label>Lokasi di Peta *</label>
              <Suspense fallback={<div className="dash-map" />}>
                <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={handlePick} />
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
              {field('desa_kelurahan', 'Kelurahan / Desa')}
              {field('kecamatan', 'Kecamatan')}
            </div>
            <div className="dash-form-row">
              {field('kabupaten_kota', 'Kabupaten / Kota')}
              {field('provinsi', 'Provinsi')}
            </div>
            <div className="dash-form-row">
              {field('status_perkawinan', 'Status Perkawinan', { options: KAWIN })}
              {field('pekerjaan', 'Pekerjaan')}
            </div>
            {field('kewarganegaraan', 'Kewarganegaraan', { options: ['WNI', 'WNA'] })}
            <div className="dash-form-row">
              {field('no_telp', 'No. Telp', { numeric: true, max: 20 })}
              {field('email', 'Email', { type: 'email' })}
            </div>

            <div className="dash-modal-actions">
              <button type="button" className="dash-btn outline" onClick={closeForm}>Batal</button>
              <button type="submit" className="dash-btn solid" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmSave && (
        <div className="dash-modal-bg" onClick={() => setConfirmSave(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tambah Konsumen</h3>
            <p className="dash-card-desc">
              Yakin ingin menambahkan konsumen <strong>{form.name.trim() || form.nik || 'ini'}</strong>?
            </p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setConfirmSave(false)}>Batal</button>
              <button className="dash-btn solid" onClick={handleSave}>Ya, Tambah</button>
            </div>
          </div>
        </div>
      )}

      {toRedo && (
        <div className="dash-modal-bg" onClick={() => setToRedo(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Input Ulang</h3>
            <p className="dash-card-desc">
              Data <strong>{toRedo.name || toRedo.nik || 'konsumen ini'}</strong> ditolak dan tidak bisa diedit.
              Data lama akan dihapus, lalu formulir terisi ulang dengan data tersebut. Unggah foto KTP yang baru dan simpan.
            </p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setToRedo(null)}>Batal</button>
              <button className="dash-btn solid" onClick={handleRedo} disabled={saving}>Ya, Input Ulang</button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="dash-modal-bg" onClick={() => setToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Konsumen</h3>
            <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name || toDelete.nik || 'konsumen ini'}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setToDelete(null)}>Batal</button>
              <button className="dash-btn solid" onClick={handleDelete} disabled={saving}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KonsumenPanel;
