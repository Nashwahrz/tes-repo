// src/pages/dashboard/components/PenjualanPanel.jsx
import { useState } from 'react';
import { SALES_PROTOTYPE } from '../salesPrototype';
import SalesChart from './SalesChart';
import Pager from './Pager';

const STATUS = {
  lunas: { label: 'Lunas', cls: 'diterima' },
  menunggu: { label: 'Menunggu Pembayaran', cls: 'pending' },
  batal: { label: 'Dibatalkan', cls: 'ditolak' },
};

const PAGE_SIZE = 10;

const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
const tanggal = (d) => (d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

function PenjualanPanel({ rows = [], scopeNote }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dealer, setDealer] = useState(''); // id dealer; kosong = semua
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  // Opsi dealer diambil dari baris yang ada (user non-Super Admin hanya mendapat dealernya sendiri)
  const dealers = [...new Map(rows.map((r) => [r.id_dealer, r.dealer])).entries()]
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));

  // Grafik punya pilihan periodenya sendiri, jadi hanya mengikuti filter dealer (bukan filter tanggal tabel)
  const chartRows = dealer ? rows.filter((r) => String(r.id_dealer) === dealer) : rows;
  const dealerLabel = dealer ? dealers.find(([id]) => String(id) === dealer)?.[1] : null;

  const q = query.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (dealer && String(r.id_dealer) !== dealer) return false;
    if (from && r.tanggal < from) return false;
    if (to && r.tanggal > to) return false;
    return !q || `${r.no_transaksi} ${r.konsumen} ${r.motor} ${r.dealer}`.toLowerCase().includes(q);
  });

  // Paginasi di FE (data simulasi dimuat sekaligus); ringkasan dan grafik tetap memakai semua hasil filter
  const lastPage = Math.max(Math.ceil(visible.length / PAGE_SIZE), 1);
  const current = Math.min(page, lastPage);
  const pageRows = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  // Ringkasan dihitung dari transaksi yang tidak dibatalkan
  const valid = visible.filter((r) => r.status !== 'batal');
  const summary = [
    { label: 'Total Transaksi', value: valid.length, unit: 'Transaksi' },
    { label: 'Unit Terjual', value: valid.reduce((n, r) => n + (r.unit ?? 1), 0), unit: 'Unit' },
    { label: 'Total Nilai Penjualan', value: rupiah(valid.reduce((n, r) => n + r.harga, 0)) },
  ];

  const hasFilter = q || status || dealer || from || to;

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
          Penjualan
        </h3>
        <span className="dash-badge">{visible.length} transaksi</span>
      </div>
      <p className="dash-card-desc">Pantau transaksi penjualan motor. {scopeNote}</p>

      {rows.length === 0 ? (
        <p className="dash-alert error">Data penjualan belum tersedia dari server. Tampilan ini akan terisi setelah fitur penjualan di backend siap.</p>
      ) : (
        SALES_PROTOTYPE && (
          <p className="dash-alert warning">Menampilkan data simulasi (prototipe). Fitur ini akan terhubung langsung ke data aktual saat endpoint backend siap.</p>
        )
      )}

      {rows.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <SalesChart rows={chartRows} dealerName={dealerLabel} scopeLabel={dealerLabel ?? (dealers.length > 1 ? 'Semua Dealer' : dealers[0]?.[1])} compact={true} />
        </div>
      )}

      <section className="dash-stats dash-stats-compact">
        {summary.map((s) => (
          <div className="dash-stat" key={s.label}>
            <small>{s.label}</small>
            <div className="dash-stat-val">
              <strong>{s.value}</strong>
              {s.unit && <span>{s.unit}</span>}
            </div>
          </div>
        ))}
      </section>

      <div className="dash-toolbar">
        <input
          className="dash-input dash-input-search"
          type="search"
          placeholder="Cari no. transaksi, konsumen, motor, atau dealer..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <select className="dash-input dash-select-filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Semua status</option>
          {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
        </select>
        {dealers.length > 1 && (
          <select className="dash-input dash-select-filter" value={dealer} aria-label="Filter dealer" onChange={(e) => { setDealer(e.target.value); setPage(1); }}>
            <option value="">Semua dealer</option>
            {dealers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        )}
        <input className="dash-input dash-select-filter" type="date" aria-label="Dari tanggal" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        <input className="dash-input dash-select-filter" type="date" aria-label="Sampai tanggal" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
      </div>

      {visible.length === 0 ? (
        <p className="dash-empty">{hasFilter ? 'Transaksi tidak ditemukan.' : 'Belum ada data penjualan.'}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Transaksi</th>
                <th>Konsumen</th>
                <th>Motor</th>
                <th>Harga</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong className="dash-cell-name">{r.no_transaksi}</strong>
                    <small className="dash-cell-sub">{tanggal(r.tanggal)}</small>
                  </td>
                  <td>{r.konsumen}</td>
                  <td>
                    {r.motor}
                    <small className="dash-cell-sub">{r.dealer}</small>
                  </td>
                  <td>{rupiah(r.harga)}</td>
                  <td><span className={`dash-status ${STATUS[r.status]?.cls ?? ''}`}>{STATUS[r.status]?.label ?? r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={current} lastPage={lastPage} total={visible.length} unit="transaksi" onPage={setPage} />
    </div>
  );
}

export default PenjualanPanel;
