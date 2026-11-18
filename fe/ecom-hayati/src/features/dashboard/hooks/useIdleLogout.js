import { useEffect, useRef } from 'react';

// Waktu terakhir aktivitas disimpan di localStorage agar semua tab berbagi hitungan yang sama
// (aktif di satu tab = tidak idle; tab lain tidak ikut logout).
const KEY = 'lastActivity';
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
const WRITE_EVERY = 5000; // batasi tulis localStorage
const CHECK_EVERY = 15000;

const readLast = () => {
  try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
};

// Panggil onIdle sekali bila tidak ada aktivitas selama `ms`.
export function useIdleLogout(onIdle, ms) {
  const cb = useRef(onIdle);
  useEffect(() => { cb.current = onIdle; });

  useEffect(() => {
    let lastWrite = 0;
    let fired = false;
    const touch = () => {
      const t = Date.now();
      if (t - lastWrite < WRITE_EVERY) return;
      lastWrite = t;
      try { localStorage.setItem(KEY, String(t)); } catch { /* abaikan */ }
    };
    const check = () => {
      if (fired) return;
      const last = readLast() || Date.now();
      if (Date.now() - last >= ms) {
        fired = true;
        cb.current();
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };

    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* abaikan */ }
    EVENTS.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const id = setInterval(check, CHECK_EVERY);
    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(id);
    };
  }, [ms]);
}
