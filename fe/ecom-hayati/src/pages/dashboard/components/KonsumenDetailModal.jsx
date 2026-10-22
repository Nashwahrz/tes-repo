import { ktpUrl } from '../../../api/authServices';

// names: nama wilayah/agama/pekerjaan hasil lookup ID
function KonsumenDetailModal({ detail, names: detailNames, dealerName, statusNode, canEdit, onEdit, onClose, onPhotoError }) {
  return (
    <div className="dash-modal-bg" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-head">
          <h3>Detail Konsumen</h3>
          <button type="button" className="dash-modal-close" onClick={onClose} aria-label="Tutup" title="Tutup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
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
        <img className="dash-ktp-big" src={ktpUrl(detail)} alt="Foto KTP" onError={onPhotoError} />
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
    </div>
  );
}

export default KonsumenDetailModal;
