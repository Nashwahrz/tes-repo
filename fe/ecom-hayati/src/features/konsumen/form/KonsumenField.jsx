import { useState } from 'react';
import { Spin } from '../../../shared/components/Loading';
import '../styles/pekerjaan.css';
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

// Dropdown pekerjaan bertingkat: header yang punya anak-anak tidak bisa langsung dipilih;
// klik header buka daftar anak-anaknya, klik lagi header tutup. Header tanpa anak bisa dipilih langsung.
function PekerjaanPickInput({ name, label, id, cls, ctx, pekerjaanTree, disabled, hint }) {
  const { form, setField, geo } = ctx;
  const { pickText, setPickText, pickOpen, setPickOpen } = geo;
  const isOpen = pickOpen === name;

  // State lokal: kode header yang sedang dibuka anak-anaknya
  const [expandedHeader, setExpandedHeader] = useState(null);

  // Cari nama dari tree berdasarkan kode yang terpilih
  const findName = (kode) => {
    for (const h of pekerjaanTree) {
      if (String(h.pekerjaan_code) === String(kode)) return h.pekerjaan_name;
      for (const c of (h.children ?? [])) {
        if (String(c.pekerjaan_code) === String(kode)) return c.pekerjaan_name;
      }
    }
    return '';
  };

  const selectedName = form[name] ? findName(form[name]) : '';
  const searchQ = (pickText[name] ?? '').trim().toLowerCase();

  // Saat ada pencarian teks: ratakan semua item (header + anak) dan saring
  const flatFiltered = searchQ
    ? pekerjaanTree.flatMap((h) => {
        const hMatch = h.pekerjaan_name.toLowerCase().includes(searchQ);
        const children = (h.children ?? []).filter((c) => c.pekerjaan_name.toLowerCase().includes(searchQ));
        const items = [];
        // Tampilkan header jika header sendiri cocok DAN tidak punya anak (bisa dipilih),
        // atau sebagai label grup bila ada anak yang cocok
        if (children.length > 0) {
          items.push({ ...h, _isHeader: true, _hasChildren: true, _groupLabel: true });
          items.push(...children.map((c) => ({ ...c, _isHeader: false, _parentName: h.pekerjaan_name })));
        } else if (hMatch && !(h.children ?? []).length) {
          items.push({ ...h, _isHeader: true, _hasChildren: false });
        } else if (hMatch) {
          // header dengan anak, tapi tidak ada anak yang cocok — tampilkan headernya saja sebagai non-pilih
          items.push({ ...h, _isHeader: true, _hasChildren: true, _groupLabel: true });
        }
        return items;
      })
    : null; // null = tampilkan mode tree

  const handleSelect = (kode) => {
    setField(name)({ target: { value: String(kode) } });
    setPickOpen('');
    setPickText((t) => ({ ...t, [name]: '' }));
    setExpandedHeader(null);
  };

  const handleHeaderClick = (hCode, hasChildren) => {
    if (!hasChildren) {
      // Header tanpa anak: langsung pilih
      handleSelect(hCode);
      return;
    }
    setExpandedHeader((prev) => (prev === hCode ? null : hCode));
  };

  return (
    <>
      <input
        id={id}
        data-testid={id}
        className={cls}
        type="text"
        autoComplete="off"
        value={isOpen ? (pickText[name] ?? '') : selectedName}
        onChange={(e) => {
          setPickText((t) => ({ ...t, [name]: e.target.value }));
          if (form[name]) setField(name)({ target: { value: '' } });
          setPickOpen(name);
          setExpandedHeader(null);
        }}
        onFocus={(e) => {
          setPickOpen(name);
          setPickText((t) => ({ ...t, [name]: '' }));
          if (form[name]) e.target.select();
          // Buka header dari nilai terpilih saat ini
          if (form[name]) {
            for (const h of pekerjaanTree) {
              if ((h.children ?? []).some((c) => String(c.pekerjaan_code) === String(form[name]))) {
                setExpandedHeader(h.pekerjaan_code);
                break;
              }
            }
          }
        }}
        onBlur={() => {
          setPickOpen((k) => (k === name ? '' : k));
          setExpandedHeader(null);
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setPickOpen(''); setExpandedHeader(null); } }}
        placeholder={disabled ? hint : `Cari / pilih ${label.toLowerCase()}`}
        disabled={disabled}
      />

      {isOpen && !disabled && (
        <ul className="dash-geo-list dash-pekerjaan-list" role="listbox" aria-label={label}>
          {/* Mode pencarian: daftar diratakan & disaring */}
          {flatFiltered !== null ? (
            flatFiltered.length === 0
              ? <li className="dash-geo-empty">Tidak ditemukan</li>
              : flatFiltered.map((item, i) => {
                  const kode = item.pekerjaan_code;
                  const nama = item.pekerjaan_name;
                  if (item._groupLabel) {
                    return (
                      <li key={`grp-${kode}-${i}`} className="dash-pekerjaan-header-label">
                        <span>{nama}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={kode} className={item._isHeader ? '' : 'dash-pekerjaan-child'}>
                      <button
                        id={`btn-konsumen-option-${name}-${kode}`}
                        data-testid={`btn-konsumen-option-${name}-${kode}`}
                        type="button"
                        role="option"
                        aria-selected={String(kode) === String(form[name])}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect(kode)}
                      >
                        {nama}
                      </button>
                    </li>
                  );
                })
          ) : (
            /* Mode tree: header + anak */
            pekerjaanTree.length === 0
              ? <li className="dash-geo-empty">Data pekerjaan belum tersedia</li>
              : pekerjaanTree.map((h) => {
                  const hCode = h.pekerjaan_code;
                  const hasChildren = (h.children ?? []).length > 0;
                  const isExpanded = expandedHeader === hCode;
                  const isSelectedHeader = String(hCode) === String(form[name]);

                  return (
                    <li key={hCode} className="dash-pekerjaan-group">
                      {/* Baris header */}
                      <button
                        id={`btn-konsumen-option-${name}-${hCode}`}
                        data-testid={`btn-konsumen-option-${name}-${hCode}`}
                        type="button"
                        role={hasChildren ? 'button' : 'option'}
                        aria-selected={isSelectedHeader}
                        aria-expanded={hasChildren ? isExpanded : undefined}
                        className={`dash-pekerjaan-header${isSelectedHeader ? ' selected' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleHeaderClick(hCode, hasChildren)}
                      >
                        <span className="dash-pekerjaan-header-name">{h.pekerjaan_name}</span>
                        {hasChildren && (
                          <span className="dash-pekerjaan-chevron" aria-hidden="true">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </span>
                        )}
                      </button>

                      {/* Daftar anak — tampil saat header di-expand */}
                      {hasChildren && isExpanded && (
                        <ul className="dash-pekerjaan-children" role="group">
                          {h.children.map((c) => {
                            const cKode = c.pekerjaan_code;
                            const isSelectedChild = String(cKode) === String(form[name]);
                            return (
                              <li key={cKode} className="dash-pekerjaan-child">
                                <button
                                  id={`btn-konsumen-option-${name}-${cKode}`}
                                  data-testid={`btn-konsumen-option-${name}-${cKode}`}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelectedChild}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => handleSelect(cKode)}
                                >
                                  {c.pekerjaan_name}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })
          )}
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
      {props.pekerjaanTree ? (
        <PekerjaanPickInput name={name} label={label} id={id} cls={cls} ctx={ctx} pekerjaanTree={props.pekerjaanTree} disabled={props.disabled} hint={props.hint} />
      ) : props.idOptions ? (
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
