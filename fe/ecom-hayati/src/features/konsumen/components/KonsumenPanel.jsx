// src/features/konsumen/components/KonsumenPanel.jsx
// UI konsumen (dokumen KTP): lihat, verifikasi. BE tidak lagi menyediakan hapus konsumen. Tambah/ubah ada di konsumen/KonsumenForm.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Toast from '../../../shared/components/Toast';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import KonsumenDetailView from './KonsumenDetailView';
import { STATUS_LABEL } from '../form/konsumenFormConfig';
import {
  getKonsumens, getKonsumenPage, getKonsumen, verifyKonsumen, errorMessage, getMasterByKode, PAGE_SIZE,
} from '../../../api/authServices';

// Ekstensi wajib ditulis: di Windows (huruf besar/kecil sama) './konsumen/KonsumenForm' terbaca sebagai konsumenForm.js
const VERIFY_TEXT = {
  diterima: { title: 'Terima Konsumen', confirm: 'Ya, Terima', verb: 'menerima' },
  revisi: { title: 'Minta Revisi Konsumen', confirm: 'Ya, Minta Revisi', verb: 'meminta revisi' },
  ditolak: { title: 'Tolak Konsumen', confirm: 'Ya, Tolak', verb: 'menolak' },
};
const VERIFY_DONE = { diterima: 'diterima', revisi: 'dikembalikan untuk direvisi', ditolak: 'ditolak' };
const KonsumenForm = lazy(() => import('../form/KonsumenForm.jsx'));


