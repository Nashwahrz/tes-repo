import { Spin } from '../Loading';

function GeoSearchInput({ name, label, id, cls, ctx, idOptions, searchKey, disabled, hint }) {
  const { form, setField, geo } = ctx;
  const { geoFull, geoQuery, setGeoQuery, geoBusy, geoTerm, geoCut, runGeoSearch } = geo;
  const sk = searchKey;
  const full = geoFull[sk];
  const typed = geoQuery[sk].trim().toLowerCase();
  const shown = full && typed ? idOptions.filter((o) => o.name.toLowerCase().includes(typed)) : idOptions;
  return (
    <>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          id={id}
          className={cls}
          type="text"
          autoComplete="off"
          value={form[name] ? (idOptions.find((o) => String(o.id) === String(form[name]))?.name ?? geoQuery[sk]) : geoQuery[sk]}
          onChange={(e) => {
            const text = e.target.value;
            const hit = idOptions.find((o) => o.name.toLowerCase() === text.trim().toLowerCase());
            setField(name)({ target: { value: hit ? String(hit.id) : '' } });
            setGeoQuery((g) => ({ ...g, [sk]: text }));
          }}
          // Enter = Cari (bukan menyimpan form)
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!form[name] && geoQuery[sk].trim().length >= 3) runGeoSearch(sk); } }}
          placeholder={disabled ? hint : full ? `Pilih atau ketik untuk menyaring ${label.toLowerCase()}` : `Ketik min. 3 huruf nama ${label.toLowerCase()}, lalu klik Cari`}
          disabled={disabled}
        />
        {full ? (geoBusy[sk] && <Spin />) : (
          <button
            id={`btn-konsumen-search-${sk}`}
            type="button"
            className="dash-btn outline"
            onClick={() => runGeoSearch(sk)}
            disabled={disabled || geoBusy[sk] || geoQuery[sk].trim().length < 3}
          >
            {geoBusy[sk] ? <Spin /> : 'Cari'}
          </button>
        )}
      </div>
      {!disabled && !form[name] && !geoBusy[sk] && (full || geoTerm[sk].length >= 3) && (
        <p className="dash-field-hint" style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
          {shown.length === 0
            ? (geoCut[sk] ? 'Terlalu banyak hasil, ketik lebih spesifik' : 'Tidak ditemukan di wilayah ini')
            : `${shown.length} ${full ? `${label.toLowerCase()} di wilayah ini` : 'hasil'} — pilih salah satu`}
        </p>
      )}
      {!disabled && !form[name] && !geoBusy[sk] && shown.length > 0 && (
        <ul className="dash-geo-list" role="listbox" aria-label={label}>
          {shown.map((o) => (
            <li key={o.id}>
              <button id={`btn-konsumen-option-${name}-${o.id}`} type="button" role="option" onClick={() => setField(name)({ target: { value: String(o.id) } })}>{o.name}</button>
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
  const q = (pickText[name] ?? '').trim().toLowerCase();
  const list = idOptions.filter((o) => o.name.toLowerCase().includes(q));
  return (
    <>
      <input
        id={id}
        className={cls}
        type="text"
        autoComplete="off"
        value={form[name] ? (idOptions.find((o) => String(o.id) === String(form[name]))?.name ?? '') : (pickText[name] ?? '')}
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
      {pickOpen === name && !disabled && !form[name] && (
        <ul className="dash-geo-list" role="listbox" aria-label={label}>
          {list.length === 0 && <li className="dash-geo-empty">Tidak ditemukan</li>}
          {list.map((o) => (
            <li key={o.id}>
              {/* mousedown dicegah agar kolom tidak blur sebelum klik terbaca */}
              <button id={`btn-konsumen-option-${name}-${o.id}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => { setField(name)({ target: { value: String(o.id) } }); setPickOpen(''); }}>{o.name}</button>
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
  const id = `konsumen-${name}`;
  const selected = props.options?.find((o) => o.toLowerCase() === String(form[name]).trim().toLowerCase());
  const pickerProps = { name, label, id, cls, ctx, idOptions: props.idOptions, disabled: props.disabled, hint: props.hint };
  return (
    <div className="dash-form-group">
      <label htmlFor={id}>{label} *</label>
      {props.idOptions ? (
        props.searchKey ? <GeoSearchInput {...pickerProps} searchKey={props.searchKey} /> : <PickInput {...pickerProps} />
      ) : props.options ? (
        <select id={id} className={cls} value={selected ?? form[name]} onChange={setField(name)} disabled={props.disabled}>
          <option value="">- Pilih -</option>
          {/* Nilai yang belum ada di daftar (hasil OCR/data lama) tetap ditampilkan */}
          {(form[name] && !selected ? [form[name], ...props.options] : props.options).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          id={id}
          className={cls}
          type={props.type || 'text'}
          value={form[name]}
          onChange={setField(name)}
          placeholder={props.placeholder}
          inputMode={props.numeric ? 'numeric' : undefined}
          maxLength={props.max}
        />
      )}
      {ocr.hints[name] && !form[name] && (
        <p className="dash-field-error" role="alert">
          Hasil scan KTP: "{ocr.hints[name]}" tidak ada di daftar. Ketik ulang{props.searchKey ? ' lalu klik Cari' : ''} atau pilih manual.
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
