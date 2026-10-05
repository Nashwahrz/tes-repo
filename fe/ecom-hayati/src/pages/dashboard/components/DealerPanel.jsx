// src/pages/DealerPanel.jsx
// UI CRUD dealer. Saat ini perubahan hanya ada di state lokal (belum memanggil API /dealers).
import { lazy, Suspense, useState } from 'react';

// Leaflet (JS + CSS) hanya dimuat saat form dealer dibuka
const MapPicker = lazy(() => import('./MapPicker'));

const EMPTY = { name: '', alamat: '', latitude: '', longitude: '' };

// Validasi mengikuti be/app/Http/Requests/DealerRequest.php
function validate(form, others) {
  const errors = {};
  const name = form.name.trim();
  if (!name) errors.name = 'Nama dealer wajib diisi.';
  else if (name.length > 255) errors.name = 'Nama dealer tidak boleh lebih dari 255 karakter.';
  else if (others.some((d) => d.name.toLowerCase() === name.toLowerCase())) errors.name = 'Nama dealer sudah terdaftar.';

  if (!form.alamat.trim()) errors.alamat = 'Alamat wajib diisi.';

  const lat = Number(form.latitude);
  if (form.latitude === '') errors.latitude = 'Latitude wajib diisi.';
  else if (Number.isNaN(lat)) errors.latitude = 'Latitude harus berupa angka.';
  else if (lat < -90 || lat > 90) errors.latitude = 'Latitude harus bernilai antara -90 dan 90.';

  const lng = Number(form.longitude);
  if (form.longitude === '') errors.longitude = 'Longitude wajib diisi.';
  else if (Number.isNaN(lng)) errors.longitude = 'Longitude harus berupa angka.';
  else if (lng < -180 || lng > 180) errors.longitude = 'Longitude harus bernilai antara -180 dan 180.';

  return errors;
}

function DealerPanel({ dealers }) {
  const [rows, setRows] = useState(dealers);
  const [editing, setEditing] = useState(null); // null | 'new' | dealer
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');

  const isNew = editing === 'new';
  const others = rows.filter((d) => d.id !== editing?.id);
  const errors = editing ? validate(form, others) : {};
  const hasError = Object.keys(errors).length > 0;

  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((d) => `${d.name} ${d.alamat}`.toLowerCase().includes(q)) : rows;

  const openForm = (dealer) => {
    setSuccess('');
    setTouched({});
    setForm(dealer === 'new' ? EMPTY : {
      name: dealer.name,
      alamat: dealer.alamat,
      latitude: String(dealer.latitude),
      longitude: String(dealer.longitude),
    });
    setEditing(dealer);
  };

  const closeForm = () => setEditing(null);

  const handlePick = (lat, lng) => {
    setForm((f) => ({ ...f, latitude: String(lat), longitude: String(lng) }));
    setTouched((t) => ({ ...t, latitude: true, longitude: true }));
  };

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setTouched({ name: true, alamat: true, latitude: true, longitude: true });
    if (hasError) return;

    const data = {
      name: form.name.trim(),
      alamat: form.alamat.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    };

    if (isNew) {
      setRows((list) => [...list, { id: `tmp-${Date.now()}`, ...data }]);
      setSuccess(`Dealer ${data.name} ditambahkan.`);
    } else {
      setRows((list) => list.map((d) => (d.id === editing.id ? { ...d, ...data } : d)));
      setSuccess(`Dealer ${data.name} diperbarui.`);
    }
    closeForm();
  };

  const handleDelete = () => {
    setRows((list) => list.filter((d) => d.id !== toDelete.id));
    setSuccess(`Dealer ${toDelete.name} dihapus.`);
    setToDelete(null);
  };

  const field = (key, label, props = {}) => {
    const cls = `dash-input${touched[key] && errors[key] ? ' invalid' : ''}`;
    return (
      <div className="dash-form-group">
        <label htmlFor={`dealer-${key}`}>{label}</label>
        {props.textarea ? (
          <textarea id={`dealer-${key}`} className={cls} rows={3} value={form[key]} onChange={setField(key)} placeholder={props.placeholder} />
        ) : (
          <input id={`dealer-${key}`} className={cls} value={form[key]} onChange={setField(key)} placeholder={props.placeholder} inputMode={props.numeric ? 'decimal' : undefined} />
        )}
        {touched[key] && errors[key] && <p className="dash-field-error">{errors[key]}</p>}
      </div>
    );
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></svg>
          Data Dealer
        </h3>
        <button className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah Dealer</button>
      </div>
      <p className="dash-card-desc">Kelola dealer: nama, alamat, dan koordinat lokasi.</p>

      <p className="dash-alert info">Tampilan saja: perubahan belum tersimpan ke server.</p>

      <input
        className="dash-input dash-input-search"
        type="search"
        placeholder="Cari nama atau alamat dealer..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {success && <p className="dash-alert success">{success}</p>}

      {visible.length === 0 ? (
        <p className="dash-empty">{q ? 'Dealer tidak ditemukan.' : 'Belum ada data dealer.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Alamat</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id}>
                  <td><strong className="dash-cell-name">{d.name}</strong></td>
                  <td>{d.alamat}</td>
                  <td>{d.latitude}</td>
                  <td>{d.longitude}</td>
                  <td>
                    <div className="dash-actions">
                      <button className="dash-btn outline" onClick={() => openForm(d)}>Ubah</button>
                      <button className="dash-btn soft" onClick={() => setToDelete(d)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="dash-modal-bg" onClick={closeForm}>
          <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave} noValidate>
            <h3>{isNew ? 'Tambah Dealer' : 'Ubah Dealer'}</h3>
            {field('name', 'Nama Dealer', { placeholder: 'Contoh: Hayati Motor Pusat' })}
            {field('alamat', 'Alamat', { textarea: true, placeholder: 'Alamat lengkap dealer' })}
            <div className="dash-form-group">
              <label>Lokasi di Peta</label>
              <Suspense fallback={<div className="dash-map" />}>
                <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={handlePick} />
              </Suspense>
              <p className="dash-map-hint">Klik peta untuk menentukan titik lokasi dealer.</p>
            </div>
            <div className="dash-form-row">
              {field('latitude', 'Latitude', { numeric: true, placeholder: '-6.2088' })}
              {field('longitude', 'Longitude', { numeric: true, placeholder: '106.8456' })}
            </div>
            <div className="dash-modal-actions">
              <button type="button" className="dash-btn outline" onClick={closeForm}>Batal</button>
              <button type="submit" className="dash-btn solid">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {toDelete && (
        <div className="dash-modal-bg" onClick={() => setToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Dealer</h3>
            <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setToDelete(null)}>Batal</button>
              <button className="dash-btn solid" onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealerPanel;
