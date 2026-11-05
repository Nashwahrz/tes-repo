import { useState } from 'react';
import LoginLogPanel from './LoginLogPanel';
import KonsumenLogPanel from './KonsumenLogPanel';
import BlockedUserLogPanel from './BlockedUserLogPanel';
import ActivityLogPanel from './ActivityLogPanel';

// Satu menu untuk semua log; tab hanya muncul untuk log yang boleh dilihat role
function LogPanel({ canLogin, canKonsumen, canBlocked, sources = [] }) {
  const tabs = [
    ...(canLogin ? [{ key: 'login', label: 'Log Login', render: () => <LoginLogPanel /> }] : []),
    ...(canKonsumen ? [{ key: 'konsumen', label: 'Riwayat Konsumen', render: () => <KonsumenLogPanel /> }] : []),
    ...(canBlocked ? [{ key: 'blokir', label: 'Akun Terblokir', render: () => <BlockedUserLogPanel /> }] : []),
    ...(sources.length ? [{ key: 'data', label: 'Perubahan Data', render: () => <ActivityLogPanel sources={sources} /> }] : []),
  ];
  const [tab, setTab] = useState(tabs[0].key);
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <>
      {tabs.length > 1 && (
        <div className="dash-tabs wide">
          {tabs.map((t) => (
            <button id={`btn-log-tab-${t.key}`} key={t.key} type="button" className={`dash-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      )}
      {active.render()}
    </>
  );
}

export default LogPanel;
