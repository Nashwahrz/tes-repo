// Jam server yang berdetak tiap detik; tidak tampil bila BE belum mengirim header Date yang terbaca
import { useEffect, useState } from 'react';
import { serverNow, onServerTime } from '../../../api/serverTime';

const FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short',
});

function ServerClock() {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    const sync = () => setNow(serverNow());
    const timer = setInterval(sync, 1000);
    const off = onServerTime(sync);
    return () => { clearInterval(timer); off(); };
  }, []);

  if (!now) return null;
  return <span title="Waktu server (disinkronkan dari respons BE)">Waktu server: {FORMAT.format(now).replace(/\./g, ':')}</span>;
}

export default ServerClock;
