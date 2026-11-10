import { Spin } from '../../../shared/components/Loading';
import { MENU_PATHS, MENU_KECAMATAN, MENU_KELURAHAN } from '../../dashboard/utils/menuPaths';
import { fieldId } from './konsumenFormConfig';

// Jalan keluar saat induk belum punya data: buka halaman master di tab baru (form konsumen tetap utuh)
const ADD_MASTER = {
  kecamatan: { menu: MENU_KECAMATAN, parentField: 'fk_kabupaten_kota', label: 'Kecamatan', parent: 'kabupaten/kota' },
  kelurahan: { menu: MENU_KELURAHAN, parentField: 'fk_kecamatan', label: 'Kelurahan / Desa', parent: 'kecamatan' },
};

function GeoSearchInput({ name, label, id, cls, ctx, idOptions, searchKey, disabled, hint }) {
  const { form, setField, geo, can } = ctx;
  const { geoFull, geoQuery, setGeoQuery, geoBusy, geoCut, reloadGeo, pickOpen, setPickOpen } = geo;
  const add = ADD_MASTER[searchKey];
  const open = pickOpen === name; // daftar hanya terbuka saat kolom difokuskan
  const sk = searchKey;
  const full = geoFull[sk];
  const filled = !!form[name];
  // Teks yang diketik hanya menyaring daftar; saat sudah terisi, seluruh pilihan tetap tampil agar mudah diganti
  const typed = filled ? '' : geoQuery[sk].trim().toLowerCase();
  const shown = typed ? idOptions.filter((o) => o.name.toLowerCase().includes(typed)) : idOptions;
  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={id}
          data-testid={id}
          className={cls}
          type="text"
          autoComplete="off"
          value={form[name] ? (idOptions.find((o) => String(o.kode) === String(form[name]))?.name ?? geoQuery[sk]) : geoQuery[sk]}
          onChange={(e) => {
            const text = e.target.value;
            const hit = idOptions.find((o) => o.name.toLowerCase() === text.trim().toLowerCase());
            setField(name)({ target: { value: hit ? String(hit.kode) : '' } });
            setGeoQuery((g) => ({ ...g, [sk]: text }));
            setPickOpen(name);
          }}
          onFocus={(e) => { setPickOpen(name); if (form[name]) e.target.select(); }}
          onBlur={() => setPickOpen((k) => (k === name ? '' : k))}
          // Enter hanya mencegah form tersimpan; daftar disaring otomatis saat mengetik
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); if (e.key === 'Escape') setPickOpen(''); }}
          placeholder={disabled ? hint : `Pilih atau ketik untuk menyaring ${label.toLowerCase()}`}
          disabled={disabled}
        />
        {geoBusy[sk] && <Spin />}
      </div>
      {!disabled && !form[name] && geoBusy[sk] && (
        <p className="dash-field-hint" style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>Memuat {label.toLowerCase()}...</p>
      )}
      {open && !disabled && !form[name] && !geoBusy[sk] && (
        <p className="dash-field-hint" style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
          {shown.length === 0
            ? (geoCut[sk] ? 'Terlalu banyak hasil, ketik lebih spesifik' : typed ? `Tidak ada ${label.toLowerCase()} yang cocok di wilayah ini` : `Tidak ada data ${label.toLowerCase()} di wilayah ini`)
            : `${shown.length} ${label.toLowerCase()}${full || !typed ? ' di wilayah ini' : ''} — pilih salah satu`}
        </p>
      )}
      {!disabled && !form[name] && !geoBusy[sk] && idOptions.length === 0 && add && (
        <div className="dash-alert warning" role="note" style={{ marginTop: 6 }}>
          <span>
            Belum ada data {add.label.toLowerCase()} di {add.parent} ini.{' '}
            {can?.masterAdd?.[sk] ? (
              <>
                <a id={`link-konsumen-add-${sk}`} data-testid={`link-konsumen-add-${sk}`} href={`${MENU_PATHS[add.menu]}?tambah=1&induk=${encodeURIComponent(form[add.parentField])}`} target="_blank" rel="noopener noreferrer">
                  Tambah {add.label} baru ↗
                </a>
                {' '}(dibuka di tab baru, isian di sini tidak hilang). Setelah disimpan, kembali ke tab ini atau{' '}
                <button id={`btn-konsumen-reload-${sk}`} data-testid={`btn-konsumen-reload-${sk}`} type="button" className="dash-link" onClick={() => reloadGeo(sk)}>muat ulang</button>.
              </>
            ) : 'Hubungi admin untuk menambahkan datanya.'}
          </span>
        </div>
      )}
      {open && !disabled && !geoBusy[sk] && shown.length > 0 && (
        <ul className="dash-geo-list" role="listbox" aria-label={label}>
          {shown.map((o) => (
            <li key={o.kode}>
              <button id={`btn-konsumen-option-${name}-${o.kode}`} data-testid={`btn-konsumen-option-${name}-${o.kode}`} type="button" role="option" aria-selected={String(o.kode) === String(form[name])} onMouseDown={(e) => e.preventDefault()} onClick={() => { setField(name)({ target: { value: String(o.kode) } }); setPickOpen(''); }}>{o.name}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PickInput({ name, label, id, cls, ctx, idOptions, disabled, hint }) {
  const { form, setField, geo } = ctx;
  const { pickText, setPickText, pickOpen, setPickOpen } = geo;
  const q = form[name] ? '' : (pickText[name] ?? '').trim().toLowerCase(); // terisi: tampilkan seluruh pilihan
  const list = idOptions.filter((o) => o.name.toLowerCase().includes(q));
  return (
    <>
      <input
        id={id}
        data-testid={id}
        className={cls}
        type="text"
        autoComplete="off"
        value={form[name] ? (idOptions.find((o) => String(o.kode) === String(form[name]))?.name ?? '') : (pickText[name] ?? '')}
        onChange={(e) => {
          setPickText((t) => ({ ...t, [name]: e.target.value }));
          if (form[name]) setField(name)({ target: { value: '' } });
          setPickOpen(name);
        }}
        onFocus={(e) => { setPickOpen(name); if (form[name]) e.target.select(); }}
        onBlur={() => setPickOpen((k) => (k === name ? '' : k))}
        placeholder={disabled ? hint : `Cari / pilih ${label.toLowerCase()}`}
        disabled={disabled}
      />
      {pickOpen === name && !disabled && (
        <ul className="dash-geo-list" role="listbox" aria-label={label}>
          {list.length === 0 && <li className="dash-geo-empty">Tidak ditemukan</li>}
          {list.map((o) => (
            <li key={o.kode}>
              {/* mousedown dicegah agar kolom tidak blur sebelum klik terbaca */}
              <button id={`btn-konsumen-option-${name}-${o.kode}`} data-testid={`btn-konsumen-option-${name}-${o.kode}`} type="button" role="option" aria-selected={String(o.kode) === String(form[name])} onMouseDown={(e) => e.preventDefault()} onClick={() => { setField(name)({ target: { value: String(o.kode) } }); setPickOpen(''); }}>{o.name}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function KonsumenField({ name, label, ctx, ...props }) {
  const { form, errors, touched, setField, ocr } = ctx;
  const cls = `dash-input${touched[name] && errors[name] ? ' invalid' : ''}`;
  const id = fieldId(name);
  const selected = props.options?.find((o) => o.toLowerCase() === String(form[name]).trim().toLowerCase());
  const pickerProps = { name, label, id, cls, ctx, idOptions: props.idOptions, disabled: props.disabled, hint: props.hint };
  return (
    <div className="dash-form-group">
      <label htmlFor={id}>{label} *</label>
      {props.idOptions ? (
        props.searchKey ? <GeoSearchInput {...pickerProps} searchKey={props.searchKey} /> : <PickInput {...pickerProps} />
      ) : props.options ? (
        <select id={id} data-testid={id} className={cls} value={selected ?? form[name]} onChange={setField(name)} disabled={props.disabled}>
          <option value="">- Pilih -</option>
          {/* Nilai yang belum ada di daftar (hasil OCR/data lama) tetap ditampilkan */}
          {(form[name] && !selected ? [form[name], ...props.options] : props.options).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          id={id}
          data-testid={id}
          className={cls}
          type={props.type || 'text'}
          value={form[name]}
          onChange={setField(name)}
          placeholder={props.placeholder}
          inputMode={props.numeric ? 'numeric' : undefined}
          maxLength={props.max}
          disabled={props.disabled}
        />
      )}
      {ocr.hints[name] && !form[name] && (
        <p className="dash-field-error" role="alert">
          Hasil scan KTP: "{ocr.hints[name]}" tidak ada di daftar. Ketik ulang atau pilih manual.
        </p>
      )}
      {ocr.missing[name] && !form[name] && (
        <p className="dash-field-error" role="alert">Tidak terbaca dari scan KTP. Isi manual sesuai KTP.</p>
      )}
      {ocr.filled[name] && form[name] && (
        <p className="dash-field-warn">Terbaca dari scan KTP, mohon cek lagi dan pastikan sesuai dengan KTP.</p>
      )}
      {touched[name] && errors[name] && !((ocr.hints[name] || ocr.missing[name]) && !form[name]) && <p className="dash-field-error">{errors[name]}</p>}
    </div>
  );
}

export default KonsumenField;
