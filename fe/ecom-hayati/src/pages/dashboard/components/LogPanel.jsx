import { useState } from 'react';
import LoginLogPanel from './LoginLogPanel';
import KonsumenLogPanel from './KonsumenLogPanel';
import BlockedUserLogPanel from './BlockedUserLogPanel';

// Satu menu untuk semua log; tab hanya muncul untuk log yang boleh dilihat role
function LogPanel({ canLogin, canKonsumen, canBlocked }) {
  const tabs = [
    ...(canLogin ? [{ key: 'login', label: 'Log Login', Panel: LoginLogPanel }] : []),
    ...(canKonsumen ? [{ key: 'konsumen', label: 'Riwayat Konsumen', Panel: KonsumenLogPanel }] : []),
    ...(canBlocked ? [{ key: 'blokir', label: 'Akun Terblokir', Panel: BlockedUserLogPanel }] : []),
  ];
  const [tab, setTab] = useState(tabs[0].key);
  const { Panel } = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <>
      {tabs.length > 1 && (
        <div className="dash-tabs wide">
          {tabs.map((t) => (
            <button key={t.key} type="button" className={`dash-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      )}
      <Panel />
    </>
  );
}

export default LogPanel;
