// src/pages/DealerPanel.jsx

// UI CRUD dealer, terhubung ke API /dealers.
import { lazy, Suspense, useState } from 'react';
import { createDealer, updateDealer, deleteDealer, errorMessage } from '../../../api/authServices';

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

// dealers & onDealersChange dikelola DashboardPage; can = permission dealers.* milik user
function DealerPanel({ dealers: rows, onDealersChange, can }) {
  const [editing, setEditing] = useState(null); // null | 'new' | dealer
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  const isNew = editing === 'new';
  const others = rows.filter((d) => d.id !== editing?.id);
  const errors = editing ? validate(form, others) : {};
  const hasError = Object.keys(errors).length > 0;

  const q = query.trim().toLowerCase();
  const visible = q ? rows.filter((d) => `${d.name} ${d.alamat}`.toLowerCase().includes(q)) : rows;

  const openForm = (dealer) => {
    setSuccess('');
    setError('');
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

  // Submit form hanya memvalidasi lalu meminta konfirmasi; penyimpanan ada di handleSave
  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, alamat: true, latitude: true, longitude: true });
    if (hasError) return;
    setConfirmSave(true);
  };

  const handleSave = async () => {
    setConfirmSave(false);

    const data = {
      name: form.name.trim(),
      alamat: form.alamat.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
    };

    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const res = await createDealer(data);
        onDealersChange((list) => [...list, res.data]);
        setSuccess(`Dealer ${data.name} ditambahkan.`);
      } else {
        const res = await updateDealer(editing.id, data);
        onDealersChange((list) => list.map((d) => (d.id === editing.id ? res.data : d)));
        setSuccess(`Dealer ${data.name} diperbarui.`);
      }
      closeForm();
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
      await deleteDealer(toDelete.id);
      onDealersChange((list) => list.filter((d) => d.id !== toDelete.id));
      setSuccess(`Dealer ${toDelete.name} dihapus.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
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
        {can.tambah && <button className="dash-btn solid" onClick={() => openForm('new')}>+ Tambah Dealer</button>}
      </div>
      <p className="dash-card-desc">Kelola dealer: nama, alamat, dan koordinat lokasi.</p>

      <input
        className="dash-input dash-input-search"
        type="search"
        placeholder="Cari nama atau alamat dealer..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {success && <p className="dash-alert success">{success}</p>}
      {error && !editing && <p className="dash-alert error">{error}</p>}

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
                {(can.ubah || can.hapus) && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.id}>
                  <td><strong className="dash-cell-name">{d.name}</strong></td>
                  <td>{d.alamat}</td>
                  <td>{d.latitude}</td>
                  <td>{d.longitude}</td>
                  {(can.ubah || can.hapus) && (
                    <td>
                      <div className="dash-actions">
                        {can.ubah && <button className="dash-btn outline" onClick={() => openForm(d)}>Ubah</button>}
                        {can.hapus && <button className="dash-btn soft" onClick={() => setToDelete(d)}>Hapus</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="dash-modal-bg" onClick={closeForm}>
          <form className="dash-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} noValidate>
            <h3>{isNew ? 'Tambah Dealer' : 'Ubah Dealer'}</h3>
            {error && <p className="dash-alert error">{error}</p>}
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
              <button type="submit" className="dash-btn solid" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}

      {confirmSave && (
        <div className="dash-modal-bg" onClick={() => setConfirmSave(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isNew ? 'Tambah Dealer' : 'Simpan Perubahan'}</h3>
            <p className="dash-card-desc">
              Yakin ingin {isNew ? 'menambahkan dealer' : 'menyimpan perubahan dealer'} <strong>{form.name.trim()}</strong>?
            </p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setConfirmSave(false)}>Batal</button>
              <button className="dash-btn solid" onClick={handleSave}>{isNew ? 'Ya, Tambah' : 'Ya, Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {toDelete && (
        <div className="dash-modal-bg" onClick={() => setToDelete(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Hapus Dealer</h3>
            <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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

export default DealerPanel;
