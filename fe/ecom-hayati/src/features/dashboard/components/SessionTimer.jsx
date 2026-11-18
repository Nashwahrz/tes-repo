// Lama user sudah mengakses web sejak login (waktu mulai disimpan di localStorage saat login, jadi tidak reset saat refresh)
import { useEffect, useState } from 'react';

const KEY = 'loginAt';

const startTime = () => {
  try {
    const saved = Number(localStorage.getItem(KEY));
    if (saved) return saved;
    const t = Date.now(); // sesi lama tanpa catatan: mulai hitung dari sekarang
    localStorage.setItem(KEY, String(t));
    return t;
  } catch {
    return Date.now();
  }
};

const pad = (n) => String(n).padStart(2, '0');
const fmt = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
};

function SessionTimer() {
  const [start] = useState(startTime);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span title="Lama Anda mengakses web sejak login">Lama akses: {fmt(now - start)}</span>;
}

export default SessionTimer;
