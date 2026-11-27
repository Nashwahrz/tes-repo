import { useEffect, useState } from 'react';
import {
  getMotorUnitsPage,
  getDealers,
  errorMessage,
} from '../../../../api/authServices';
import Toast from '../../../../shared/components/Toast';
import Loading from '../../../../shared/components/Loading';
import Pager from '../../../../shared/components/Pager';
import IconButton from '../../../../shared/components/IconButton';
import DetailModal from '../../../../shared/components/DetailModal';
import MotorUnitFormModal from '../modals/MotorUnitFormModal';

const STATUS_STYLES = {
  AVAILABLE:  { label: 'Tersedia',          bg: '#ecfdf3', color: '#067647', border: '#abefc6' }, // hijau
  RESERVED:   { label: 'Dipesan',           bg: '#fffaeb', color: '#b54708', border: '#fedf89' }, // amber
  IN_TRANSIT: { label: 'Dalam Pengiriman',  bg: '#eff8ff', color: '#175cd3', border: '#b2ddff' }, // biru (bergerak)
  SOLD:       { label: 'Terjual',           bg: '#f2f4f7', color: '#344054', border: '#d0d5dd' }, // abu-abu (selesai)
  DAMAGED:    { label: 'Rusak',             bg: '#fef3f2', color: '#b42318', border: '#fecdca' }, // merah
};

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'AVAILABLE', label: 'Tersedia' },
  { value: 'RESERVED', label: 'Dipesan' },
  { value: 'SOLD', label: 'Terjual' },
  { value: 'IN_TRANSIT', label: 'Dalam Pengiriman' },
  { value: 'DAMAGED', label: 'Rusak' },
];

