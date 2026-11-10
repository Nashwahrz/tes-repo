import { ktpUrl } from '../../../api/authServices';
import { Spin } from '../../../shared/components/Loading';
import { tglLahirOf } from '../form/konsumenFormConfig';

// Halaman detail konsumen di area konten (sidebar tetap tampil). names: nama wilayah/agama/pekerjaan hasil lookup ID.
// verify: null atau { status, catatan, onCatatan, saving, own, onConfirm, onCancel } saat konfirmasi terima/tolak dibuka di halaman ini
function KonsumenDetailView({ detail, names: detailNames, dealerName, statusNode, canEdit, canAdd, canTake, canVerify, verify, onVerify, onEdit, onAdd, onTake, onBack, onPhotoError }) {
  // Penginput lain yang mengambil data konsumen ini (BE: GET /konsumens/{id} memuat konsumen_mes.me untuk konsumen terdaftar)
  const others = detail.status === 'diterima' ? (detail.konsumen_mes ?? []).filter((m) => m.fk_me !== detail.fk_me) : [];
  return (
    <div className="konsumen-page">
      <div className="dash-card-head">
        <h3>Detail Konsumen</h3>
        <button id="btn-konsumen-back" type="button" className="dash-btn outline" onClick={onBack}>← Kembali ke daftar</button>
      </div>
      <div>
        {(detail.status === 'ditolak' || detail.status === 'revisi') && (
          <div className={`konsumen-reject${detail.status === 'revisi' ? ' revisi' : ''}`} role="note">
            <strong>{detail.status === 'revisi' ? 'Catatan revisi' : 'Alasan penolakan'}</strong>
            <p>{detail.note || 'Tidak ada catatan.'}</p>
            {(detail.verified_by?.name ?? detail.verifiedBy?.name) && (
              <small>{detail.status === 'revisi' ? 'Diminta revisi oleh' : 'Ditolak oleh'} {detail.verified_by?.name ?? detail.verifiedBy?.name}</small>
            )}
            {/* Revisi: pengajuan yang sama diperbaiki. Ditolak: tidak bisa diubah, penginput mengajukan data baru. */}
            {detail.status === 'revisi' && canEdit && (
              <button id="btn-konsumen-edit-revisi" type="button" className="dash-btn sm outline konsumen-reject-edit" onClick={() => onEdit(detail)}>Perbaiki Data</button>
            )}
            {detail.status === 'ditolak' && canAdd && (
              <button id="btn-konsumen-add-rejected" type="button" className="dash-btn sm outline konsumen-reject-edit" onClick={onAdd}>Input Data Baru</button>
            )}
          </div>
        )}
        <div className="konsumen-page-body">
        <img className="dash-ktp-big konsumen-page-photo" src={ktpUrl(detail)} alt="Foto KTP" onError={onPhotoError} />
        <dl className="dash-detail">
          {[
            ['NIK', detail.nik], ['Nama', detail.konsumen_name],
            ['Tempat, Tgl Lahir', [detailNames.tempatLahir, tglLahirOf(detail.birth_date)].filter(Boolean).join(', ')],
            ['Jenis Kelamin', detail.gender], ['Alamat (KTP)', detail.ktp_address], ['Alamat Domisili', detail.domicile_address],
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
            ['Agama', detailNames.agama], ['Status Perkawinan', detail.marital_status],
            ['Pekerjaan', detailNames.pekerjaan], ['Kewarganegaraan', detail.nationality],
            ['No. Telp', detail.phone], ['Email', detail.email],
            ['Dealer', dealerName],
            ...(others.length ? [['Juga diambil oleh', others.map((m) => `${m.me?.name ?? `User #${m.fk_me}`}${m.created_at ? ` (${new Date(m.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })})` : ''}`).join(', ')]] : []),
            ['Didaftarkan oleh', detail.me?.name ?? detail.me?.email],
            ['Diverifikasi oleh', detail.verified_by?.name ?? detail.verifiedBy?.name],
          ].map(([l, v]) => (
            <div key={l}><dt>{l}</dt><dd>{v || '-'}</dd></div>
          ))}
          <div><dt>Status</dt><dd>{statusNode}</dd></div>
        </dl>
        </div>
        {detail.status === 'diterima' && detail.id_temp == null && canTake && !verify && (
          <div className="dash-modal-actions">
            <small className="dash-map-hint">Data konsumen ini akan ditambahkan ke daftar Anda.</small>
            <button id="btn-konsumen-take" type="button" className="dash-btn outline" onClick={() => onTake(detail)}>Ambil Data</button>
          </div>
        )}
        {verify ? (
          <div className="konsumen-verify-panel" role="group" aria-label="Konfirmasi verifikasi">
            <p className="dash-card-desc">
              {verify.status === 'diterima'
                ? <>Yakin menerima data <strong>{detail.konsumen_name || detail.nik}</strong>? Pastikan data dan foto KTP sudah diperiksa.</>
                : verify.status === 'revisi'
                  ? <>Data <strong>{detail.konsumen_name || detail.nik}</strong> dikembalikan ke penginput untuk diperbaiki. Tulis bagian yang perlu direvisi.</>
                  : <>Data <strong>{detail.konsumen_name || detail.nik}</strong> akan ditolak. Tulis alasan penolakan.</>}
            </p>
            {verify.own && (
              <p className="dash-alert warning" role="alert">
                <strong>!</strong> Data ini diinput oleh Anda sendiri. Apakah Anda yakin ingin {verify.text.verb} data tersebut?
              </p>
            )}
            {verify.status !== 'diterima' && (
              <div className="dash-form-group">
                <label htmlFor="konsumen-catatan">{verify.status === 'revisi' ? 'Catatan revisi *' : 'Catatan penolakan *'}</label>
                <textarea
                  id="konsumen-catatan"
                  className="dash-input"
                  rows={3}
                  maxLength={255}
                  value={verify.catatan}
                  onChange={(e) => verify.onCatatan(e.target.value)}
                  placeholder={verify.status === 'revisi' ? 'Contoh: Foto KTP buram, mohon unggah ulang' : 'Contoh: Data tidak sesuai KTP'}
                  autoFocus
                />
                <small className="dash-map-hint">{verify.catatan.length}/255</small>
              </div>
            )}
            <div className="dash-modal-actions">
              <button id="btn-konsumen-verify-cancel" type="button" className="dash-btn outline" onClick={verify.onCancel} disabled={verify.saving}>Batal</button>
              <button id="btn-konsumen-verify-confirm"
                type="button"
                className="dash-btn solid"
                onClick={verify.onConfirm}
                disabled={verify.saving || (verify.status !== 'diterima' && !verify.catatan.trim())}
              >
                {verify.saving ? <><Spin />Memproses...</> : verify.text.confirm}
              </button>
            </div>
          </div>
        ) : canVerify && detail.status === 'pending' && (
          <div className="dash-modal-actions">
            <button id="btn-konsumen-revisi" type="button" className="dash-btn outline" onClick={() => onVerify('revisi')}>Minta Revisi</button>
            <button id="btn-konsumen-reject" type="button" className="dash-btn outline konsumen-verify-reject" onClick={() => onVerify('ditolak')}>Tolak</button>
            <button id="btn-konsumen-accept" type="button" className="dash-btn solid" onClick={() => onVerify('diterima')}>Terima</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KonsumenDetailView;
