// src/pages/DashboardPage.jsx
import { useState } from 'react';
import KelolaAkunPage from './KelolaAkunPage';

const ROLE_MANAGER = 1;

const MENUS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'produk', label: 'Produk' },
  { key: 'pesanan', label: 'Pesanan' },
  { key: 'dealer', label: 'Dealer' },
  // Hanya Manager (id_role 1) yang bisa mengelola / menyetujui akun
  { key: 'akun', label: 'Kelola Akun', managerOnly: true },
];

function DashboardPage() {
  const [active, setActive] = useState('dashboard');

  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }

  const isManager = user?.id_role === ROLE_MANAGER;
  const menus = MENUS.filter((m) => !m.managerOnly || isManager);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', textAlign: 'left' }}>
      <nav style={{ width: 220, padding: 24, borderRight: '1px solid #ddd' }}>
        <h2>Menu</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menus.map((m) => (
            <li key={m.key} style={{ padding: '8px 0' }}>
              <button
                onClick={() => setActive(m.key)}
                style={{ fontWeight: active === m.key ? 'bold' : 'normal' }}
              >
                {m.label}
              </button>
            </li>
          ))}
        </ul>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        {active === 'akun' && isManager ? (
          <KelolaAkunPage />
        ) : (
          <>
            <h1>{menus.find((m) => m.key === active)?.label}</h1>
            <p>Selamat datang{user?.email ? `, ${user.email}` : ''}.</p>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
