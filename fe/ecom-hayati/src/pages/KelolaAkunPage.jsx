// src/pages/KelolaAkunPage.jsx
import { useEffect, useState } from 'react';
import { getUsers, updateUserStatus } from '../api/userServices';

function KelolaAkunPage() {
  const [users, setUsers]     = useState([]);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId]   = useState(null);

  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((data) => {
        if (cancelled) return;
        setUsers(data);
        setError('');
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Gagal memuat data akun.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const handleChange = async (id, status) => {
    setBusyId(id);
    try {
      await updateUserStatus(id, status);
      setReload((n) => n + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengubah status.');
    } finally {
      setBusyId(null);
    }
  };

  const me = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  return (
    <div>
      <h1>Kelola Akun</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Memuat...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Nama', 'Email', 'Role', 'Status', 'Aksi'].map((h) => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ padding: 8 }}>{u.name}</td>
                <td style={{ padding: 8 }}>{u.email}</td>
                <td style={{ padding: 8 }}>{u.role || '-'}</td>
                <td style={{ padding: 8 }}>{u.label}</td>
                <td style={{ padding: 8 }}>
                  {u.id === me?.id ? (
                    '-'
                  ) : (
                    <>
                      {u.status !== 'aktif' && (
                        <button disabled={busyId === u.id} onClick={() => handleChange(u.id, 'aktif')}>
                          Setujui
                        </button>
                      )}
                      {u.status !== 'nonaktif' && (
                        <button
                          disabled={busyId === u.id}
                          onClick={() => handleChange(u.id, 'nonaktif')}
                          style={{ marginLeft: 8 }}
                        >
                          {u.status === 'pending' ? 'Tolak' : 'Nonaktifkan'}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default KelolaAkunPage;
