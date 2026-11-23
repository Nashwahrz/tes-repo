// src/features/master/components/MasterPanel.jsx
// Kelola data master: agama, pekerjaan (BE: /agamas, /pekerjaans) dan wilayah (provinsi, kabupaten/kota, kecamatan, kelurahan).
// Data baru bisa ditambahkan lewat formulir (satu per satu) atau impor Excel (MasterImportModal).
// Tiap data punya kode (unik, tidak bisa diubah) dan status. Data tidak dihapus, hanya dinonaktifkan (PUT {path}/{id}/status).
// Induk wilayah dihubungkan lewat kode (kode_provinsi, kode_kabupaten_kota, kode_kecamatan).
// Pekerjaan: hierarki 2 tingkat (Header = H, Detail = D); form tambah/ubah khusus pekerjaan memakai PekerjaanForm.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getMasterPage, getMasterOptions, getChildrenByParent, getMasterByKode, searchMaster, createMaster, updateMaster, setMasterStatus, exportMaster, getPekerjaanHeaders, errorMessage } from '../../../api/authServices';
import { MASTER_CODE_LENGTH } from '../../../api/masterExcel';
import '../styles/pekerjaan.css';
import '../styles/master.css';
import Toast from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import SpaceWarning from '../../../shared/components/SpaceWarning';
import Loading, { Spin } from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import Switch from '../../../shared/components/Switch';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import MasterImportModal from './MasterImportModal';

// filters: filter induk di atas tabel. Kelurahan (puluhan ribu data) baru disaring setelah kecamatan dipilih: hanya anak kecamatan itu yang dimuat.
// perm: awalan permission BE (<perm>.lihat/tambah/ubah; ganti status memakai .ubah); parent: kolom kode induk + endpoint induk (untuk menampilkan namanya)
const PAGE_SIZE = 10;
const TABS = [
  { key: 'agama', label: 'Agama', path: '/agamas', perm: 'agamas', menu: 'agamas' },
  {
    key: 'pekerjaan', label: 'Pekerjaan', path: '/pekerjaans', perm: 'pekerjaans', menu: 'pekerjaans',
    // hierarki pekerjaan: ditampilkan sebagai tabel biasa /all, form tambah/ubah menggunakan kolom tambahan
    isPekerjaan: true,
  },
  { key: 'provinsi', label: 'Provinsi', path: '/provinsis', perm: 'provinsis', wilayah: true },
  { key: 'kabupaten', label: 'Kabupaten / Kota', path: '/kabupaten-kotas', perm: 'kabupaten-kotas', wilayah: true, parent: { field: 'kode_provinsi', label: 'Provinsi', path: '/provinsis' }, filters: ['provinsi'] },
  { key: 'kecamatan', label: 'Kecamatan', path: '/kecamatans', perm: 'kecamatans', wilayah: true, parent: { field: 'kode_kabupaten_kota', label: 'Kabupaten / Kota', path: '/kabupaten-kotas' }, filters: ['provinsi', 'kabupaten'] },
  { key: 'kelurahan', label: 'Kelurahan', path: '/kelurahans', perm: 'kelurahans', wilayah: true, parent: { field: 'kode_kecamatan', label: 'Kecamatan', path: '/kecamatans' }, filters: ['provinsi', 'kabupaten', 'kecamatan'] },
];
const isActive = (r) => r.status !== false;
// Kabupaten/kota milik satu provinsi (kode); semua status ikut, karena ini layar kelola
const kabupatenOf = async (kodeProv) => (await getMasterOptions('/kabupaten-kotas')).filter((k) => !kodeProv || String(k.kode_provinsi) === String(kodeProv));

// Form tambah/ubah khusus pekerjaan (hierarki 2 tingkat H/D)
const SECTOR_JOB_OPTIONS = ['Formal', 'Informal', 'Tidak Bekerja'];
const TYPE_HEADER_OPTIONS = [{ value: 'H', label: 'Header (induk)' }, { value: 'D', label: 'Detail (anak)' }];

