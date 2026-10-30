import { useEffect, useRef, useState } from 'react';
import { MENU_ACC, MENU_KONSUMEN } from './menuPaths';

export const accSig = (list) => list.filter((u) => u.email_verifikasi && u.status === 'pending').map((u) => u.id).sort().join(',');
export const konsumenSig = (t) => `${t.pending}|${t.ditolak}`;

const readSeen = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};

export function useChangeWatcher({ userId, watchAcc, watchKonsumen, pendingUsers, konsumenStatus, onAccChanged }) {
  // Pemicu render ulang setelah markSeen
  const [, bump] = useState(0);
  const key = (m) => `seen:${userId}:${m}`;

  const current = {
    [MENU_ACC]: watchAcc && pendingUsers ? accSig(pendingUsers) : undefined,
    [MENU_KONSUMEN]: watchKonsumen && konsumenStatus ? konsumenSig(konsumenStatus) : undefined,
  };

  const changed = {};
  for (const [m, sig] of Object.entries(current)) {
    const seen = readSeen(key(m));
    changed[m] = sig !== undefined && seen !== null && seen !== sig;
  }

  const markSeen = (m, sig) => {
    try { localStorage.setItem(key(m), sig); } catch { /* penyimpanan penuh: abaikan */ }
    bump((n) => n + 1);
  };

  // Kunjungan pertama jadi acuan
  const accNow = current[MENU_ACC];
  const konNow = current[MENU_KONSUMEN];
  useEffect(() => {
    try {
      if (accNow !== undefined && localStorage.getItem(`seen:${userId}:${MENU_ACC}`) === null) localStorage.setItem(`seen:${userId}:${MENU_ACC}`, accNow);
      if (konNow !== undefined && localStorage.getItem(`seen:${userId}:${MENU_KONSUMEN}`) === null) localStorage.setItem(`seen:${userId}:${MENU_KONSUMEN}`, konNow);
    } catch { /* abaikan */ }
  }, [userId, accNow, konNow]);

  const lastAcc = useRef(undefined);
  useEffect(() => {
    if (accNow === undefined) return;
    if (lastAcc.current !== undefined && lastAcc.current !== accNow) onAccChanged();
    lastAcc.current = accNow;
  }, [accNow, onAccChanged]);

  const consume = (m) => {
    if (!changed[m]) return false;
    markSeen(m, current[m]);
    return true;
  };

  return { changed, markSeen, consume };
}
