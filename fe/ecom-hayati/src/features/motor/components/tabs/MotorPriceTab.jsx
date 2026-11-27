// src/features/motor/components/MotorPriceTab.jsx
import { useEffect, useState } from 'react';
import {
  getMotorPricesPage,
  setMotorPriceStatus,
  importMotorPrice,
  errorMessage,
} from '../../../../api/authServices';
import Toast from '../../../../shared/components/Toast';
import Loading, { Spin } from '../../../../shared/components/Loading';
import Pager from '../../../../shared/components/Pager';
import IconButton from '../../../../shared/components/IconButton';
import Switch from '../../../../shared/components/Switch';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import DetailModal from '../../../../shared/components/DetailModal';
import MotorPriceFormModal from '../modals/MotorPriceFormModal';
import { formatRp } from '../../utils/formatters';
import ImportModal from '../../../../shared/components/ImportModal';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'non-aktif', label: 'Non-Aktif' },
];

const isAktif = (val) => String(val).toLowerCase() === 'aktif';

export default function MotorPriceTab({ can = { import: true, create: true, ubah: true } }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, perPage: 10 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [recentId, setRecentId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [toToggle, setToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const fetchPrices = async (targetPage = page, searchTerm = query, statusFilter = status) => {
    setLoading(true);
    try {
      const res = await getMotorPricesPage({
        page: targetPage,
        search: searchTerm.trim() || undefined,
        status: statusFilter || undefined,
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
      fetchPrices(page, query, status);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, query, status]);

  const handleConfirmToggle = async () => {
    if (!toToggle) return;
    setToggling(true);
    setError('');
    try {
      const nextStatus = !isAktif(toToggle.status);
      const res = await setMotorPriceStatus(toToggle.id, nextStatus);
      setSuccess(res?.message || `Harga motor ${toToggle.item_code} berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
      setToToggle(null);
      fetchPrices(page, query, status);
    } catch (err) {
      setError(errorMessage(err));
      setToToggle(null);
    } finally {
      setToggling(false);
    }
  };

  const renderStatus = (val) => {
    const active = isAktif(val);
    return (
      <span className={`dash-status ${active ? 'aktif' : 'nonaktif'}`}>
        {active ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Harga Motor
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {can.import && (
            <button
              id="btn-motor-price-import"
              data-testid="button-import-price-motor"
              className="dash-btn outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setImportOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Import Excel</span>
            </button>
          )}
          {can.create && (
            <button
              id="btn-motor-price-create"
              data-testid="button-motor-price-create"
              className="dash-btn solid"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setCreateOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Create Harga Motor</span>
            </button>
          )}
        </div>
      </div>
      <p className="dash-card-desc">Daftar master harga motor: harga kosong, BBN TNKB, dan harga OTR (Hitam & Merah).</p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <input
          id="motor-price-search"
          data-testid="input-search-motor-price"
          className="dash-input dash-input-search"
          style={{ marginBottom: 0, flex: '1 1 260px' }}
          type="search"
          placeholder="Cari kode item, tipe, atau nama pasar motor..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <select
          id="motor-price-status"
          data-testid="select-status-motor-price"
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
      </div>

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{query || status ? 'Data harga motor tidak ditemukan.' : 'Belum ada data harga motor.'}</p>
      ) : (
        <>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: 50, textAlign: 'center' }}>No</th>
                  <th>Motor</th>
                  <th>Produksi</th>
                  <th>Harga Kosong</th>
                  <th>OTR Hitam</th>
                  <th>OTR Merah</th>
                  <th>Status</th>
                  <th className="col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, index) => (
                  <tr
                    key={p.id}
                    style={p.id === recentId ? { background: '#f0fdf4', transition: 'background 0.3s ease' } : undefined}
                  >
                    <td style={{ textAlign: 'center' }} className="acc-muted">
                      {((meta.page || 1) - 1) * (meta.perPage || 10) + index + 1}
                    </td>
                    <td>
                      <div>
                        <strong className="dash-cell-name">{p.motor?.market_name || p.item_code}</strong>
                        {p.id === recentId && (
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
                        {p.item_code} {p.motor ? `· ${p.motor.type_code} · ${p.motor.color_description}` : ''}
                      </div>
                    </td>
                    <td >{p.tahun_produksi}</td>
                    <td>{formatRp(p.harga_kosong)}</td>
                    <td><strong>{formatRp(p.otr_hitam)}</strong></td>
                    <td><strong>{formatRp(p.otr_merah)}</strong></td>
                    <td>
                      {can.ubah ? (
                        <Switch
                          id={`btn-motor-price-status-${p.id}`}
                          checked={isAktif(p.status)}
                          label={isAktif(p.status) ? 'Nonaktifkan' : 'Aktifkan'}
                          onToggle={() => setToToggle(p)}
                        />
                      ) : (
                        renderStatus(p.status)
                      )}
                    </td>
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton
                          id={`btn-motor-price-detail-${p.id}`}
                          data-testid="button-detail-motor-price"
                          icon="view"
                          label="Detail"
                          onClick={() => setDetailRow(p)}
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
            unit="harga"
            onPage={setPage}
          />
        </>
      )}

      {detailRow && (
        <DetailModal
          title="Detail Harga Motor"
          items={[
            ['Kode Item', detailRow.item_code],
            ['Nama Pasar', detailRow.motor?.market_name || '-'],
            ['Tipe / Warna', detailRow.motor ? `${detailRow.motor.type_code} - ${detailRow.motor.color_description}` : '-'],
            ['Tahun Produksi', detailRow.tahun_produksi],
            ['Harga Kosong', formatRp(detailRow.harga_kosong)],
            ['BBN TNKB Hitam', formatRp(detailRow.bbn_tnkb_hitam)],
            ['BBN TNKB Merah', formatRp(detailRow.bbn_tnkb_merah)],
            ['OTR Hitam', formatRp(detailRow.otr_hitam)],
            ['OTR Merah', formatRp(detailRow.otr_merah)],
            ['Status', detailRow.status],
          ]}
          onClose={() => setDetailRow(null)}
        />
      )}

      {createOpen && (
        <MotorPriceFormModal
          onSuccess={(res) => {
            const created = res?.data;
            setRecentId(created?.id ?? null);
            setSuccess(
              created?.item_code
                ? `Harga motor ${created.item_code} (${created.tahun_produksi}) berhasil ditambahkan.`
                : (res?.message || 'Harga motor baru berhasil diinput ke sistem.'),
            );
            setQuery('');
            setStatus('');
            setPage(1);
            fetchPrices(1, '', '');
          }}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {toToggle && (
        <ConfirmModal
          title={isAktif(toToggle.status) ? 'Nonaktifkan Harga Motor' : 'Aktifkan Harga Motor'}
          confirmLabel={toggling ? <Spin /> : (isAktif(toToggle.status) ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan')}
          onConfirm={handleConfirmToggle}
          onCancel={() => !toggling && setToToggle(null)}
        >
          <p>
            Yakin ingin {isAktif(toToggle.status) ? 'menonaktifkan' : 'mengaktifkan'} harga motor{' '}
            <strong>{toToggle.item_code} ({toToggle.tahun_produksi})</strong>?
          </p>
        </ConfirmModal>
      )}
      {importOpen && (
        <ImportModal
          title="Import Harga Motor"
          description="Pilih berkas Excel dari komputer Anda. Mendukung format .xlsx atau .xls dengan ukuran maksimal 2MB."
          allowedExtensions={['xlsx', 'xls']}
          maxSizeBytes={2 * 1024 * 1024}
          onImport={importMotorPrice}
          onSuccess={(res) => {
            setSuccess(res?.message || 'Master harga motor berhasil diimpor.');
            setPage(1);
            fetchPrices(1, query, status);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
