import { useEffect, useState } from 'react';
import {
  getMotorsPage,
  importMotors,
  exportMotors,
  errorMessage,
} from '../../../api/authServices';
import Toast from '../../../shared/components/Toast';
import Loading from '../../../shared/components/Loading';
import Pager from '../../../shared/components/Pager';
import IconButton from '../../../shared/components/IconButton';
import ImportModal from '../../../shared/components/ImportModal';
import DetailModal from '../../../shared/components/DetailModal';

export default function MotorPanel({ can = { import: true, export: true } }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, lastPage: 1, total: 0, perPage: 10 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exporting, setExporting] = useState(false);

  const [detailRow, setDetailRow] = useState(null);

  const [importOpen, setImportOpen] = useState(false);

  const fetchMotors = async (targetPage = page, searchTerm = query) => {
    setLoading(true);
    try {
      const res = await getMotorsPage({
        page: targetPage,
        search: searchTerm.trim() || undefined,
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

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      await exportMotors(query.trim());
      setSuccess('Data motor berhasil diekspor.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMotors(page, query);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, query]);

  return (
    <div>
      <div className="dash-card-head">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 6 }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          Daftar Motor
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {can.export && (
            <button
              id="btn-motor-export"
              data-testid="button-export-data-motor"
              className="dash-btn outline"
              style={{ display: 'inline-flex', alignItems: 'center', background: '#f0fdf4',borderColor: '#86efac',color: '#15803d', gap: 6 }}
              disabled={exporting}
              onClick={handleExport}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{exporting ? 'Mengunduh...' : 'Export Motors'}</span>
            </button>
          )}
          {can.import && (
            <button
              id="btn-motor-import"
              data-testid="button-import-data-motor"
              className="dash-btn solid"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setImportOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Import Motors</span>
            </button>
          )}
        </div>
      </div>
      <p className="dash-card-desc">Master katalog motor: data diperbarui secara terpusat melalui impor berkas (.utc, .txt, .csv, .xlsx, .xls).</p>

      <input
        id="motor-search"
        data-testid="button-search-data-motor"
        className="dash-input dash-input-search"
        type="search"
        placeholder="Cari kode tipe, warna, atau nama pasar motor..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
      />

      <Toast kind="success" message={success} onClose={() => setSuccess('')} />
      <Toast kind="error" message={error} onClose={() => setError('')} />

      {loading ? (
        <Loading rows={4} />
      ) : rows.length === 0 ? (
        <p className="dash-empty">{query ? 'Data motor tidak ditemukan.' : 'Belum ada data motor.'}</p>
      ) : (
        <>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Warna</th>
                  <th>Nama Pasar</th>
                  <th>Kelas</th>
                  <th>Periode</th>
                  <th className="col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong className="dash-cell-name">{m.type_code}</strong>
                      <div className="acc-muted" style={{ fontSize: '0.85em' }}>{m.type_description}</div>
                    </td>
                    <td>
                      <div><strong>{m.color_code}</strong></div>
                      <div className="acc-muted" style={{ fontSize: '0.85em' }}>{m.color_description}</div>
                    </td>
                    <td>{m.market_name}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#f1f5f9',
                          color: '#334155',
                          fontWeight: 600,
                          fontSize: '0.85em',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {m.class}
                      </span>
                    </td>
                    <td className="acc-muted" style={{ fontSize: '0.88em' }}>
                      {m.start_date} {m.end_date ? `s/d ${m.end_date}` : '(Aktif)'}
                    </td>
                    <td className="col-aksi">
                      <div className="dash-actions">
                        <IconButton
                          id={`btn-motor-detail-${m.id}`}
                          data-testid="button-detail-data-motor"
                          icon="view"
                          label="Detail"
                          onClick={() => setDetailRow(m)}
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
            unit="motor"
            onPage={setPage}
          />
        </>
      )}

      {detailRow && (
        <DetailModal
          title="Detail Motor"
          items={[
            ['Kode Tipe', detailRow.type_code],
            ['Deskripsi Tipe', detailRow.type_description],
            ['Kode Warna', detailRow.color_code],
            ['Deskripsi Warna', detailRow.color_description],
            ['Nama Pasar', detailRow.market_name],
            ['Kelas', detailRow.class],
            ['Periode', `${detailRow.start_date} ${detailRow.end_date ? `s/d ${detailRow.end_date}` : '(Aktif)'}`],
          ]}
          onClose={() => setDetailRow(null)}
        />
      )}

      {importOpen && (
        <ImportModal
          title="Import Data Motor"
          description="Pilih berkas dari komputer Anda. Mendukung berkas .utc, .txt, .csv, atau Excel (.xlsx, .xls) dengan ukuran maksimal 500KB."
          allowedExtensions={['utc', 'txt', 'csv', 'xlsx', 'xls']}
          maxSizeBytes={500 * 1024}
          onImport={importMotors}
          onSuccess={(res) => {
            setSuccess(res?.message || 'Data motor berhasil diimpor.');
            fetchMotors(1, query);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
    </div>
  );
}
