import { ktpUrl } from '../../../api/authServices';
import { Spin } from './Loading';

// Halaman detail konsumen di area konten (sidebar tetap tampil). names: nama wilayah/agama/pekerjaan hasil lookup ID.
// verify: null atau { status, catatan, onCatatan, saving, own, onConfirm, onCancel } saat konfirmasi terima/tolak dibuka di halaman ini
function KonsumenDetailView({ detail, names: detailNames, dealerName, statusNode, canEdit, canVerify, verify, onVerify, onEdit, onBack, onPhotoError }) {
  return (
    <div className="konsumen-page">
      <div className="dash-card-head">
        <h3>Detail Konsumen</h3>
        <button type="button" className="dash-btn outline" onClick={onBack}>← Kembali ke daftar</button>
      </div>
      <div>
        {detail.status === 'ditolak' && (
          <div className="konsumen-reject" role="note">
            <strong>Alasan penolakan</strong>
            <p>{detail.catatan_penolakan || 'Tidak ada catatan.'}</p>
            {(detail.verified_by?.name ?? detail.verifiedBy?.name) && (
              <small>Ditolak oleh {detail.verified_by?.name ?? detail.verifiedBy?.name}</small>
            )}
            {canEdit && (
              <button type="button" className="dash-btn sm outline konsumen-reject-edit" onClick={() => { onEdit(detail); }}>Ubah Data</button>
            )}
          </div>
        )}
        <div className="konsumen-page-body">
        <img className="dash-ktp-big konsumen-page-photo" src={ktpUrl(detail)} alt="Foto KTP" onError={onPhotoError} />
        <dl className="dash-detail">
          {[
            ['NIK', detail.nik], ['Nama', detail.name],
            ['Tempat, Tgl Lahir', [detailNames.tempatLahir, detail.tgl_lahir && String(detail.tgl_lahir).slice(0, 10)].filter(Boolean).join(', ')],
            ['Jenis Kelamin', detail.jenis_kelamin], ['Alamat', detail.alamat],
            ['Koordinat', detail.latitude && detail.longitude ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {detail.latitude}, {detail.longitude}
                <a
                  className="dash-btn sm outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                  href={`https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                  Buka di Maps
                </a>
              </span>
            ) : ''],
            ['RT/RW', [detail.rt, detail.rw].filter(Boolean).join('/')],
            ['Kel/Desa', detailNames.kelurahan], ['Kecamatan', detailNames.kecamatan],
            ['Kab/Kota', detailNames.kabupaten], ['Provinsi', detailNames.provinsi],
            ['Agama', detailNames.agama], ['Status Perkawinan', detail.status_perkawinan],
            ['Pekerjaan', detailNames.pekerjaan], ['Kewarganegaraan', detail.kewarganegaraan],
            ['No. Telp', detail.no_telp], ['Email', detail.email],
            ['Dealer', dealerName],
            ['Didaftarkan oleh', detail.me?.name ?? detail.me?.email],
            ['Diverifikasi oleh', detail.verified_by?.name ?? detail.verifiedBy?.name],
          ].map(([l, v]) => (
            <div key={l}><dt>{l}</dt><dd>{v || '-'}</dd></div>
          ))}
          <div><dt>Status</dt><dd>{statusNode}</dd></div>
        </dl>
        </div>
        {verify ? (
          <div className="konsumen-verify-panel" role="group" aria-label="Konfirmasi verifikasi">
            <p className="dash-card-desc">
              {verify.status === 'diterima'
                ? <>Yakin menerima data <strong>{detail.name || detail.nik}</strong>? Pastikan data dan foto KTP sudah diperiksa.</>
                : <>Data <strong>{detail.name || detail.nik}</strong> akan ditolak. Tulis alasan penolakan agar penginput dapat memperbaikinya.</>}
            </p>
            {verify.own && (
              <p className="dash-alert warning" role="alert">
                <strong>!</strong> Data ini diinput oleh Anda sendiri. Apakah Anda yakin ingin {verify.status === 'diterima' ? 'menerima' : 'menolak'} data tersebut?
              </p>
            )}
            {verify.status === 'ditolak' && (
              <div className="dash-form-group">
                <label htmlFor="konsumen-catatan">Catatan penolakan *</label>
                <textarea
                  id="konsumen-catatan"
                  className="dash-input"
                  rows={3}
                  maxLength={255}
                  value={verify.catatan}
                  onChange={(e) => verify.onCatatan(e.target.value)}
                  placeholder="Contoh: Foto KTP buram, NIK tidak sesuai"
                  autoFocus
                />
                <small className="dash-map-hint">{verify.catatan.length}/255</small>
              </div>
            )}
            <div className="dash-modal-actions">
              <button type="button" className="dash-btn outline" onClick={verify.onCancel} disabled={verify.saving}>Batal</button>
              <button
                type="button"
                className="dash-btn solid"
                onClick={verify.onConfirm}
                disabled={verify.saving || (verify.status === 'ditolak' && !verify.catatan.trim())}
              >
                {verify.saving ? <><Spin />Memproses...</> : verify.status === 'diterima' ? 'Ya, Terima' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        ) : canVerify && detail.status === 'pending' && (
          <div className="dash-modal-actions">
            <button type="button" className="dash-btn outline konsumen-verify-reject" onClick={() => onVerify('ditolak')}>Tolak</button>
            <button type="button" className="dash-btn solid" onClick={() => onVerify('diterima')}>Terima</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KonsumenDetailView;
