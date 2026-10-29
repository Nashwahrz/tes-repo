// src/pages/dashboard/components/Toast.jsx
// Pesan sukses/gagal yang melayang di bawah layar, selalu terlihat walau halaman atau form sedang di-scroll.
import { useEffect } from 'react';

const DURATION = { error: 8000, success: 5000 };

function Toast({ kind = 'error', message, onClose }) {
  // Pesan baru memulai hitung mundur baru; klik tombol x untuk menutup lebih cepat
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(onClose, DURATION[kind] ?? 6000);
    return () => clearTimeout(t);
  }, [message]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) return null;
  return (
    <div data-testid={`toast-${kind}`} className={`dash-toast ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="dash-toast-icon">{kind === 'error' ? '!' : '✓'}</span>
      <span data-testid="toast-text" className="dash-toast-text">{message}</span>
      <button id="btn-toast-close" data-testid="btn-toast-close" type="button" className="dash-toast-close" onClick={onClose} aria-label="Tutup pesan">×</button>
    </div>
  );
}

export default Toast;
