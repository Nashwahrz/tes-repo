// src/pages/dashboard/components/KonsumenPanel.jsx
// UI konsumen (dokumen KTP): lihat, verifikasi, hapus. Tambah/ubah ada di konsumen/KonsumenForm.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Toast from './Toast';
import Loading from './Loading';
import Pager from './Pager';
import IconButton from './IconButton';
import ConfirmModal from './ConfirmModal';
import KonsumenDetailView from './KonsumenDetailView';
import { STATUS_LABEL } from './konsumen/konsumenForm';
import {
  getKonsumens, getKonsumenPage, getKonsumen, deleteKonsumen, verifyKonsumen, errorMessage, getMasterById,
} from '../../../api/authServices';

const KonsumenForm = lazy(() => import('./konsumen/KonsumenForm'));


// onChanged: dipanggil setelah data berubah (tambah/ubah/verifikasi/hapus) agar lencana di sidebar ikut diperbarui
// dealers & myDealerId: filter dealer tampil untuk semua role. Awalnya hanya konsumen dealer user sendiri; "Semua dealer" menampilkan lintas dealer.
function KonsumenPanel({ can, userId, onChanged, dealers = [], myDealerId = null }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [dealerFilter, setDealerFilter] = useState(myDealerId != null ? String(myDealerId) : ''); // id dealer penginput; kosong = semua dealer
  const dealerPicked = useRef(false); // true setelah user memilih sendiri, agar bawaan tidak menimpa pilihan
  // Dealer user bisa baru diketahui setelah daftar akun termuat: jadikan bawaan selama belum memilih
  useEffect(() => {
    if (!dealerPicked.current && myDealerId != null) setDealerFilter(String(myDealerId));
  }, [myDealerId]);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null); // info halaman dari BE; null saat mencari (semua data dimuat)
  const [query, setQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formTarget, setFormTarget] = useState(null); // { editing } saat form terbuka; editing = konsumen yang diubah (null = menambah baru)
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toVerify, setToVerify] = useState(null); // { konsumen, status: 'diterima' | 'ditolak' }
  const [catatan, setCatatan] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  // Detail ikut memakai data terbaru (URL foto baru) setelah daftar dimuat ulang
  const [detailFresh, setDetailFresh] = useState(null);
  const detail = detailRow ? { ...(rows.find((r) => r.id === detailRow.id) ?? detailRow), ...(detailFresh?.id === detailRow.id ? detailFresh : {}) } : null;
  const setDetail = setDetailRow;


  // Muat satu halaman saat filter/halaman berubah atau reloadKey naik (setelah simpan).
 
  // Dealer konsumen = dealer penginputnya (relasi `me`); BE belum menyaring per dealer, jadi filter dijalankan di FE pada seluruh data
  const dealerOf = (k) => k.me?.id_dealer;
  const dealerName = (k) => dealers.find((d) => d.id === dealerOf(k))?.name;
  const searching = query.trim() !== '';
  const loadAll = searching || dealerFilter !== '';
  useEffect(() => {
    let active = true;
    const load = loadAll
      ? getKonsumens(filter).then((data) => ({ rows: dealerFilter ? data.filter((k) => String(dealerOf(k)) === dealerFilter) : data, meta: null }))
      : getKonsumenPage(filter, page);
    load
      .then((res) => {
        if (!active) return;
        // Halaman terakhir baru saja kosong (data dihapus): mundur ke halaman terakhir yang ada
        if (res.meta && res.rows.length === 0 && page > 1) {
          setPage(Math.max(res.meta.lastPage, 1));
          return;
        }
        setRows(res.rows);
        setMeta(res.meta);
        setError('');
        setLoading(false);
      })
      .catch((err) => { if (active) { setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [filter, dealerFilter, page, reloadKey, loadAll]);

  const reload = () => { setLoading(true); setReloadKey((n) => n + 1); };

  // BE hanya mengirim ID wilayah/agama/pekerjaan; namanya diambil per ID saat detail dibuka (hasilnya di-cache)
  const [namesFor, setNamesFor] = useState({ id: null, names: {} });
  const detailId = detail?.id;
  const detailNames = namesFor.id === detailId ? namesFor.names : {}; // nama milik detail lain tidak ikut tampil
  useEffect(() => {
    if (!detail) return undefined;
    let active = true;
    const refs = {
      tempatLahir: ['/kabupaten-kotas', detail.id_tmp_lahir], kelurahan: ['/kelurahans', detail.id_kelurahan],
      kecamatan: ['/kecamatans', detail.id_kecamatan], kabupaten: ['/kabupaten-kotas', detail.id_kabupaten_kota],
      provinsi: ['/provinsis', detail.id_provinsi], agama: ['/agamas', detail.id_agama], pekerjaan: ['/pekerjaans', detail.id_pekerjaan],
    };
    Promise.all(Object.entries(refs).map(async ([k, [path, id]]) => [k, (await getMasterById(path, id).catch(() => null))?.name]))
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

  // prefill: data konsumen yang diubah; foto lama dipakai bila tidak memilih foto baru
  const openForm = (prefill) => {
    setSuccess('');
    setError('');
    setFormTarget({ editing: prefill ?? null });
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

  // Verifikasi (terima/tolak); BE mengembalikan konsumen terbaru
  const handleVerify = async () => {
    const { konsumen, status } = toVerify;
    const note = catatan.trim();
    if (status === 'ditolak' && !note) {
      setError('Catatan penolakan wajib diisi.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await verifyKonsumen(konsumen.id, status, note);
      // Bila sedang memfilter status tertentu, baris yang statusnya berubah keluar dari daftar
      setRows((list) => list
        .map((k) => (k.id === konsumen.id ? res.data : k))
        .filter((k) => !filter || k.status === filter));
      setSuccess(`Data konsumen ${konsumen.name || konsumen.nik || ''} ${status === 'diterima' ? 'diterima' : 'ditolak'}.`);
      setToVerify(null);
      setDetail(null);
      onChanged?.();
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
      onChanged?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  const statusTag = (s) => <span className={`dash-status ${s}`}>{STATUS_LABEL[s] ?? s}</span>;

  const closeDetail = () => { setDetail(null); setToVerify(null); };

  return (
    <div>
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {detail ? (
        <KonsumenDetailView
          detail={detail}
          names={detailNames}
          dealerName={dealerName(detail)}
          statusNode={statusTag(detail.status)}
          canEdit={can.ubah}
          canVerify={can.verifikasi}
          verify={toVerify ? { status: toVerify.status, catatan, onCatatan: setCatatan, saving, own: toVerify.konsumen.id_me === userId, onConfirm: handleVerify, onCancel: () => setToVerify(null) } : null}
          onVerify={(status) => openVerify(detail, status)}
          onEdit={(k) => { closeDetail(); openForm(k); }}
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

      <div className="dash-toolbar">
        <input id="konsumen-search"
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari nama, NIK, atau no. telp..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select id="konsumen-filter-status" className="dash-input dash-select-filter" value={filter} onChange={(e) => { setLoading(true); setPage(1); setFilter(e.target.value); }}>
          <option value="">Semua status</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(dealers.length > 0 || myDealerId != null) && (
          <select id="konsumen-filter-dealer" className="dash-input dash-select-filter" value={dealerFilter} aria-label="Filter dealer" onChange={(e) => { dealerPicked.current = true; setLoading(true); setPage(1); setDealerFilter(e.target.value); }}>
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
                <th>Konsumen</th>
                <th className="col-telp">No. Telp</th>
                <th className="col-status">Status</th>
                {can.verifikasi && <th>Verifikasi</th>}
                <th className="col-aksi">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((k) => (
                <tr key={k.id} className={k.status === 'ditolak' ? 'row-rejected' : undefined}>
                  <td>
                    <strong className="dash-cell-name">{k.name || '-'}</strong>
                    <small className="dash-cell-sub">NIK {k.nik || '-'}{dealerName(k) && ` · ${dealerName(k)}`}</small>
                  </td>
                  <td>{k.no_telp || '-'}</td>
                  <td>
                    {statusTag(k.status)}
                  </td>
                  {can.verifikasi && (
                    <td>
                      {k.status === 'pending' ? (
                        <div className="dash-verify">
                          <IconButton id={`btn-konsumen-accept-${k.id}`} icon="check" label="Terima" tone="ok" onClick={() => openVerify(k, 'diterima')} />
                          <IconButton id={`btn-konsumen-reject-${k.id}`} icon="close" label="Tolak" tone="danger" onClick={() => openVerify(k, 'ditolak')} />
                        </div>
                      ) : (
                        <span className="acc-muted">-</span>
                      )}
                    </td>
                  )}
                  <td className="col-aksi">
                    <div className="dash-actions">
                      <IconButton id={`btn-konsumen-detail-${k.id}`} icon="view" label="Detail" onClick={() => setDetail(k)} />
                      {can.hapus && <IconButton id={`btn-konsumen-delete-${k.id}`} icon="delete" label="Hapus" tone="danger" onClick={() => setToDelete(k)} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="konsumen" onPage={(p) => { setLoading(true); setPage(p); }} />
      )}

      </>)}


      {formTarget && (
        <Suspense fallback={null}>
          <KonsumenForm
            editing={formTarget.editing}
            userId={userId}
            can={can}
            onClose={() => setFormTarget(null)}
            onSaved={handleSaved}
            onError={setError}
          />
        </Suspense>
      )}


      {toVerify && !detail && (
        <ConfirmModal
          title={toVerify.status === 'diterima' ? 'Terima Konsumen' : 'Tolak Konsumen'}
          confirmLabel={toVerify.status === 'diterima' ? 'Ya, Terima' : 'Ya, Tolak'}
          busyLabel="Memproses..."
          busy={saving}
          confirmDisabled={toVerify.status === 'ditolak' && !catatan.trim()}
          onConfirm={handleVerify}
          onCancel={() => setToVerify(null)}
        >
          <p className="dash-card-desc">
            {toVerify.status === 'diterima'
              ? <>Yakin menerima data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong>? Pastikan data dan foto KTP sudah diperiksa.</>
              : <>Data <strong>{toVerify.konsumen.name || toVerify.konsumen.nik}</strong> akan ditolak. Tulis alasan penolakan agar penginput dapat memperbaikinya.</>}
          </p>
          {toVerify.konsumen.id_me === userId && (
            <p className="dash-alert warning" role="alert">
              <strong>!</strong> Data ini diinput oleh Anda sendiri. Apakah Anda yakin ingin {toVerify.status === 'diterima' ? 'menerima' : 'menolak'} data tersebut?
            </p>
          )}
          {toVerify.status === 'ditolak' && (
            <div className="dash-form-group">
              <label htmlFor="konsumen-catatan">Catatan penolakan *</label>
              <textarea
                id="konsumen-catatan"
                className="dash-input"
                rows={3}
                maxLength={255}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Foto KTP buram, NIK tidak sesuai"
                autoFocus
              />
              <small className="dash-map-hint">{catatan.length}/255</small>
            </div>
          )}
        </ConfirmModal>
      )}

      {toDelete && (
        <ConfirmModal title="Hapus Konsumen" confirmLabel="Ya, Hapus" busy={saving} onConfirm={handleDelete} onCancel={() => setToDelete(null)}>
          <p className="dash-card-desc">Yakin ingin menghapus <strong>{toDelete.name || toDelete.nik || 'konsumen ini'}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
        </ConfirmModal>
      )}
    </div>
  );
}

export default KonsumenPanel;