// onChanged: dipanggil setelah data berubah (tambah/ubah/verifikasi) agar lencana di sidebar ikut diperbarui
// dealers & myDealerId: filter dealer tampil untuk semua role. Awalnya hanya konsumen dealer user sendiri; "Semua dealer" menampilkan lintas dealer.
function KonsumenPanel({ can, userId, onChanged, dealers = [], myDealerId = null, users = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  // Cakupan data ditentukan BE menurut izin: 'all' (super admin) semua dealer, 'dealer' hanya dealer user, 'mine' hanya input sendiri.
  // Pilihan lintas dealer hanya bermakna untuk 'all'; selain itu BE sudah membatasi datanya.
  const [dealerFilter, setDealerFilter] = useState(can.mode === 'all' && myDealerId != null ? String(myDealerId) : ''); // id dealer penginput; kosong = semua dealer
  const [onlyMine, setOnlyMine] = useState(false); // true = hanya konsumen yang diinput user ini sendiri (bawaan: semua data dealer)
  const dealerPicked = useRef(false); // true setelah user memilih sendiri, agar bawaan tidak menimpa pilihan
  // Dealer user bisa baru diketahui setelah daftar akun termuat: jadikan bawaan selama belum memilih
  useEffect(() => {
    if (!dealerPicked.current && can.mode === 'all' && myDealerId != null) setDealerFilter(String(myDealerId));
  }, [myDealerId, can.mode]);
  const [reloadKey, setReloadKey] = useState(0);
  const [pollKey, setPollKey] = useState(0); // naik tiap polling: daftar dimuat ulang diam-diam (tanpa spinner/pesan error)
  const silentRef = useRef(false);
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; });
  const sigRef = useRef(''); // tanda status semua baris terakhir; berubah = lencana sidebar perlu diperbarui
  const [page, setPage] = useState(1);
  const [localPage, setLocalPage] = useState(1); // halaman saat semua data dimuat (pencarian/filter): dipecah di FE
  const [meta, setMeta] = useState(null); // info halaman dari BE; null saat mencari (semua data dimuat)
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formTarget, setFormTarget] = useState(null); // { editing, prefill } saat form terbuka; editing = konsumen yang diubah (null = menambah baru); prefill = data awal untuk input baru (mis. dari pengajuan ditolak)
  const [saving, setSaving] = useState(false);
  const [toVerify, setToVerify] = useState(null); // { konsumen, status: 'diterima' | 'revisi' | 'ditolak' }
  const [catatan, setCatatan] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  // Detail ikut memakai data terbaru (URL foto baru) setelah daftar dimuat ulang
  const [detailFresh, setDetailFresh] = useState(null);
  const sameRow = (a, b) => a.konsumen_me_id === b.konsumen_me_id; // satu konsumen bisa tampil beberapa kali (satu per penginput)
  const detailRaw = detailRow ? { ...(rows.find((r) => sameRow(r, detailRow)) ?? detailRow), ...(detailFresh?.id === detailRow.id ? detailFresh : {}) } : null;
  // BE hanya mengirim id pemverifikasi (diverifikasi_oleh) tanpa relasinya: namanya dicari dari daftar akun
  const detail = detailRaw && !detailRaw.verified_by && detailRaw.diverifikasi_oleh
    ? { ...detailRaw, verified_by: users.find((u) => u.id === detailRaw.diverifikasi_oleh) ?? null }
    : detailRaw;
  const setDetail = setDetailRow;


  // Muat satu halaman saat filter/halaman berubah atau reloadKey naik (setelah simpan).
 
  // Dealer konsumen = dealer penginputnya (relasi `me`); BE belum menyaring per dealer, jadi filter dijalankan di FE pada seluruh data
  const dealerOf = (k) => k.me?.id_dealer;
  const dealerName = (k) => dealers.find((d) => d.id === dealerOf(k))?.name;
  const searching = query.trim() !== '';
  const loadAll = searching || dealerFilter !== '' || filter !== '' || onlyMine; // BE belum menyaring status, jadi filter status juga memuat semua data
  useEffect(() => {
    let active = true;
    const load = loadAll
      ? getKonsumens(can.mode, filter).then((data) => ({ rows: data.filter((k) => (!dealerFilter || String(dealerOf(k)) === dealerFilter) && (!onlyMine || k.id_me === userId)), meta: null }))
      : getKonsumenPage(can.mode, filter, page);
    load
      .then((res) => {
        if (!active) return;
        // Halaman terakhir baru saja kosong (data dihapus): mundur ke halaman terakhir yang ada
        if (res.meta && res.rows.length === 0 && page > 1) {
          setPage(Math.max(res.meta.lastPage, 1));
          return;
        }
        const sig = res.rows.map((k) => `${k.konsumen_me_id}:${k.status}`).join('|');
        const changed = sigRef.current !== '' && sig !== sigRef.current;
        sigRef.current = sig;
        setRows(res.rows);
        setMeta(res.meta);
        setError('');
        setLoading(false);
        if (silentRef.current && changed) onChangedRef.current?.();
      })
      .catch((err) => { if (active) { if (!silentRef.current) setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [filter, dealerFilter, onlyMine, userId, page, reloadKey, pollKey, loadAll, can.mode]);

  // Realtime: perubahan status dari pengguna lain muncul tanpa refresh halaman. Polling tiap 8 detik saat tab terlihat
  // dan tidak ada form/dialog terbuka (agar isian tidak terganggu), serta langsung saat tab kembali difokuskan.
  const busy = !!(formTarget || toVerify || saving);
  useEffect(() => {
    if (busy) return undefined;
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      silentRef.current = true;
      setPollKey((n) => n + 1);
    };
    const timer = setInterval(tick, 8000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, [busy]);

  const reload = () => { silentRef.current = false; setLoading(true); setReloadKey((n) => n + 1); };

  // BE hanya mengirim kode wilayah/agama/pekerjaan; namanya diambil per kode saat detail dibuka (hasilnya di-cache)
  const [namesFor, setNamesFor] = useState({ id: null, names: {} });
  const detailId = detail?.id;
  const detailNames = namesFor.id === detailId ? namesFor.names : {}; // nama milik detail lain tidak ikut tampil
  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const refs = {
      tempatLahir: ['/kabupaten-kotas', detail.kode_tmp_lahir], kelurahan: ['/kelurahans', detail.kode_kelurahan],
      kecamatan: ['/kecamatans', detail.kode_kecamatan], kabupaten: ['/kabupaten-kotas', detail.kode_kabupaten_kota],
      provinsi: ['/provinsis', detail.kode_provinsi], agama: ['/agamas', detail.kode_agama], pekerjaan: ['/pekerjaans', detail.kode_pekerjaan],
    };
    Promise.all(Object.entries(refs).map(async ([k, [path, id]]) => [k, (await getMasterByKode(path, id).catch(() => null))?.name]))
      .then((pairs) => { if (active) setNamesFor({ id: detailId, names: Object.fromEntries(pairs) }); });
    return () => { active = false; };
  }, [detailId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Segarkan detail dari BE; gagal = pakai data daftar
  useEffect(() => {
    if (!detailId) return undefined;
    let active = true;
    getKonsumen(detailId).then((k) => active && setDetailFresh(k)).catch(() => {});
    return () => { active = false; setDetailFresh(null); };
  }, [detailId, reloadKey]);

  // URL foto dari BE kedaluwarsa dalam 10 menit: bila gambar gagal dimuat, ambil ulang daftar (paling sering sekali per 30 detik)
  const lastPhotoRefresh = useRef(0);
  const refreshExpiredPhotos = () => {
    if (Date.now() - lastPhotoRefresh.current < 30000) return;
    lastPhotoRefresh.current = Date.now();
    setReloadKey((n) => n + 1);
  };


  const q = query.trim().toLowerCase();
  const visible = q
    ? rows.filter((k) => `${k.name ?? ''} ${k.nik ?? ''} ${k.no_telp ?? ''}`.toLowerCase().includes(q))
    : rows;
  // BE memaginasi (meta) saat tanpa pencarian/filter; selain itu seluruh data sudah dimuat dan dipecah per halaman di sini
  const localPages = Math.max(Math.ceil(visible.length / PAGE_SIZE), 1);
  const curPage = Math.min(localPage, localPages);
  const paged = meta ? visible : visible.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const rowOffset = meta ? (meta.page - 1) * (meta.perPage ?? PAGE_SIZE) : (curPage - 1) * PAGE_SIZE; // nomor urut berlanjut antar halaman

  // prefill: data konsumen yang diubah; foto lama dipakai bila tidak memilih foto baru
  const openForm = (editing, prefill = null, takeFrom = null) => {
    setSuccess('');
    setError('');
    setFormTarget({ editing: editing ?? null, prefill, takeFrom });
  };
  const handleSaved = (message) => {
    setSuccess(message);
    setFormTarget(null);
    reload();
    onChanged?.();
  };


  const openVerify = (konsumen, status) => {
    setCatatan('');
    setError('');
    setToVerify({ konsumen, status });
  };

  // Verifikasi (terima/revisi/tolak); BE mengembalikan konsumen terbaru
  const handleVerify = async () => {
    const { konsumen, status } = toVerify;
    const note = catatan.trim();
    if (status !== 'diterima' && !note) {
      setError(status === 'revisi' ? 'Catatan revisi wajib diisi.' : 'Catatan penolakan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // BE memverifikasi pengajuan di temp_konsumens (konsumen_me_id = id_temp). Diterima: data pindah ke konsumens, daftar dimuat ulang
      const res = await verifyKonsumen(konsumen.konsumen_me_id, status, note);
      const { status: st, catatan_penolakan, diverifikasi_oleh } = res.data;
      // Bila sedang memfilter status tertentu, baris yang statusnya berubah keluar dari daftar
      setRows((list) => list
        .map((k) => (sameRow(k, konsumen) ? { ...k, status: st, catatan_penolakan, diverifikasi_oleh } : k))
        .filter((k) => !filter || k.status === filter));
      setSuccess(`Data konsumen ${konsumen.name || konsumen.nik || ''} ${VERIFY_DONE[status]}.`);
      setToVerify(null);
      setDetail(null);
      reload(); // pengajuan diterima pindah ke data konsumen; muat ulang agar daftar sesuai BE
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const statusTag = (s) => <span className={`dash-status ${s}`}>{STATUS_LABEL[s] ?? s}</span>;

  const closeDetail = () => { setDetail(null); setToVerify(null); };

  return (
    <div>
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {formTarget ? (
        <Suspense fallback={<Loading rows={6} />}>
          <KonsumenForm
            editing={formTarget.editing}
            prefill={formTarget.prefill}
            takeFrom={formTarget.takeFrom}
            can={can}
            onClose={() => setFormTarget(null)}
            onSaved={handleSaved}
            onError={setError}
          />
        </Suspense>
      ) : detail ? (
        <KonsumenDetailView
          detail={detail}
          names={detailNames}
          dealerName={dealerName(detail)}
          statusNode={statusTag(detail.status)}
          canEdit={can.ubah && detail.id_me === userId}
          canAdd={can.tambah && detail.id_me === userId}
          canVerify={can.verifikasi}
          verify={toVerify ? { text: VERIFY_TEXT[toVerify.status], status: toVerify.status, catatan, onCatatan: setCatatan, saving, own: toVerify.konsumen.id_me === userId, onConfirm: handleVerify, onCancel: () => setToVerify(null) } : null}
          onVerify={(status) => openVerify(detail, status)}
          onEdit={(k) => { closeDetail(); openForm(k); }}
          onAdd={(k) => { closeDetail(); openForm(null, k); }}
          onTake={(k) => { closeDetail(); openForm(null, null, k); }}
          canTake={can.tambah}
          onBack={closeDetail}
          onPhotoError={refreshExpiredPhotos}
        />
      ) : (<>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h4M7 14h6" /><circle cx="16" cy="11" r="1.5" /></svg>
          Data Konsumen
        </h3>
        {can.tambah && <button id="btn-konsumen-add" className="dash-btn solid" onClick={() => openForm()}>+ Tambah Konsumen</button>}
      </div>
      <p className="dash-card-desc">Kelola dokumen KTP konsumen. Unggah foto KTP lalu pindai dengan OCR untuk mengisi data otomatis.</p>

      {can.mode === 'all' && myDealerId != null && (
        <div className="dash-tabs" role="tablist" aria-label="Cakupan konsumen">
          {[['', 'Semua Konsumen'], [String(myDealerId), 'Dealer Saya']].map(([v, l]) => (
            <button
              key={l}
              id={`konsumen-scope-${v === '' ? 'semua' : 'dealer-saya'}`}
              type="button"
              role="tab"
              aria-selected={dealerFilter === v}
              className={`dash-tab${dealerFilter === v ? ' active' : ''}`}
              onClick={() => { dealerPicked.current = true; setLoading(true); setPage(1); setLocalPage(1); setDealerFilter(v); }}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      <div className="dash-toolbar">
        <input id="konsumen-search"
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, NIK, atau no. telp..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setLocalPage(1); }}
        />
        <select id="konsumen-filter-status" className="dash-input dash-select-filter" value={filter} onChange={(e) => { setLoading(true); setPage(1); setLocalPage(1); setFilter(e.target.value); }}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {can.mode === 'dealer' && (
          <select id="konsumen-filter-penginput" className="dash-input dash-select-filter" value={onlyMine ? 'mine' : ''} aria-label="Filter penginput" onChange={(e) => { setLoading(true); setPage(1); setLocalPage(1); setOnlyMine(e.target.value === 'mine'); }}>
            <option value="">Semua data dealer</option>
            <option value="mine">Hanya data saya</option>
          </select>
        )}
        {can.mode === 'all' && (dealers.length > 0 || myDealerId != null) && (
          <select id="konsumen-filter-dealer" className="dash-input dash-select-filter" value={dealerFilter} aria-label="Filter dealer" onChange={(e) => { dealerPicked.current = true; setLoading(true); setPage(1); setLocalPage(1); setDealerFilter(e.target.value); }}>
            <option value="">Semua dealer</option>
            {/* Role tanpa akses daftar dealer (mis. ME) hanya mendapat pilihan dealernya sendiri */}
            {dealers.length > 0
              ? dealers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.id === myDealerId ? ' (dealer Anda)' : ''}</option>)
              : <option value={myDealerId}>Dealer saya</option>}
          </select>
        )}
      </div>


      {loading ? (
        <Loading rows={5} />
      ) : visible.length === 0 ? (
        <p className="dash-empty">{q || filter ? 'Konsumen tidak ditemukan.' : 'Belum ada data konsumen.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table konsumen-table">
            <thead>
              <tr>
                <th className="col-no">No</th>
                <th>Konsumen</th>
                <th className="col-telp">No. Telp</th>
                <th className="col-status">Status</th>
                {can.verifikasi && <th>Verifikasi</th>}
                <th className="col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((k, idx) => (
                <tr key={k.konsumen_me_id ?? k.id} className={k.status === 'ditolak' ? 'row-rejected' : k.status === 'revisi' ? 'row-revisi' : undefined}>
                  <td className="col-no">{rowOffset + idx + 1}</td>
                  <td>
                    {can.tambah && k.status === 'diterima' && k.id_temp == null ? (
                      // Konsumen terdaftar: nama bisa diklik, membuka form tambah yang sama seperti saat NIK-nya sudah terdaftar
                      <button id={`btn-konsumen-name-${k.id}`} type="button" className="dash-link dash-cell-name" title="Ambil data konsumen ini" onClick={() => openForm(null, null, k)}><strong>{k.name || '-'}</strong></button>
                    ) : (
                      <strong className="dash-cell-name">{k.name || '-'}</strong>
                    )}
                    <small className="dash-cell-sub">NIK {k.nik || '-'}{dealerName(k) && ` · ${dealerName(k)}`}</small>
                  </td>
                  <td>{k.no_telp || '-'}</td>
                  <td>
                    {statusTag(k.status)}
                  </td>
                  {can.verifikasi && (
                    <td>
                      {k.status === 'pending' ? (
                        <select
                          id={`konsumen-verify-${k.id}`}
                          className="dash-input dash-select-filter dash-verify-select"
                          aria-label={`Verifikasi ${k.name || k.nik}`}
                          value=""
                          onChange={(e) => e.target.value && openVerify(k, e.target.value)}
                        >
                          <option value="">Pilih aksi...</option>
                          <option value="diterima">Terima</option>
                          <option value="revisi">Minta Revisi</option>
                          <option value="ditolak">Tolak</option>
                        </select>
                      ) : (
                        <span className="acc-muted">-</span>
                      )}
                    </td>
                  )}
                  <td className="col-aksi">
                    <div className="dash-actions">
                      <IconButton id={`btn-konsumen-detail-${k.id}`} icon="view" label="Detail" onClick={() => setDetail(k)} />
                      {can.ubah && k.status === 'revisi' && k.id_me === userId && (
                        <IconButton id={`btn-konsumen-edit-${k.id}`} icon="edit" label="Perbaiki" onClick={() => openForm(k)} />
                      )}
                      {can.tambah && k.status === 'diterima' && k.id_temp == null && (
                        <IconButton id={`btn-konsumen-take-${k.id}`} icon="plus" label="Ambil Data" onClick={() => openForm(null, null, k)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (meta ? (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="konsumen" onPage={(p) => { setLoading(true); setPage(p); }} />
      ) : (
        <Pager page={curPage} lastPage={localPages} total={visible.length} unit="konsumen" onPage={setLocalPage} />
      ))}

      </>)}


      {toVerify && !detail && (
        <ConfirmModal
          title={VERIFY_TEXT[toVerify.status].title}
          confirmLabel={VERIFY_TEXT[toVerify.status].confirm}
          busyLabel="Memproses..."
          busy={saving}
          confirmDisabled={toVerify.status !== 'diterima' && !catatan.trim()}
          onConfirm={handleVerify}
          onCancel={() => setToVerify(null)}
        >
          <p className="dash-card-desc">
            {toVerify.status === 'diterima'
              ? <>Yakin menerima data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong>? Pastikan data dan foto KTP sudah diperiksa.</>
              : toVerify.status === 'revisi'
                ? <>Data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong> dikembalikan ke penginput untuk diperbaiki. Tulis bagian yang perlu direvisi.</>
                : <>Data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong> akan ditolak. Tulis alasan penolakan.</>}
          </p>
          {toVerify.konsumen.id_me === userId && (
            <p className="dash-alert warning" role="alert">
              <strong>!</strong> Data ini diinput oleh Anda sendiri. Apakah Anda yakin ingin {VERIFY_TEXT[toVerify.status].verb} data tersebut?
            </p>
          )}
          {toVerify.status !== 'diterima' && (
            <div className="dash-form-group">
              <label htmlFor="konsumen-catatan">{toVerify.status === 'revisi' ? 'Catatan revisi *' : 'Catatan penolakan *'}</label>
              <textarea
                id="konsumen-catatan"
                className="dash-input"
                rows={3}
                maxLength={255}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={toVerify.status === 'revisi' ? 'Contoh: Foto KTP buram, mohon unggah ulang' : 'Contoh: Data tidak sesuai KTP'}
                autoFocus
              />
              <small className="dash-map-hint">{catatan.length}/255</small>
            </div>
          )}
        </ConfirmModal>
      )}

    </div>
  );
}

export default KonsumenPanel;