export default function MotorUnitTab({ can = { create: true }, dealers = [] }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, perPage: 10 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [dealerOptions, setDealerOptions] = useState(dealers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [recentId, setRecentId] = useState(null);

  useEffect(() => {
    if (dealers.length > 0) {
      setDealerOptions(dealers);
      return undefined;
    }
    let active = true;
    getDealers()
      .then((res) => { if (active) setDealerOptions(res); })
      .catch(() => {});
    return () => { active = false; };
  }, [dealers]);

  const fetchUnits = async (
    targetPage = page,
    searchTerm = query,
    statusFilter = status,
    dealerFilter = dealerId,
  ) => {
    setLoading(true);
    try {
      const res = await getMotorUnitsPage({
        page: targetPage,
        search: searchTerm.trim() || undefined,
        status: statusFilter || undefined,
        dealer_id: dealerFilter || undefined,
        per_page: 10,
      });
      setRows(res.rows);
      setMeta(res.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits(page, query, status, dealerId);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, query, status, dealerId]);

  const renderStatus = (val) => {
    const cfg = STATUS_STYLES[val] ?? { label: val || '-', bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          background: cfg.bg,
          color: cfg.color,
          fontWeight: 600,
          fontSize: '0.82em',
          border: `1px solid ${cfg.border}`,
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </span>
    );
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
          </svg>
          Motor Unit
        </h3>
        {can.create && (
          <button
            id="btn-unit-motor-create"
            data-testid="button-unit-motor-create"
            className="dash-btn solid"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setCreateOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Create Unit Motor</span>
          </button>
        )}
      </div>
      <p className="dash-card-desc">Daftar unit fisik motor berdasarkan nomor rangka, nomor mesin, dealer, dan status unit.</p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input
          id="motor-unit-search"
          data-testid="input-search-motor-unit"
          className="dash-input dash-input-search"
          style={{ marginBottom: 0, flex: '1 1 260px' }}
          type="search"
          placeholder="Cari Unit Motor ..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          id="motor-unit-status"
          data-testid="select-status-motor-unit"
          className="dash-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          id="motor-unit-dealer"
          data-testid="select-dealer-motor-unit"
          className="dash-select"
          value={dealerId}
          onChange={(e) => {
            setDealerId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Semua Dealer</option>
          {dealerOptions.map((d) => (
            <option key={d.id} value={d.id}>{d.dealer_name}</option>
          ))}
        </select>
      </div>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{query || status || dealerId ? 'Unit motor tidak ditemukan.' : 'Belum ada data unit motor.'}</p>
      ) : (
        <>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>No</th>
                  <th>Motor</th>
                  <th>No. Rangka / Mesin</th>
                  <th>Dealer</th>
                  <th>Status</th>
                  <th className="col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u, index) => (
                  <tr
                    key={u.id}
                    style={u.id === recentId ? { background: '#f0fdf4', transition: 'background 0.3s ease' } : undefined}
                  >
                    <td style={{ textAlign: 'center' }} className="acc-muted">
                      {((meta.page || 1) - 1) * (meta.perPage || 10) + index + 1}
                    </td>
                    <td>
                      <div>
                        <strong>{u.motor?.market_name || u.item_code}</strong>
                        {u.id === recentId && (
                          <span
                            style={{
                              marginLeft: 6,
                              padding: '1px 6px',
                              fontSize: '0.72em',
                              fontWeight: 700,
                              borderRadius: 4,
                              background: '#16a34a',
                              color: '#fff',
                              verticalAlign: 'middle',
                            }}
                          >
                            Baru
                          </span>
                        )}
                      </div>
                      <div className="acc-muted" style={{ fontSize: '0.85em' }}>
                        {u.motor ? `${u.motor.type_code} · ${u.motor.color_description}` : u.item_code}
                      </div>
                    </td>
                    <td>
                      <strong className="dash-cell-name">{u.nomor_rangka}</strong>
                      <div className="acc-muted" style={{ fontSize: '0.85em' }}>Mesin: {u.nomor_mesin}</div>
                    </td>
                    <td>{u.dealer?.dealer_name || '-'}</td>
                    <td>{renderStatus(u.status)}</td>
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton
                          id={`btn-motor-unit-detail-${u.id}`}
                          data-testid="button-detail-motor-unit"
                          icon="view"
                          label="Detail"
                          onClick={() => setDetailRow(u)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pager
            page={meta.page}
            lastPage={meta.lastPage}
            total={meta.total}
            unit="unit"
            onPage={setPage}
          />
        </>
      )}

      {detailRow && (
        <DetailModal
          title="Detail Motor Unit"
          items={[
            ['Nama Pasar', detailRow.motor?.market_name || '-'],
            ['Nomor Rangka', detailRow.nomor_rangka],
            ['Nomor Mesin', detailRow.nomor_mesin],
            ['Kode Item', detailRow.item_code],
            ['Tipe / Warna', detailRow.motor ? `${detailRow.motor.type_code} - ${detailRow.motor.color_description}` : '-'],
            ['Dealer', detailRow.dealer?.dealer_name || '-'],
            ['Status', STATUS_STYLES[detailRow.status]?.label ?? detailRow.status],
            ...(detailRow.dikunci_oleh ? [['Dikunci Oleh', detailRow.dikunci_oleh?.name || detailRow.dikunciOleh?.name || '-']] : []),
            ...(detailRow.tanggal_terjual ? [['Tanggal Terjual', detailRow.tanggal_terjual]] : []),
          ]}
          onClose={() => setDetailRow(null)}
        />
      )}

      {createOpen && (
        <MotorUnitFormModal
          dealers={dealers}
          onSuccess={(res) => {
            const created = res?.data;
            setRecentId(created?.id ?? null);
            setSuccess(
              created?.nomor_rangka
                ? `Unit ${created.nomor_rangka} (${created.item_code}) berhasil ditambahkan.`
                : (res?.message || 'Unit fisik motor baru berhasil diinput ke sistem.'),
            );
            setQuery('');
            setStatus('');
            setDealerId('');
            setPage(1);
            fetchUnits(1, '', '', '');
          }}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </div>
  );
}
