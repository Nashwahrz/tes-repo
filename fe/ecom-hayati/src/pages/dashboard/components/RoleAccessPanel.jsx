// Kelola hak akses role: menu (/role-menus) dan permission (/role-permissions)
import { useEffect, useState } from 'react';
import Toast from './Toast';
import Loading, { Spin } from './Loading';
import Pager from './Pager';
import {
  getRoleMenus, updateRoleMenus, getRolePermissions, updateRolePermissions, errorMessage,
} from '../../../api/authServices';

// Menu BE yang belum dipakai FE: disembunyikan dari daftar centang. Id-nya tetap ada di state `selected`,
// jadi hak yang sudah tersimpan tidak hilang saat role disimpan. Hapus dari daftar ini untuk menampilkannya lagi.
const UNUSED_MENU_URLS = [
  'daftar-konsumen', // duplikat "Daftar Konsumen"; menu yang dipakai FE/BE adalah 'konsumens'
  // 'laporan-penjualan', // belum ada halamannya di FE (buka komentar bila ingin disembunyikan juga)
];

// Konfigurasi per tab; field BE: roles[].menus / roles[].permissions
const PAGE_SIZE = 10;

// Permission dinamai `<menu>.<aksi>` (mis. konsumens.tambah); yang berawalan sama satu grup menu
const GROUP_LABEL = {
  dealers: 'Daftar Dealer',
  users: 'Manajemen User',
  'role-menus': 'Role & Hak Akses (Menu)',
  'role-permissions': 'Role & Hak Akses (Permission)',
  konsumens: 'Daftar Konsumen',
  'email-whitelists': 'Email WhiteList',
  'log-users': 'Log Users Login',
  agamas: 'Daftar Agama',
  pekerjaans: 'Daftar Pekerjaan',
  'configurasi-rate-limits': 'Setting Rate Limit',
};
const groupKey = (name) => name.split('.')[0];

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
    groupOf: (i) => groupKey(i.nama_permission),
  },
};

function RoleAccessPanel({ canMenu, canPermission, onSaved }) {
  const tabs = Object.keys(TABS).filter((k) => (k === 'menu' ? canMenu : canPermission));
  const [tab, setTab] = useState(tabs[0]);
  const [data, setData] = useState(null); // { roles, <itemsKey>: [] }
  const [roleId, setRoleId] = useState(null);
  const [selected, setSelected] = useState([]); // id menu/permission untuk role terpilih
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [group, setGroup] = useState(''); // filter grup menu (tab permission); kosong = semua

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
    setQuery('');
    setGroup('');
    setPage(1);
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
    setConfirming(false);
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
      onSaved?.(); // hak akses user yang sedang login bisa ikut berubah
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const role = data?.roles.find((r) => r.id === roleId);
  const items = (data?.[cfg.itemsKey] ?? []).filter((i) => !UNUSED_MENU_URLS.includes(i.url));
  const groupKeys = cfg.groupOf ? [...new Set(items.map(cfg.groupOf))] : [];
  const q = query.trim().toLowerCase();
  const shown = items
    .filter((i) => !group || cfg.groupOf(i) === group)
    .filter((i) => !q || cfg.nameOf(i).toLowerCase().includes(q));
  const lastPage = Math.max(Math.ceil(shown.length / PAGE_SIZE), 1);
  const current = Math.min(page, lastPage);
  const pageItems = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const activeCount = items.filter((i) => selected.includes(i.id)).length;
  const dirty = role && [...selected].sort().join() !== idsOf(role).sort().join();

  return (
    <div>
      {tabs.length > 1 && (
        <div className="dash-tabs wide">
          {tabs.map((k) => (
            <button key={k} className={`dash-tab${tab === k ? ' active' : ''}`} onClick={() => switchTab(k)}>
              {TABS[k].label}
            </button>
          ))}
        </div>
      )}

      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
          Role &amp; Hak Akses
        </h3>
        {data && <span className="dash-badge">{activeCount} dari {items.length} {cfg.label.toLowerCase()}</span>}
      </div>
      <p className="dash-card-desc">Atur menu dan permission yang dimiliki tiap role.</p>

      <Toast kind="error" message={error} onClose={() => setError('')} />
      <Toast kind="success" message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <Loading rows={4} />
      ) : !data || data.roles.length === 0 ? (
        <p className="dash-empty">Belum ada data role.</p>
      ) : (
        <>
          <div className="dash-toolbar">
            <input
              className="dash-input dash-input-search"
              type="search"
              placeholder={`Cari ${cfg.label.toLowerCase()}...`}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
            {cfg.groupOf && (
              <select className="dash-input dash-select-filter" value={group} aria-label="Filter grup menu" onChange={(e) => { setGroup(e.target.value); setPage(1); }}>
                <option value="">Semua Grup</option>
                {groupKeys.map((g) => <option key={g} value={g}>{GROUP_LABEL[g] ?? g}</option>)}
              </select>
            )}
            <select className="dash-input dash-select-filter" value={roleId ?? ''} aria-label="Pilih role" onChange={(e) => { pickRole(Number(e.target.value)); setPage(1); }}>
              {data.roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="dash-empty">{q ? `${cfg.label} tidak ditemukan.` : `Belum ada ${cfg.label.toLowerCase()}.`}</p>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>{cfg.label}</th>
                    <th>Status</th>
                    <th className="col-aksi">Akses</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((i) => {
                    const on = selected.includes(i.id);
                    return (
                      <tr key={i.id}>
                        <td><label htmlFor={`${tab}-${i.id}`}><strong className="dash-cell-name">{cfg.nameOf(i)}</strong></label></td>
                        <td><span className={`dash-status ${on ? 'aktif' : 'nonaktif'}`}>{on ? 'Diizinkan' : 'Tidak'}</span></td>
                        <td className="col-aksi">
                          <input type="checkbox" className="ra-check" id={`${tab}-${i.id}`} checked={on} onChange={() => toggle(i.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pager page={current} lastPage={lastPage} total={shown.length} unit={cfg.label.toLowerCase()} onPage={setPage} />

          <div className="dash-modal-actions">
            <button className="dash-btn solid" onClick={() => setConfirming(true)} disabled={saving || !dirty}>
              {saving ? <><Spin />Menyimpan...</> : 'Simpan Perubahan'}
            </button>
          </div>
        </>
      )}

      {confirming && role && (
        <div className="dash-modal-bg" onClick={() => setConfirming(false)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Simpan Perubahan</h3>
            <p className="dash-card-desc">
              Yakin ingin mengubah hak akses {cfg.label.toLowerCase()} untuk role <strong>{role.name}</strong>?
            </p>
            <div className="dash-modal-actions">
              <button className="dash-btn outline" onClick={() => setConfirming(false)}>Batal</button>
              <button className="dash-btn solid" onClick={handleSave}>Ya, Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleAccessPanel;
