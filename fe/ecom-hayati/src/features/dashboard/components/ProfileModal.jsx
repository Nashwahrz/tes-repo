// Profil user login (BE: GET /profile). Di sini juga tempat mengganti foto profil (POST /profile/photo).
import { useEffect, useRef, useState } from 'react';
import { getProfile, getProfilePhoto, uploadProfilePhoto, errorMessage } from '../../../api/authServices';
import { compressImage } from '../../../utils/compressImage';
import Modal from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading';
import Toast from '../../../shared/components/Toast';
import { PHOTO_CHANGED } from './ProfileAvatar';

const MAX_BYTES = 500 * 1024; // batas BE 512KB
const ACCEPT = 'image/jpeg,image/png,image/webp';

const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '-');

function ProfileModal({ onClose }) {
  const [profile, setProfile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ kind: 'error', message: '' });
  const input = useRef(null);
  const photoRef = useRef(null);

  const setPhotoUrl = (url) => {
    if (photoRef.current) URL.revokeObjectURL(photoRef.current);
    photoRef.current = url;
    setPhoto(url);
  };

  useEffect(() => {
    let active = true;
    getProfile()
      .then((p) => { if (active) setProfile(p); })
      .catch((err) => { if (active) setError(err.response ? errorMessage(err) : 'Profil gagal dimuat.'); });
    getProfilePhoto()
      .then((u) => { if (active) setPhotoUrl(u); else if (u) URL.revokeObjectURL(u); })
      .catch(() => {});
    return () => { active = false; if (photoRef.current) URL.revokeObjectURL(photoRef.current); };
  }, []);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const { file: ready } = await compressImage(file, MAX_BYTES);
      await uploadProfilePhoto(ready);
      setPhotoUrl(await getProfilePhoto());
      window.dispatchEvent(new Event(PHOTO_CHANGED)); // avatar di sidebar ikut diperbarui
      setToast({ kind: 'success', message: 'Foto profil berhasil diperbarui.' });
    } catch (err) {
      setToast({ kind: 'error', message: err.response ? errorMessage(err) : err.message || 'Foto profil gagal diunggah.' });
    } finally {
      setBusy(false);
    }
  };

  const rows = profile && [
    ['Email', profile.email],
    ['Role', profile.role?.name],
    ['Dealer', profile.dealer?.name],
    ['Alamat Dealer', profile.dealer?.alamat],
    ['Atasan', profile.atasan?.name],
    ['Status', cap(profile.status?.value ?? profile.status)],
    ['Verifikasi Email', profile.email_verifikasi ? 'Terverifikasi' : 'Belum terverifikasi'],
  ];

  return (
    <>
      <Modal className="profile-modal" onClose={busy ? undefined : onClose} dismissOnBackdrop>
        <div className="dash-modal-head">
          <h3>Profil Saya</h3>
          <button id="btn-profile-close" type="button" className="dash-modal-close" onClick={onClose} disabled={busy} aria-label="Tutup" title="Tutup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {error && <p className="login-error" role="alert">{error}</p>}
        {!profile && !error && <Loading />}
        {profile && (
          <>
            <div className="profile-hero">
              <span className="dash-avatar profile-photo">
                {photo ? <img src={photo} alt="Foto profil" /> : (profile.name || '?').charAt(0).toUpperCase()}
              </span>
              <strong>{profile.name || '-'}</strong>
              <button id="btn-profile-photo" type="button" className="dash-btn outline" onClick={() => input.current?.click()} disabled={busy}>
                {busy ? 'Mengunggah...' : 'Ganti Foto Profil'}
              </button>
              <input ref={input} type="file" accept={ACCEPT} hidden onChange={pick} />
            </div>
            <dl className="profile-list">
              {rows.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>
              ))}
            </dl>
          </>
        )}
      </Modal>
      <Toast kind={toast.kind} message={toast.message} onClose={() => setToast((t) => ({ ...t, message: '' }))} />
    </>
  );
}

export default ProfileModal;
