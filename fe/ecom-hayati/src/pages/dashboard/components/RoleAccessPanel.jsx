// Kelola hak akses role: menu (/role-menus) dan permission (/role-permissions)
import { useEffect, useState } from 'react';
import {
  getRoleMenus, updateRoleMenus, getRolePermissions, updateRolePermissions, errorMessage,
} from '../../../api/authServices';

// Konfigurasi per tab; field BE: roles[].menus / roles[].permissions
const TABS = {
  menu: {
    label: 'Menu',
    load: getRoleMenus,
    save: updateRoleMenus,
    itemsKey: 'menus',
    nameOf: (i) => i.nama_menu,
  },
  permission: {
    label: 'Permission',
    load: getRolePermissions,
    save: updateRolePermissions,
    itemsKey: 'permissions',
    nameOf: (i) => i.nama_permission,
  },
};

function RoleAccessPanel({ canMenu, canPermission }) {
  const tabs = Object.keys(TABS).filter((k) => (k === 'menu' ? canMenu : canPermission));
  const [tab, setTab] = useState(tabs[0]);
  const [data, setData] = useState(null); // { roles, <itemsKey>: [] }
  const [roleId, setRoleId] = useState(null);
  const [selected, setSelected] = useState([]); // id menu/permission untuk role terpilih
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cfg = TABS[tab];
  const idsOf = (role) => (role[cfg.itemsKey] ?? []).map((i) => i.id);

  useEffect(() => {
    let active = true;
    cfg.load()
      .then((res) => {
        if (!active) return;
        setData(res);
        const first = res.roles[0];
        setRoleId(first?.id ?? null);
        setSelected(first ? (first[cfg.itemsKey] ?? []).map((i) => i.id) : []);
      })
      .catch((err) => active && setError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = (k) => {
    setTab(k);
    setLoading(true);
    setError('');
    setSuccess('');
  };

  const pickRole = (id) => {
    setRoleId(id);
    setSelected(idsOf(data.roles.find((r) => r.id === id)));
    setError('');
    setSuccess('');
  };

  const toggle = (id) => {
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await cfg.save(roleId, selected);
      // Sinkronkan daftar role lokal dengan hasil dari BE
      setData((d) => ({
        ...d,
        roles: d.roles.map((r) => (r.id === roleId ? { ...r, [cfg.itemsKey]: res.data[cfg.itemsKey] } : r)),
      }));
      setSuccess(`Hak akses ${cfg.label.toLowerCase()} untuk role ${res.data.name} disimpan.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const role = data?.roles.find((r) => r.id === roleId);
  const items = data?.[cfg.itemsKey] ?? [];
  const dirty = role && [...selected].sort().join() !== idsOf(role).sort().join();

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
          Role &amp; Hak Akses
        </h3>
      </div>
      <p className="dash-card-desc">Atur menu dan permission yang dimiliki tiap role.</p>

      {tabs.length > 1 && (
        <div className="dash-tabs">
          {tabs.map((k) => (
            <button key={k} className={`dash-tab${tab === k ? ' active' : ''}`} onClick={() => switchTab(k)}>
              {TABS[k].label}
            </button>
          ))}
        </div>
      )}

      {error && <p className="dash-alert error">{error}</p>}
      {success && <p className="dash-alert success">{success}</p>}

      {loading ? (
        <p className="dash-empty">Memuat...</p>
      ) : !data || data.roles.length === 0 ? (
        <p className="dash-empty">Belum ada data role.</p>
      ) : (
        <>
          <div className="dash-form-group">
            <label htmlFor="role-select">Role</label>
            <select id="role-select" className="dash-select" value={roleId ?? ''} onChange={(e) => pickRole(Number(e.target.value))}>
              {data.roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Akses</th>
                  <th>{cfg.label}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <input
                        type="checkbox"
                        id={`${tab}-${i.id}`}
                        checked={selected.includes(i.id)}
                        onChange={() => toggle(i.id)}
                      />
                    </td>
                    <td><label htmlFor={`${tab}-${i.id}`}>{cfg.nameOf(i)}</label></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-modal-actions">
            <button className="dash-btn solid" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default RoleAccessPanel;