function PekerjaanForm({ form: pf, setForm: spf, touched, isNew, pekerjaanHeaders, loadingHeaders, kodeError, nameError, typeError, sectorError, parentError: parentErr, seqError }) {
  const isDetail = pf.type_header === 'D';
  return (
    <>
      {isNew && (
        <div className="dash-form-group">
          <label htmlFor="pekerjaan-kode">Kode *</label>
          <input
            id="pekerjaan-kode"
            className={`dash-input${touched && kodeError ? ' invalid' : ''}`}
            value={pf.kode}
            onChange={(e) => spf((f) => ({ ...f, kode: e.target.value }))}
            placeholder="1–3 karakter (mis. 01)"
            maxLength={3}
            inputMode="numeric"
            autoFocus
          />
          {touched && kodeError && <p className="dash-field-error">{kodeError}</p>}
          <SpaceWarning value={pf.kode} />
          <p className="dash-map-hint">Kode unik 1–3 digit angka, tidak dapat diubah setelah disimpan.</p>
        </div>
      )}
      <div className="dash-form-group">
        <label htmlFor="pekerjaan-name">Nama *</label>
        <input id="pekerjaan-name" className={`dash-input${touched && nameError ? ' invalid' : ''}`} value={pf.name} onChange={(e) => spf((f) => ({ ...f, name: e.target.value }))} autoFocus={!isNew} />
        {touched && nameError && <p className="dash-field-error">{nameError}</p>}
        <SpaceWarning value={pf.name} />
      </div>
      <div className="dash-form-group">
        <label htmlFor="pekerjaan-sequence">Urutan tampilan *</label>
        <input id="pekerjaan-sequence" className={`dash-input${touched && seqError ? ' invalid' : ''}`} type="number" min="1" value={pf.sequence} onChange={(e) => spf((f) => ({ ...f, sequence: e.target.value }))} />
        {touched && seqError && <p className="dash-field-error">{seqError}</p>}
      </div>
      <div className="dash-form-group">
        <label htmlFor="pekerjaan-type-header">Tipe *</label>
        <select id="pekerjaan-type-header" className={`dash-input${touched && typeError ? ' invalid' : ''}`} value={pf.type_header} onChange={(e) => spf((f) => ({ ...f, type_header: e.target.value, id_parent: e.target.value === 'H' ? '' : f.id_parent }))}>
          <option value="">- Pilih tipe -</option>
          {TYPE_HEADER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {touched && typeError && <p className="dash-field-error">{typeError}</p>}
      </div>
      <div className="dash-form-group">
        <label htmlFor="pekerjaan-sector-job">Sektor pekerjaan *</label>
        <select id="pekerjaan-sector-job" className={`dash-input${touched && sectorError ? ' invalid' : ''}`} value={pf.sector_job} onChange={(e) => spf((f) => ({ ...f, sector_job: e.target.value }))}>
          <option value="">- Pilih sektor -</option>
          {SECTOR_JOB_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        {touched && sectorError && <p className="dash-field-error">{sectorError}</p>}
      </div>
      {isDetail && (
        <div className="dash-form-group">
          <label htmlFor="pekerjaan-id-parent">Pekerjaan induk (Header) *</label>
          {loadingHeaders ? (
            <p className="dash-card-desc"><Spin /> Memuat daftar Header...</p>
          ) : (
            <select id="pekerjaan-id-parent" className={`dash-input${touched && parentErr ? ' invalid' : ''}`} value={pf.id_parent} onChange={(e) => spf((f) => ({ ...f, id_parent: e.target.value }))}>
              <option value="">- Pilih induk -</option>
              {pekerjaanHeaders.map((h) => <option key={h.kode} value={h.kode}>{h.name} ({h.kode})</option>)}
            </select>
          )}
          {touched && parentErr && <p className="dash-field-error">{parentErr}</p>}
        </div>
      )}
    </>
  );
}

// Tab dipilih lewat submenu Data Master di sidebar; hak akses menunya sudah diperiksa di DashboardPage
// Pilih induk lewat dropdown yang bisa dicari: langsung menampilkan daftar saat diklik, bisa difilter sambil mengetik
function ParentPicker({ parent, value, name, onPick }) {
  const [text, setText] = useState(name || '');
  const [options, setOptions] = useState([]);
  const [serverResults, setServerResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropPos, setDropPos] = useState(null);
  const inputRef = useRef(null);

  // Hitung ulang posisi dropdown agar tidak terpotong oleh modal (position: fixed)
  const updateDropPos = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropH = 184; // maxHeight dropdown + margin
    const above = spaceBelow < dropH && rect.top > dropH;
    setDropPos({
      top: above ? rect.top - dropH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  // Reposisi saat scroll / resize agar dropdown mengikuti input
  useEffect(() => {
    if (!open) return undefined;
    updateDropPos();
    window.addEventListener('scroll', updateDropPos, true);
    window.addEventListener('resize', updateDropPos);
    return () => {
      window.removeEventListener('scroll', updateDropPos, true);
      window.removeEventListener('resize', updateDropPos);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sinkronkan text saat name dari induk berubah / baru selesai dimuat
  useEffect(() => {
    if (!isTyping) {
      setText(name || '');
    }
  }, [name, isTyping]);

  // Jika ada value tapi belum ada name (misal parentNames belum sempat terisi saat modal dibuka)
  useEffect(() => {
    if (value && !name && !text) {
      getMasterByKode(parent.path, value)
        .then((d) => {
          if (d?.name) {
            setText(d.name);
            onPick(String(value), d.name);
          }
        })
        .catch(() => {});
    }
  }, [value, name, text, parent.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jika value dikosongkan dari luar
  useEffect(() => {
    if (!value && !isTyping) {
      setText('');
    }
  }, [value, isTyping]);

  // Muat opsi dropdown saat parent berubah (provinsi dan kabupaten/kota dimuat penuh agar langsung tampil semua)
  useEffect(() => {
    let active = true;
    setLoading(true);
    if (parent.path === '/provinsis' || parent.path === '/kabupaten-kotas') {
      getMasterOptions(parent.path)
        .then((list) => {
          if (active) {
            setOptions(list || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    } else {
      // Untuk kecamatan: ambil 50 data awal agar dropdown langsung memiliki daftar
      searchMaster(parent.path, '', undefined, 50)
        .then((list) => {
          if (active) {
            setOptions(list || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    }
    return () => { active = false; };
  }, [parent.path]);

  // Untuk path di luar provinsis/kabupaten-kotas (misal kecamatans), cari ke BE jika user mengetik
  useEffect(() => {
    if (!isTyping || parent.path === '/provinsis' || parent.path === '/kabupaten-kotas') return undefined;
    const q = text.trim();
    if (q.length < 2) {
      setServerResults([]);
      return undefined;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      searchMaster(parent.path, q, ctrl.signal)
        .then((rows) => setServerResults(rows))
        .catch(() => {})
        .finally(() => {});
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [text, isTyping, parent.path]);

  const q = isTyping ? text.trim().toLowerCase() : '';
  const displayList = (parent.path === '/provinsis' || parent.path === '/kabupaten-kotas')
    ? (q ? options.filter((o) => o.name.toLowerCase().includes(q) || String(o.kode).includes(q)) : options)
    : (q && serverResults.length > 0 ? serverResults : q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setIsTyping(true);
    setOpen(true);
    if (!val.trim()) {
      onPick('', '');
    }
  };

  const handleSelect = (r) => {
    onPick(String(r.kode), r.name);
    setText(r.name);
    setIsTyping(false);
    setOpen(false);
  };

  const handleClear = () => {
    onPick('', '');
    setText('');
    setIsTyping(false);
    setOpen(true);
  };

  const handleFocus = (e) => {
    updateDropPos();
    setOpen(true);
    if (value) {
      e.target.select();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false);
      setIsTyping(false);
      if (value) {
        setText(name || '');
      }
    }, 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          id="master-parent"
          className="dash-input"
          style={{ paddingRight: value ? 36 : undefined }}
          placeholder={`Pilih / ketik nama ${parent.label.toLowerCase()}...`}
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoComplete="off"
        />
        {value && (
          <button
            id="btn-master-parent-clear"
            type="button"
            title={`Hapus ${parent.label.toLowerCase()}`}
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {open && dropPos && createPortal(
        <ul
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
            listStyle: 'none',
            margin: '4px 0 0',
            padding: 0,
            maxHeight: 180,
            overflowY: 'auto',
            border: '1px solid var(--line)',
            borderRadius: 8,
            background: '#fff',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {loading && options.length === 0 && (
            <li style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 13 }}>Memuat daftar...</li>
          )}
          {!loading && displayList.length === 0 && (
            <li style={{ padding: '8px 12px', color: 'var(--muted)', fontSize: 13 }}>Tidak ditemukan.</li>
          )}
          {displayList.map((r) => {
            const isSelected = String(r.kode) === String(value);
            return (
              <li key={r.kode || r.id}>
                <button
                  id={`btn-master-parent-option-${r.kode}`}
                  type="button"
                  className="dash-menu-item"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? '#f5f5f5' : 'none',
                    fontWeight: isSelected ? 600 : 400,
                    border: 0,
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(r)}
                >
                  <span>{r.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.kode}</span>
                </button>
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </div>
  );
}

function MasterPanel({ tabKey, can }) {
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
  const perm = (action) => can(`${tab.perm}.${action}`);
  const isPekerjaan = tab.key === 'pekerjaan';

  const [rows, setRows] = useState([]);
  const [openHeaders, setOpenHeaders] = useState(() => new Set()); // kode header pekerjaan yang anak-anaknya sedang ditampilkan
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState(''); // query yang sudah ditunda (debounce) dan dikirim ke BE
  // Kelurahan: data tetap tampil per halaman seperti biasa, tetapi filter wilayahnya baru dijalankan saat Cari diklik
  // (setelah provinsi, kabupaten/kota, dan kecamatan terisi semua), bukan tiap kali pilihan dropdown berubah
  const manual = tab.key === 'kelurahan';
  const [appliedKec, setAppliedKec] = useState(''); // kode kecamatan yang sudah dijalankan lewat Cari
  const [loading, setLoading] = useState(true);
  const [fProv, setFProv] = useState(''); // filter provinsi (kode) pada tab kabupaten/kecamatan
  const [fKab, setFKab] = useState(''); // filter kabupaten/kota (kode) pada tab kecamatan
  const [fKec, setFKec] = useState(''); // filter kecamatan (kode) pada tab kelurahan
  const [kecOptions, setKecOptions] = useState([]);
  const [provOptions, setProvOptions] = useState([]);
  const [kabOptions, setKabOptions] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  // Tautan dari form konsumen (?tambah=1&induk=<kode induk>): form tambah langsung terbuka dengan induk terisi
  const [auto] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    return q.get('tambah') === '1' && can(`${tab.perm}.tambah`) ? { induk: tab.parent ? q.get('induk') ?? '' : '' } : null;
  });
  const [editing, setEditing] = useState(auto ? 'new' : null); // null | 'new' | row
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({ kode: '', name: '', parent: auto?.induk ?? '', parentName: '' });
  // Form tambahan untuk pekerjaan hierarki
  const [pkForm, setPkForm] = useState({ kode: '', name: '', sequence: '', type_header: '', sector_job: '', id_parent: '' });
  const [pekerjaanHeaders, setPekerjaanHeaders] = useState([]); // Header pekerjaan untuk dropdown induk
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [parentNames, setParentNames] = useState({}); // kode induk -> nama, untuk kolom induk di tabel
  const [touched, setTouched] = useState(false);
  const [toToggle, setToToggle] = useState(null); // baris yang statusnya akan diganti
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [viewDetailModal, setViewDetailModal] = useState(null); // null | { header, kids }
  const [selectedHeaderFilter, setSelectedHeaderFilter] = useState(''); // filter header untuk tabel detail pekerjaan
  const detailSectionRef = useRef(null);

  // Reset filter detail saat pindah tab atau halaman
  useEffect(() => {
    setSelectedHeaderFilter('');
    setViewDetailModal(null);
  }, [tab.key, page]);

  // Sinkronkan data di dalam viewDetailModal jika rows berubah (setelah edit / toggle status)
  useEffect(() => {
    if (viewDetailModal?.header) {
      const typeOf = (x) => x.type_header?.value ?? x.type_header;
      const headerCode = String(viewDetailModal.header.kode);
      const updatedKids = rows.filter((r) => typeOf(r) === 'D' && String(r.id_parent) === headerCode);
      const updatedHeader = rows.find((r) => typeOf(r) !== 'D' && String(r.kode) === headerCode) ?? viewDetailModal.header;
      setViewDetailModal({ header: updatedHeader, kids: updatedKids });
    }
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  // Kelurahan baru difilter setelah kecamatan dipilih (provinsi & kabupaten hanya mempersempit pilihan kecamatan)
  const byKecamatan = tab.key === 'kelurahan';
  const kabCode = fKab; // nilai filter sudah berupa kode
  const filtered = byKecamatan ? !!appliedKec : !!(tab.filters && (fProv || fKab));
  const filterReady = !!(fProv && fKab && fKec); // Cari baru bisa diklik bila semua filter terisi
  const runFilter = () => { setLoading(true); setPage(1); setAppliedKec(fKec); };

  // Pilihan filter: provinsi (sekali), kabupaten/kota menurut provinsi yang dipilih
  useEffect(() => {
    if (!tab.filters) return;
    getMasterOptions('/provinsis').then(setProvOptions).catch(() => {});
  }, [tab.filters]);
  useEffect(() => {
    if (!tab.filters?.includes('kabupaten')) return;
    kabupatenOf(fProv).then(setKabOptions).catch(() => {});
  }, [tab.filters, fProv]);

  // Kecamatan milik kabupaten/kota terpilih (semua status), hanya untuk tab kelurahan
  useEffect(() => {
    if (!byKecamatan || !fKab) return undefined;
    let active = true;
    getChildrenByParent('/kecamatans', 'kode_kabupaten_kota', kabCode).then((l) => active && setKecOptions(l)).catch(() => active && setKecOptions([]));
    return () => { active = false; };
  }, [byKecamatan, fKab, kabCode]);

  // Mengganti filter induk mengosongkan filter di bawahnya (provinsi > kabupaten/kota > kecamatan)
  const changeFilter = (setter, value, resetKab = false) => {
    if (!manual) { setLoading(true); setPage(1); } // kelurahan: hanya mengubah pilihan, data dimuat saat Cari
    setter(value);
    if (resetKab) setFKab('');
    if (resetKab || setter === setFKab) setFKec('');
  };

  useEffect(() => {
    let active = true;
    if (filtered) {
      // BE belum menyaring per induk: seluruh data tab dimuat sekali (di-cache), disaring dan dipecah per halaman di sini
      (async () => {
        let list;
        if (byKecamatan) list = await getChildrenByParent(tab.path, 'kode_kecamatan', appliedKec);
        else {
          const all = await getMasterOptions(tab.path);
          if (tab.key === 'kabupaten') list = all.filter((r) => String(r.kode_provinsi) === fProv);
          else if (fKab) list = all.filter((r) => String(r.kode_kabupaten_kota) === fKab);
          else {
            const kodes = new Set((await kabupatenOf(fProv)).map((k) => String(k.kode)));
            list = all.filter((r) => kodes.has(String(r.kode_kabupaten_kota)));
          }
        }
        const q = search.toLowerCase();
        if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || String(r.kode).toLowerCase().includes(q));
        const lastPage = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
        const p = Math.min(page, lastPage);
        if (!active) return;
        setRows(list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE));
        setMeta({ page: p, lastPage, total: list.length });
        setUnavailable(false);
        setError('');
      })()
        .catch((err) => { if (active) { setRows([]); setMeta({ page: 1, lastPage: 1, total: 0 }); setError(errorMessage(err)); } })
        .finally(() => active && setLoading(false));
      return () => { active = false; };
    }
    getMasterPage(tab.path, page, search)
      .then((res) => {
        if (!active) return;
        // Halaman terakhir baru saja kosong (data dihapus): mundur ke halaman terakhir yang ada
        if (res.rows.length === 0 && page > 1) { setPage(Math.max(res.meta.lastPage, 1)); return; }
        setRows(res.rows);
        setMeta(res.meta);
        setUnavailable(false);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setRows([]);
        setMeta({ page: 1, lastPage: 1, total: 0 });
        if (err.response?.status === 404 && tab.wilayah) setUnavailable(true);
        else { setUnavailable(false); setError(errorMessage(err)); }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [tab.path, page, search, reloadKey, manual ? '' : fProv, manual ? '' : fKab, appliedKec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pencarian ditunda 400 ms setelah berhenti mengetik, lalu kembali ke halaman pertama
  useEffect(() => {
    const q = query.trim();
    if (q === search) return undefined;
    const t = setTimeout(() => { setLoading(true); setPage(1); setSearch(q); }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  // Kolom induk menampilkan nama; nama diambil menurut kode induk yang ada di halaman ini
  useEffect(() => {
    if (!tab.parent) return;
    const kodes = [...new Set(rows.map((r) => r[tab.parent.field]).filter(Boolean))].filter((k) => !(k in parentNames));
    kodes.forEach((k) => {
      getMasterByKode(tab.parent.path, k)
        .then((d) => setParentNames((m) => ({ ...m, [k]: d?.name ?? '-' })))
        .catch(() => setParentNames((m) => ({ ...m, [k]: '-' })));
    });
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const isNew = editing === 'new';
  // Validasi untuk pekerjaan: kode 1–3 digit angka; untuk master lain: persis N digit
  const pkKodeError = !isNew ? '' : !pkForm.kode.trim() ? 'Kode wajib diisi.' : !/^\d{1,3}$/.test(pkForm.kode.trim()) ? 'Kode harus 1–3 digit angka.' : '';
  const pkNameError = !pkForm.name.trim() ? 'Nama wajib diisi.' : pkForm.name.trim().length > 255 ? 'Maksimal 255 karakter.' : '';
  const pkTypeError = !pkForm.type_header ? 'Tipe wajib dipilih.' : '';
  const pkSectorError = !pkForm.sector_job ? 'Sektor pekerjaan wajib dipilih.' : '';
  const pkParentError = pkForm.type_header === 'D' && !pkForm.id_parent ? 'Induk wajib dipilih untuk pekerjaan tipe Detail.' : '';
  const pkSeqError = !pkForm.sequence ? 'Urutan wajib diisi.' : '';
  const hasPkError = !!(pkKodeError || pkNameError || pkTypeError || pkSectorError || pkParentError || pkSeqError);

  const nameError = !form.name.trim() ? 'Nama wajib diisi.' : form.name.trim().length > 255 ? 'Maksimal 255 karakter.' : '';
  // Mengikuti request BE: kode wajib & persis N digit angka (N beda per master) saat tambah; induk wajib pada wilayah
  const codeLen = MASTER_CODE_LENGTH[tab.key];
  const kodeError = !isNew ? '' : !form.kode.trim() ? 'Kode wajib diisi.' : !(/^\d+$/.test(form.kode.trim()) && form.kode.trim().length === codeLen) ? `Kode harus berupa angka tepat ${codeLen} digit.` : '';
  // Parameter tautan dipakai sekali; nama induk yang terisi otomatis dicari dari kodenya
  useEffect(() => {
    if (!auto) return undefined;
    window.history.replaceState(window.history.state, '', window.location.pathname);
    if (!auto.induk) return undefined;
    let active = true;
    getMasterByKode(tab.parent.path, auto.induk)
      .then((r) => { if (active && r) setForm((f) => (f.parent === auto.induk && !f.parentName ? { ...f, parentName: r.name } : f)); })
      .catch(() => {});
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const parentError = tab.parent && !form.parent ? `${tab.parent.label} wajib dipilih.` : '';

  const openForm = (row) => {
    setSuccess('');
    setError('');
    setTouched(false);
    if (isPekerjaan) {
      const rowType = row === 'new' ? '' : (row.type_header?.value ?? row.type_header ?? '');
      setPkForm({
        kode: row === 'new' ? '' : row.pekerjaan_code ?? row.kode ?? '',
        name: row === 'new' ? '' : row.pekerjaan_name ?? row.name ?? '',
        sequence: row === 'new' ? '' : String(row.sequence ?? ''),
        type_header: rowType,
        sector_job: row === 'new' ? '' : (row.sector_job ?? ''),
        id_parent: row === 'new' || rowType === 'H' ? '' : String(row.id_parent ?? ''),
      });
      // Muat daftar Header pekerjaan untuk dropdown induk (sekali saja)
      if (!pekerjaanHeaders.length) {
        setLoadingHeaders(true);
        getPekerjaanHeaders().then(setPekerjaanHeaders).catch(() => {}).finally(() => setLoadingHeaders(false));
      }
    } else {
      const pid = row === 'new' ? '' : String(row[tab.parent?.field] ?? '');
      setForm({ kode: row === 'new' ? '' : row.kode ?? '', name: row === 'new' ? '' : row.name, parent: pid, parentName: pid ? parentNames[pid] ?? '' : '' });
    }
    setEditing(row);
  };

  const openTambahDetail = (header) => {
    setSuccess('');
    setError('');
    setTouched(false);
    setPkForm({
      kode: '',
      name: '',
      sequence: '',
      type_header: 'D',
      sector_job: header?.sector_job || '',
      id_parent: String(header?.kode || ''),
    });
    if (!pekerjaanHeaders.length) {
      setLoadingHeaders(true);
      getPekerjaanHeaders().then(setPekerjaanHeaders).catch(() => {}).finally(() => setLoadingHeaders(false));
    }
    setEditing('new');
  };

  const handleViewDetail = (header, kids) => {
    setViewDetailModal({ header, kids });
    setSelectedHeaderFilter(String(header.kode));
  };

  const closeForm = () => setEditing(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (isPekerjaan) {
      if (hasPkError) return;
      const payload = {
        ...(isNew ? { pekerjaan_code: pkForm.kode.trim() } : {}),
        pekerjaan_name: pkForm.name.trim(),
        sequence: parseInt(pkForm.sequence, 10),
        type_header: pkForm.type_header,
        sector_job: pkForm.sector_job,
        ...(pkForm.type_header === 'D' && pkForm.id_parent ? { id_parent: pkForm.id_parent } : {}),
      };
      setSaving(true);
      setError('');
      try {
        const api = (await import('../../../api/axios')).default;
        if (isNew) await api.post('/pekerjaans', payload);
        else await api.put(`/pekerjaans/${editing.id}`, payload);
        setSuccess(`Pekerjaan "${pkForm.name.trim()}" ${isNew ? 'ditambahkan' : 'diperbarui'}.`);
        // Buang cache pekerjaan supaya halaman list refresh
        const { refreshMasterOptions } = await import('../../../api/authServices');
        refreshMasterOptions('/pekerjaans');
        setPekerjaanHeaders([]); // muat ulang headers berikutnya
        closeForm();
        setReloadKey((k) => k + 1);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (nameError || kodeError || parentError) return;
    const payload = { ...(isNew ? { kode: form.kode.trim() } : {}), name: form.name.trim(), ...(tab.parent ? { [tab.parent.field]: form.parent } : {}) };
    setSaving(true);
    setError('');
    try {
      if (isNew) await createMaster(tab.path, payload);
      else await updateMaster(tab.path, editing.id, payload);
      setSuccess(`${tab.label} "${payload.name}" ${isNew ? 'ditambahkan' : 'diperbarui'}.`);
      closeForm();
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const target = toToggle;
    const next = !isActive(target);
    setSaving(true);
    setError('');
    try {
      await setMasterStatus(tab.path, target.id, next);
      setSuccess(`${tab.label} "${target.name}" ${next ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToToggle(null);
    }
  };

  const showAksi = perm('ubah');

  const handleExport = async () => {
    setSuccess('');
    setError('');
    setExporting(true);
    try {
      await exportMaster(tab.path, { search, fallbackName: `data_${tab.key}` });
    } catch (err) {
      setError(err.response?.status === 403 ? 'Anda tidak memiliki izin untuk mengekspor data ini.' : 'Gagal mengekspor data ke Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mp-root">
      {/* ── Header Panel ── */}
      <div className="mp-header">
        <div className="mp-header-left">
          <div className="mp-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>
          </div>
          <div>
            <p className="mp-header-eyebrow">Data Master</p>
            <h2 className="mp-header-title">{tab.label}</h2>
          </div>
        </div>
        {!unavailable && (
          <div className="mp-header-actions">
            {perm('lihat') && (
              <button id={`btn-master-${tab.key}-export`} className="dash-btn outline" onClick={handleExport} disabled={exporting}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {exporting ? 'Mengekspor...' : 'Ekspor'}
              </button>
            )}
            {perm('tambah') && (
              <>
                <button id={`btn-master-${tab.key}-import`} className="dash-btn outline" onClick={() => { setSuccess(''); setError(''); setImporting(true); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10" transform="rotate(180 12 12)"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Impor
                </button>
                <button id={`btn-master-${tab.key}-add`} className="dash-btn solid" onClick={() => openForm('new')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Tambah {tab.label}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Toolbar Pencarian & Filter ── */}
      <div className="mp-toolbar">
        <div className="mp-search-wrap">
          <svg className="mp-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            id={`master-${tab.key}-search`}
            className="mp-search-input"
            type="search"
            placeholder={`Cari ${tab.label.toLowerCase()}...`}
            aria-label={`Cari ${tab.label}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {tab.filters && (
          <div className="mp-filters">
            <select id={`master-${tab.key}-filter-provinsi`} className="mp-select" aria-label="Filter provinsi" value={fProv} onChange={(e) => changeFilter(setFProv, e.target.value, true)}>
              <option value="">Semua provinsi</option>
              {provOptions.map((p) => <option key={p.kode} value={p.kode}>{p.name}</option>)}
            </select>
            {tab.filters?.includes('kabupaten') && (
              <select id={`master-${tab.key}-filter-kabupaten`} className="mp-select" aria-label="Filter kabupaten/kota" value={fKab} onChange={(e) => changeFilter(setFKab, e.target.value)}>
                <option value="">Semua kabupaten / kota</option>
                {kabOptions.map((k) => <option key={k.kode} value={k.kode}>{k.name}</option>)}
              </select>
            )}
            {tab.filters?.includes('kecamatan') && (
              <select id={`master-${tab.key}-filter-kecamatan`} className="mp-select" aria-label="Filter kecamatan" value={fKec} disabled={!fKab} onChange={(e) => changeFilter(setFKec, e.target.value)}>
                <option value="">{fKab ? 'Pilih kecamatan' : 'Pilih kab/kota dulu'}</option>
                {kecOptions.map((k) => <option key={k.kode} value={k.kode}>{k.name}</option>)}
              </select>
            )}
            {manual && (
              <button id={`btn-master-${tab.key}-filter-apply`} type="button" className="dash-btn solid" onClick={runFilter} disabled={!filterReady || loading} title={filterReady ? '' : 'Isi provinsi, kab/kota, dan kecamatan dulu'}>
                {loading && appliedKec !== fKec ? <Spin /> : 'Cari'}
              </button>
            )}
            {(filtered || fProv || fKab) && (
              <button id={`btn-master-${tab.key}-clear-filter`} type="button" className="mp-clear-filter" onClick={() => { setPage(1); setFProv(''); setFKab(''); setFKec(''); if (!manual || appliedKec) setLoading(true); setAppliedKec(''); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Hapus filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Petunjuk kelurahan */}
      {manual && !filtered && (
        <div className="mp-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Isi provinsi, kabupaten/kota, dan kecamatan, lalu klik <strong>Cari</strong> untuk menyaring per kecamatan. Tanpa filter, seluruh kelurahan tampil per halaman.
        </div>
      )}
      {tab.key === 'kecamatan' && filtered && loading && (
        <div className="mp-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Memuat seluruh data kecamatan untuk disaring. Hanya sekali; berikutnya langsung tampil.
        </div>
      )}

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {/* ── Konten Tabel ── */}
      {loading ? (
        <Loading rows={4} />
      ) : unavailable ? (
        <p className="dash-alert warning">Endpoint <code>{tab.path}</code> belum tersedia di backend, jadi data {tab.label.toLowerCase()} belum dapat dimuat. Tab ini akan berfungsi setelah backend menyediakannya.</p>
      ) : rows.length === 0 ? (
        <div className="mp-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <p>{filtered && !search ? `Tidak ada ${tab.label.toLowerCase()} pada filter ini.` : search ? `Tidak ada ${tab.label.toLowerCase()} yang cocok dengan "${search}".` : `Belum ada data ${tab.label.toLowerCase()}.`}</p>
        </div>
      ) : isPekerjaan ? (
        /* ── PEKERJAAN: 2 tabel terpisah (Header & Detail) ── */
        (() => {
          const typeOf = (x) => x.type_header?.value ?? x.type_header;
          const headers = rows.filter((r) => typeOf(r) !== 'D');
          const details = rows.filter((r) => typeOf(r) === 'D');
          // Peta kode header → nama (untuk kolom "Induk" di tabel detail)
          const headerNameMap = {};
          rows.forEach((r) => { if (typeOf(r) !== 'D') headerNameMap[String(r.kode)] = r.name; });
          const getHeaderName = (idParent) => headerNameMap[String(idParent)] ?? parentNames[String(idParent)] ?? '...';

          // Saring detail jika user memilih filter header tertentu
          const displayDetails = selectedHeaderFilter
            ? details.filter((d) => String(d.id_parent) === String(selectedHeaderFilter))
            : details;

          return (
            <div className="pk-two-tables">
              {/* ── Tabel Header ── */}
              <div className="pk-section">
                <div className="pk-section-head">
                  <div className="pk-section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    Header Pekerjaan
                    <span className="pk-section-count">{headers.length}</span>
                  </div>
                </div>
                {headers.length === 0 ? (
                  <p className="pk-section-empty">Tidak ada data Header di halaman ini.</p>
                ) : (
                  <div className="dash-table-wrap mp-table-wrap">
                    <table className="dash-table mp-table">
                      <thead>
                        <tr>
                          <th className="mp-th-no">#</th>
                          <th className="mp-th-kode">Kode</th>
                          <th>Nama</th>
                          <th className="pk-hide-md">Sektor</th>
                          <th className="mp-th-sm pk-seq pk-hide-md">Urutan</th>
                          <th className="mp-th-status">Status</th>
                          {showAksi && <th className="mp-th-aksi">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {headers.map((r, idx) => {
                          const kids = details.filter((d) => String(d.id_parent) === String(r.kode));
                          const hasKids = kids.length > 0;
                          const isFilteringThis = String(selectedHeaderFilter) === String(r.kode);
                          return (
                            <tr key={r.id} className={isFilteringThis ? 'pk-row-selected' : undefined}>
                              <td className="mp-td-no">{idx + 1}</td>
                              <td className="mp-td-kode">
                                <span className="mp-kode-badge pk-kode-header">{r.kode}</span>
                              </td>
                              <td><span className="mp-cell-name" style={{ fontWeight: 600 }}>{r.name}</span></td>
                              <td className="pk-hide-md">{r.sector_job ? <span className="pk-chip sector">{r.sector_job}</span> : <span className="mp-muted">—</span>}</td>
                              <td className="pk-seq pk-hide-md">{r.sequence ?? <span className="mp-muted">—</span>}</td>
                              <td className="mp-td-status">
                                {hasKids ? (
                                  <button
                                    id={`btn-master-pekerjaan-view-detail-${r.id}`}
                                    type="button"
                                    className="pk-btn-detail"
                                    onClick={() => handleViewDetail(r, kids)}
                                    title={`Lihat ${kids.length} detail pekerjaan di ${r.name}`}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    <span>Lihat Detail</span>
                                    <span className="pk-btn-detail-count">{kids.length}</span>
                                  </button>
                                ) : (
                                  showAksi ? (
                                    <Switch id={`btn-master-pekerjaan-status-${r.id}`} checked={isActive(r)} label={isActive(r) ? 'Nonaktifkan' : 'Aktifkan'} onToggle={() => setToToggle(r)} />
                                  ) : (
                                    <span className={`dash-status ${isActive(r) ? 'aktif' : 'nonaktif'}`}>{isActive(r) ? 'Aktif' : 'Nonaktif'}</span>
                                  )
                                )}
                              </td>
                              {showAksi && (
                                <td className="mp-th-aksi">
                                  <div className="dash-actions">
                                    {perm('ubah') && <IconButton id={`btn-master-pekerjaan-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Tabel Detail ── */}
              <div className="pk-section" ref={detailSectionRef}>
                <div className="pk-section-head">
                  <div className="pk-section-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    Detail Pekerjaan
                    <span className="pk-section-count">
                      {selectedHeaderFilter ? `${displayDetails.length} dari ${details.length}` : details.length}
                    </span>
                  </div>
                  <div className="pk-section-filter">
                    {selectedHeaderFilter && (
                      <button
                        type="button"
                        className="mp-clear-filter pk-reset-btn"
                        onClick={() => setSelectedHeaderFilter('')}
                        title="Tampilkan semua detail"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Tampilkan Semua
                      </button>
                    )}
                    <select
                      className="mp-select pk-filter-select"
                      value={selectedHeaderFilter}
                      onChange={(e) => setSelectedHeaderFilter(e.target.value)}
                      aria-label="Filter berdasarkan induk header"
                    >
                      <option value="">Semua Header ({details.length})</option>
                      {headers.map((h) => {
                        const count = details.filter((d) => String(d.id_parent) === String(h.kode)).length;
                        return (
                          <option key={h.kode} value={h.kode}>
                            {h.name} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                {displayDetails.length === 0 ? (
                  <p className="pk-section-empty">
                    {selectedHeaderFilter
                      ? `Tidak ada data detail untuk header "${getHeaderName(selectedHeaderFilter)}".`
                      : 'Tidak ada data Detail di halaman ini.'}
                  </p>
                ) : (
                  <div className="dash-table-wrap mp-table-wrap">
                    <table className="dash-table mp-table">
                      <thead>
                        <tr>
                          <th className="mp-th-no">#</th>
                          <th className="mp-th-kode">Kode</th>
                          <th>Nama</th>
                          <th>Induk (Header)</th>
                          <th className="pk-hide-md">Sektor</th>
                          <th className="mp-th-sm pk-seq pk-hide-md">Urutan</th>
                          <th className="mp-th-status">Status</th>
                          {showAksi && <th className="mp-th-aksi">Aksi</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {displayDetails.map((r, idx) => (
                          <tr key={r.id}>
                            <td className="mp-td-no">{idx + 1}</td>
                            <td className="mp-td-kode">
                              <span className="mp-kode-badge">{r.kode}</span>
                            </td>
                            <td><span className="mp-cell-name">{r.name}</span></td>
                            <td className="mp-td-parent">
                              {r.id_parent ? (
                                <button
                                  type="button"
                                  className="pk-parent-ref-btn"
                                  title={`Saring detail hanya untuk ${getHeaderName(r.id_parent)}`}
                                  onClick={() => setSelectedHeaderFilter(String(r.id_parent))}
                                >
                                  {getHeaderName(r.id_parent)}
                                </button>
                              ) : <span className="mp-muted">—</span>}
                            </td>
                            <td className="pk-hide-md">{r.sector_job ? <span className="pk-chip sector">{r.sector_job}</span> : <span className="mp-muted">—</span>}</td>
                            <td className="pk-seq pk-hide-md">{r.sequence ?? <span className="mp-muted">—</span>}</td>
                            <td className="mp-td-status">
                              {showAksi
                                ? <Switch id={`btn-master-pekerjaan-status-${r.id}`} checked={isActive(r)} label={isActive(r) ? 'Nonaktifkan' : 'Aktifkan'} onToggle={() => setToToggle(r)} />
                                : <span className={`dash-status ${isActive(r) ? 'aktif' : 'nonaktif'}`}>{isActive(r) ? 'Aktif' : 'Nonaktif'}</span>}
                            </td>
                            {showAksi && (
                              <td className="mp-th-aksi">
                                <div className="dash-actions">
                                  {perm('ubah') && <IconButton id={`btn-master-pekerjaan-detail-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      ) : (
        /* ── TABEL BIASA (non-pekerjaan) ── */
        <div className="dash-table-wrap mp-table-wrap">
          <table className="dash-table mp-table">
            <thead>
              <tr>
                <th className="mp-th-no">#</th>
                <th className="mp-th-kode">Kode</th>
                <th>Nama</th>
                {tab.parent && <th>{tab.parent.label}</th>}
                <th className="mp-th-status">Status</th>
                {showAksi && <th className="mp-th-aksi">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const pageStart = (meta.page - 1) * (meta.perPage ?? PAGE_SIZE);
                return (
                  <tr key={r.id}>
                    <td className="mp-td-no">{pageStart + idx + 1}</td>
                    <td className="mp-td-kode">
                      <span className="mp-kode-badge">{r.kode ?? '-'}</span>
                    </td>
                    <td><span className="mp-cell-name">{r.name}</span></td>
                    {tab.parent && <td className="mp-td-parent">{r[tab.parent.field] ? parentNames[r[tab.parent.field]] ?? '...' : <span className="mp-muted">—</span>}</td>}
                    <td className="mp-td-status">
                      {showAksi
                        ? <Switch id={`btn-master-${tab.key}-status-${r.id}`} checked={isActive(r)} label={isActive(r) ? 'Nonaktifkan' : 'Aktifkan'} onToggle={() => setToToggle(r)} />
                        : <span className={`dash-status ${isActive(r) ? 'aktif' : 'nonaktif'}`}>{isActive(r) ? 'Aktif' : 'Nonaktif'}</span>}
                    </td>
                    {showAksi && (
                      <td className="mp-th-aksi">
                        <div className="dash-actions">
                          {perm('ubah') && <IconButton id={`btn-master-${tab.key}-edit-${r.id}`} icon="edit" label="Ubah" onClick={() => openForm(r)} />}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!unavailable && <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit={tab.label.toLowerCase()} onPage={(p) => { setLoading(true); setPage(p); }} />}

      {importing && (
        <MasterImportModal
          tab={tab}
          onClose={() => setImporting(false)}
          onImported={() => { setLoading(true); setPage(1); setReloadKey((k) => k + 1); }}
        />
      )}

      {editing && (
        <Modal as="form" onClose={saving ? undefined : closeForm} onSubmit={handleSubmit} noValidate>
          <h3>{isNew ? 'Tambah' : 'Ubah'} {tab.label}</h3>
          {isPekerjaan ? (
            <PekerjaanForm
              form={pkForm}
              setForm={setPkForm}
              touched={touched}
              isNew={isNew}
              pekerjaanHeaders={pekerjaanHeaders}
              loadingHeaders={loadingHeaders}
              kodeError={pkKodeError}
              nameError={pkNameError}
              typeError={pkTypeError}
              sectorError={pkSectorError}
              parentError={pkParentError}
              seqError={pkSeqError}
            />
          ) : (
            <>
              <div className="dash-form-group">
                <label htmlFor="master-kode">Kode{isNew ? ' *' : ''}</label>
                <input
                  id="master-kode"
                  className={`dash-input${touched && kodeError ? ' invalid' : ''}`}
                  value={form.kode}
                  onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
                  inputMode="numeric"
                  maxLength={codeLen}
                  placeholder={isNew ? `${codeLen} digit angka` : undefined}
                  disabled={!isNew}
                  autoFocus={isNew}
                />
                {touched && kodeError && <p className="dash-field-error">{kodeError}</p>}
                <SpaceWarning value={form.kode} />
                {isNew ? <p className="dash-map-hint">Kode wajib {codeLen} digit angka, harus unik, dan tidak dapat diubah setelah disimpan.</p> : <p className="dash-map-hint">Kode tidak dapat diubah.</p>}
              </div>
              <div className="dash-form-group">
                <label htmlFor="master-name">Nama *</label>
                <input
                  id="master-name"
                  className={`dash-input${touched && nameError ? ' invalid' : ''}`}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus={!isNew}
                />
                {touched && nameError && <p className="dash-field-error">{nameError}</p>}
                <SpaceWarning value={form.name} />
              </div>
              {tab.parent && (
                <div className="dash-form-group">
                  <label htmlFor="master-parent">{tab.parent.label} *</label>
                  <ParentPicker parent={tab.parent} value={form.parent} name={form.parentName} onPick={(kode, name) => setForm((f) => ({ ...f, parent: kode, parentName: name }))} />
                  {touched && parentError && <p className="dash-field-error">{parentError}</p>}
                </div>
              )}
            </>
          )}
          <div className="dash-modal-actions">
            <button id={`btn-master-${tab.key}-cancel`} type="button" className="dash-btn outline" onClick={closeForm} disabled={saving}>Batal</button>
            <button id={`btn-master-${tab.key}-save`} type="submit" className="dash-btn solid" disabled={saving}>{saving ? <><Spin />Menyimpan...</> : 'Simpan'}</button>
          </div>
        </Modal>
      )}

      {/* ── Modal Pop-up Lihat Detail Pekerjaan ── */}
      {viewDetailModal && (
        <Modal onClose={() => setViewDetailModal(null)}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              Detail Pekerjaan · {viewDetailModal.header.name}
            </h3>
            <p className="dash-card-desc" style={{ margin: 0 }}>
              Induk Header: <strong>{viewDetailModal.header.name}</strong> <span className="mp-kode-badge pk-kode-header">{viewDetailModal.header.kode}</span> · {viewDetailModal.kids.length} pekerjaan detail
            </p>
          </div>

          {viewDetailModal.kids.length === 0 ? (
            <p className="pk-section-empty" style={{ margin: '14px 0' }}>Belum ada data detail untuk header ini.</p>
          ) : (
            <div className="dash-table-wrap mp-table-wrap" style={{ maxHeight: '52vh', overflowY: 'auto' }}>
              <table className="dash-table mp-table">
                <thead>
                  <tr>
                    <th className="mp-th-no">#</th>
                    <th className="mp-th-kode">Kode</th>
                    <th>Nama</th>
                    <th className="pk-hide-md">Sektor</th>
                    <th className="mp-th-sm pk-seq pk-hide-md">Urutan</th>
                    <th className="mp-th-status">Status</th>
                    {showAksi && <th className="mp-th-aksi">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {viewDetailModal.kids.map((d, idx) => (
                    <tr key={d.id}>
                      <td className="mp-td-no">{idx + 1}</td>
                      <td className="mp-td-kode">
                        <span className="mp-kode-badge">{d.kode}</span>
                      </td>
                      <td><span className="mp-cell-name">{d.name}</span></td>
                      <td className="pk-hide-md">{d.sector_job ? <span className="pk-chip sector">{d.sector_job}</span> : <span className="mp-muted">—</span>}</td>
                      <td className="pk-seq pk-hide-md">{d.sequence ?? <span className="mp-muted">—</span>}</td>
                      <td className="mp-td-status">
                        {showAksi ? (
                          <Switch
                            id={`btn-modal-detail-status-${d.id}`}
                            checked={isActive(d)}
                            label={isActive(d) ? 'Nonaktifkan' : 'Aktifkan'}
                            onToggle={() => setToToggle(d)}
                          />
                        ) : (
                          <span className={`dash-status ${isActive(d) ? 'aktif' : 'nonaktif'}`}>{isActive(d) ? 'Aktif' : 'Nonaktif'}</span>
                        )}
                      </td>
                      {showAksi && (
                        <td className="mp-th-aksi">
                          <div className="dash-actions">
                            {perm('ubah') && (
                              <IconButton
                                id={`btn-modal-detail-edit-${d.id}`}
                                icon="edit"
                                label="Ubah"
                                onClick={() => openForm(d)}
                              />
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="dash-modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <div>
              {perm('tambah') && (
                <button
                  type="button"
                  className="dash-btn outline"
                  onClick={() => {
                    const h = viewDetailModal.header;
                    setViewDetailModal(null);
                    openTambahDetail(h);
                  }}
                >
                  + Tambah Detail di {viewDetailModal.header.name}
                </button>
              )}
            </div>
            <button type="button" className="dash-btn solid" onClick={() => setViewDetailModal(null)}>
              Tutup
            </button>
          </div>
        </Modal>
      )}

      {toToggle && (
        <ConfirmModal
          title={`${isActive(toToggle) ? 'Nonaktifkan' : 'Aktifkan'} ${tab.label}`}
          confirmLabel={isActive(toToggle) ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
          busyLabel="Menyimpan..."
          busy={saving}
          onConfirm={handleToggle}
          onCancel={() => setToToggle(null)}
        >
          <p className="dash-card-desc">
            {isActive(toToggle)
              ? <>Yakin ingin menonaktifkan <strong>{toToggle.name}</strong>? Data tidak muncul lagi sebagai pilihan pada form, tetapi data yang sudah tersimpan tetap utuh.</>
              : <>Aktifkan kembali <strong>{toToggle.name}</strong> sebagai pilihan pada form?</>}
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default MasterPanel;
