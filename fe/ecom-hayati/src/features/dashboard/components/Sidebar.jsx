import { useEffect, useState } from 'react';
import Icon from './Icon';
import { MENU_ICONS } from '../navConfig';
import { MENU_PATHS } from '../menuPaths';

const LOGO_SRC = '/logo.png';

const menuId = (m) => `menu-${MENU_PATHS[m].slice(1).replace(/\//g, '-')}`;

function Sidebar({ nav, menu, badges, changed, name, role, dealer, onSelect, onLogout }) {
  // Sidebar desktop bisa disembunyikan; pilihan diingat di localStorage
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('dash-side-hidden') === '1'; } catch { return false; }
  });
  const toggleHidden = () => setHidden((h) => {
    try { localStorage.setItem('dash-side-hidden', h ? '0' : '1'); } catch { /* abaikan */ }
    return !h;
  });
  const [open, setOpen] = useState(false); // menu samping terbuka (hanya berpengaruh di layar kecil)

  // Esc menutup menu samping
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Grup terbuka bila berisi menu aktif, kecuali pengguna melipatnya sendiri (atau membukanya)
  const [groupToggle, setGroupToggle] = useState({});
  const groupOpen = (g) => groupToggle[g.group] ?? g.items.includes(menu);
  const toggleGroup = (g) => setGroupToggle((t) => ({ ...t, [g.group]: !groupOpen(g) }));

  const select = (m) => { setOpen(false); onSelect(m); };

  // Tetap <li> agar id dan gaya lama utuh, plus akses keyboard
  const renderMenuItem = (m, sub = false) => (
    <li
      id={menuId(m)}
      key={m}
      className={`dash-menu-item${sub ? ' sub' : ''}${menu === m ? ' active' : ''}`}
      role="link"
      tabIndex={0}
      aria-current={menu === m ? 'page' : undefined}
      onClick={() => select(m)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(m); } }}
    >
      {!sub && <Icon name={MENU_ICONS[m]} size={17} />}
      {changed[m] && <span className="dash-menu-dot" title="Ada perubahan data" />}
      {m}
      {badges[m] > 0 && <span className="dash-menu-badge" title={`${badges[m]} menunggu`}>{badges[m] > 99 ? '99+' : badges[m]}</span>}
    </li>
  );

  return (
    <>
      {open && <div className="dash-scrim" onClick={() => setOpen(false)} />}
      <aside className={`dash-side${open ? ' open' : ''}${hidden ? ' hidden' : ''}`}>
        <div className="dash-brand">
          <img src={LOGO_SRC} alt="Logo Hayati" />
          <div>
            <strong>Hayati</strong>
            <small>Management Workspace</small>
          </div>
        </div>
        <button id="btn-sidebar-hide" type="button" className="dash-collapse" aria-label="Sembunyikan sidebar" title="Sembunyikan sidebar" onClick={toggleHidden}>
          <Icon name="chevronsLeft" size={18} />
        </button>
        <button
          id="btn-nav-burger"
          type="button"
          className="dash-burger"
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} size={20} />
        </button>

        <ul className="dash-menu" aria-label="Menu utama">
          {nav.map((n) => {
            if (!n.group) return renderMenuItem(n.item);
            const isOpen = groupOpen(n);
            const total = n.items.reduce((sum, m) => sum + (badges[m] || 0), 0);
            return (
              <li key={n.group} className={`dash-menu-group${isOpen ? ' open' : ''}${n.items.includes(menu) ? ' has-active' : ''}`}>
                <button id={`btn-nav-group-${n.group.toLowerCase().replace(/\W+/g, '-')}`} type="button" className="dash-menu-group-head" aria-expanded={isOpen} onClick={() => toggleGroup(n)}>
                  <Icon name={n.icon} size={17} />
                  {n.group}
                  {!isOpen && total > 0 && <span className="dash-menu-badge" title={`${total} menunggu`}>{total > 99 ? '99+' : total}</span>}
                  {!isOpen && total === 0 && n.items.some((m) => changed[m]) && <span className="dash-menu-dot dash-menu-dot-inline" title="Ada perubahan data" />}
                  <span className="dash-menu-chevron"><Icon name="chevron" size={14} /></span>
                </button>
                {isOpen && <ul className="dash-submenu">{n.items.map((m) => renderMenuItem(m, true))}</ul>}
              </li>
            );
          })}
        </ul>

        <div className="dash-side-foot">
          <div className="dash-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="dash-side-user">
            <strong>{name}</strong>
            <small>{role ? `${role}${dealer ? ` · ${dealer}` : ''}` : 'Pengguna'}</small>
          </div>
          <button id="btn-logout" className="dash-logout" onClick={() => { setOpen(false); onLogout(); }} title="Keluar dari akun">
            <Icon name="logout" size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {hidden && (
        <button id="btn-sidebar-show" type="button" className="dash-expand" aria-label="Tampilkan sidebar" title="Tampilkan sidebar" onClick={toggleHidden}>
          <Icon name="chevronsRight" size={18} />
        </button>
      )}
    </>
  );
}

export default Sidebar;
