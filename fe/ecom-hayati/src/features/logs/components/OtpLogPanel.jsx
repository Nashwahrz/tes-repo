// src/features/logs/components/OtpLogPanel.jsx
// Riwayat permintaan dan verifikasi OTP dari BE /log-otps. Hanya baca.
import { useEffect, useState } from 'react';
import Toast from '../../../shared/components/Toast';
import Modal from '../../../shared/components/Modal';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import { getOtpLogs, errorMessage } from '../../../api/authServices';

const PURPOSE = { register: 'Register', reset_password: 'Reset Password' };
const ACTION = { REQUESTED: 'Diminta', VERIFIED: 'Berhasil diverifikasi', FAILED: 'Gagal diverifikasi' };

const fmtWaktu = (iso) => (iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-');

function OtpLogPanel() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [purpose, setPurpose] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  // Pencarian ditunda agar tidak memanggil BE di setiap ketukan
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim() === search) return;
      setLoading(true);
      setPage(1);
      setSearch(query.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    let active = true;
    getOtpLogs(page, search, purpose, action)
      .then((res) => { if (active) { setRows(res.rows); setMeta(res.meta); setError(''); setLoading(false); } })
      .catch((err) => { if (active) { setRows([]); setMeta(null); setError(errorMessage(err)); setLoading(false); } });
    return () => { active = false; };
  }, [page, search, purpose, action]);

  const pick = (setter) => (e) => { setLoading(true); setPage(1); setter(e.target.value); };
  const who = (l) => l.user?.name ?? l.email ?? '-';

  return (
    <div>
      <div className="dash-card-head">
        <h3>Riwayat OTP</h3>
      </div>
      <p className="dash-card-desc">Catatan permintaan dan verifikasi kode OTP untuk pendaftaran dan reset password.</p>

      <div className="dash-toolbar">
        <input id="otplog-search" className="dash-input dash-input-search" type="search" placeholder="Cari email atau nama..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select id="otplog-purpose" className="dash-input dash-select-filter" value={purpose} aria-label="Tujuan OTP" onChange={pick(setPurpose)}>
          <option value="">Semua tujuan</option>
          {Object.entries(PURPOSE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select id="otplog-action" className="dash-input dash-select-filter" value={action} aria-label="Aksi OTP" onChange={pick(setAction)}>
          <option value="">Semua aksi</option>
          {Object.entries(ACTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={5} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{search || purpose || action ? 'Riwayat tidak ditemukan.' : 'Belum ada riwayat OTP.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Waktu</th><th>Pengguna</th><th>Tujuan</th><th>Aksi</th><th>IP</th><th className="col-aksi">Rincian</th></tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id}>
                  <td>{fmtWaktu(l.created_at)}</td>
                  <td>
                    <strong className="dash-cell-name">{who(l)}</strong>
                    {l.user && l.email && <small className="dash-cell-sub">{l.email}</small>}
                  </td>
                  <td>{l.purpose_label || PURPOSE[l.purpose] || l.purpose || '-'}</td>
                  <td>{l.action_label || ACTION[l.action] || l.action}</td>
                  <td>{l.ip_address || '-'}</td>
                  <td className="col-aksi"><div className="dash-actions"><IconButton id={`btn-otplog-detail-${l.id}`} icon="view" label="Rincian" onClick={() => setDetail(l)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta && (
        <Pager page={meta.page} lastPage={meta.lastPage} total={meta.total} unit="aktivitas" onPage={(p) => { setLoading(true); setPage(p); }} />
      )}

      {detail && (
        <Modal onClose={() => setDetail(null)} dismissOnBackdrop>
          <div className="dash-modal-head">
            <h3>OTP {detail.purpose_label || PURPOSE[detail.purpose] || ''}: {detail.action_label || detail.action}</h3>
            <button id="btn-otplog-close" type="button" className="dash-modal-close" onClick={() => setDetail(null)} aria-label="Tutup" title="Tutup">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="dash-card-desc">{fmtWaktu(detail.created_at)}</p>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <tbody>
                <tr><td>Pengguna</td><td>{detail.user?.name ?? '-'}</td></tr>
                <tr><td>Email</td><td>{detail.email ?? detail.user?.email ?? '-'}</td></tr>
                <tr><td>Keterangan</td><td>{detail.description || '-'}</td></tr>
                <tr><td>Alamat IP</td><td>{detail.ip_address || '-'}</td></tr>
                <tr><td>Perangkat</td><td>{detail.user_agent || '-'}</td></tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default OtpLogPanel;
