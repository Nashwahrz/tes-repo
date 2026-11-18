// Avatar di sidebar (hanya tampil): foto profil dari BE (/profile/photo) atau huruf pertama nama.
// Foto diganti dari jendela Profil Saya; di sana event PHOTO_CHANGED dikirim agar avatar ini memuat ulang.
import { useEffect, useState } from 'react';
import { getProfilePhoto } from '../../../api/authServices';

export const PHOTO_CHANGED = 'profile-photo-changed';

function ProfileAvatar({ name }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let active = true;
    let current = null;
    const load = () => getProfilePhoto().then((url) => {
      if (!active) { if (url) URL.revokeObjectURL(url); return; }
      if (current) URL.revokeObjectURL(current);
      current = url;
      setSrc(url);
    }).catch(() => {});
    load();
    window.addEventListener(PHOTO_CHANGED, load);
    return () => {
      active = false;
      window.removeEventListener(PHOTO_CHANGED, load);
      if (current) URL.revokeObjectURL(current);
    };
  }, []);

  return (
    <div className="dash-avatar dash-avatar-photo">
      {src ? <img src={src} alt="" /> : name.charAt(0).toUpperCase()}
    </div>
  );
}

export default ProfileAvatar;
