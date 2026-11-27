import { useState } from 'react';
import MotorCatalogTab from './tabs/MotorCatalogTab';
import MotorUnitTab from './tabs/MotorUnitTab';
import MotorPriceTab from './tabs/MotorPriceTab';

const TABS = {
  'daftar-motor': { label: 'Daftar Motor' },
  'motor-unit': { label: 'Motor Unit' },
  'harga-motor': { label: 'Harga Motor' },
};

export default function MotorPanel({
  can = { import: true, export: true, lihatMotor: true, lihatUnit: true, lihatPrice: true, createUnit: true },
  dealers = [],
}) {
  const lihatMotor = can.lihatMotor ?? true;
  const lihatUnit = can.lihatUnit ?? true;
  const lihatPrice = can.lihatPrice ?? true;
  const createUnit = can.createUnit ?? true;

  const tabs = [
    ...(lihatMotor ? ['daftar-motor'] : []),
    ...(lihatUnit ? ['motor-unit'] : []),
    ...(lihatPrice ? ['harga-motor'] : []),
  ];

  const [tab, setTab] = useState(tabs[0] ?? 'daftar-motor');
  const activeTab = tabs.includes(tab) ? tab : tabs[0];

  const switchTab = (nextTab) => {
    setTab(nextTab);
  };

  return (
    <div>
      {tabs.length > 1 && (
        <div className="dash-tabs wide">
          {tabs.map((k) => (
            <button
              id={`btn-daftar-motor-tab-${k}`}
              key={k}
              type="button"
              className={`dash-tab${activeTab === k ? ' active' : ''}`}
              onClick={() => switchTab(k)}
            >
              {TABS[k].label}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'daftar-motor' && (
        <MotorCatalogTab can={{ import: can.import, export: can.export }} />
      )}

      {activeTab === 'motor-unit' && (
        <MotorUnitTab can={{ create: createUnit }} dealers={dealers} />
      )}
      {activeTab === 'harga-motor' && (
        <MotorPriceTab
          can={{
            create: can.createPrice ?? createUnit,
            import: can.createPrice ?? can.import,
            ubah: can.updatePrice ?? true,
          }}
        />
      )}
    </div>
  );
}
