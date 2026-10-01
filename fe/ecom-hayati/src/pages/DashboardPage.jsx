// src/pages/DashboardPage.jsx
const MENUS = ['Dashboard', 'Produk', 'Pesanan', 'Dealer'];

function DashboardPage() {
  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch {
    user = null;
  }

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
          {MENUS.map((m) => (
            <li key={m} style={{ padding: '8px 0' }}>{m}</li>
          ))}
        </ul>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Selamat datang{user?.email ? `, ${user.email}` : ''}.</p>
      </main>
    </div>
  );
}

export default DashboardPage;
