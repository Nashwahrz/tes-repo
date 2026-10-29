// src/pages/dashboard/components/MasterImportModal.jsx
// Tambah data master lewat file Excel (.xlsx): pilih file -> periksa -> impor. Template diunduh dari sini.
import { useRef, useState } from 'react';
import { importMaster, errorMessage } from '../../../api/authServices';
import { downloadMasterTemplate, parseMasterExcel } from '../../../api/masterExcel';
import { Spin } from './Loading';

const SHOW = 10; // jumlah baris masalah yang ditampilkan
const BIG = 2000; // di atas ini, beri peringatan karena tiap baris dikirim sebagai satu permintaan

function MasterImportModal({ tab, onClose, onImported }) {
  const [phase, setPhase] = useState('pick'); // pick | ready | running | done
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState({ rows: [], errors: [] });
  const [progress, setProgress] = useState({ done: 0, ok: 0 });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cancelled = useRef(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      if (!/\.xlsx$/i.test(file.name)) throw new Error('Format file harus .xlsx (Excel).');
      setParsed(await parseMasterExcel(file, tab));
      setFileName(file.name);
      setPhase('ready');
    } catch (err) {
      setError(err.response ? errorMessage(err) : err.message || 'File Excel tidak dapat dibaca.');
    } finally {
      setBusy(false);
    }
  };

  const handleTemplate = async () => {
    setError('');
    try {
      await downloadMasterTemplate(tab);
    } catch {
      setError('Template tidak dapat dibuat.');
    }
  };

  const handleImport = async () => {
    cancelled.current = false;
    const total = parsed.rows.length;
    setProgress({ done: 0, ok: 0 });
    setPhase('running');
    const res = await importMaster(tab.path, parsed.rows, {
      // Tampilan diperbarui tiap beberapa baris saja agar file besar tidak membuat halaman berat
      onProgress: (done, ok) => { if (done % 10 === 0 || done === total) setProgress({ done, ok }); },
      isCancelled: () => cancelled.current,
    });
    setResult(res);
    setPhase('done');
    if (res.ok > 0) onImported();
  };

  const total = parsed.rows.length;
  const cols = tab.parent ? `Kode, Kode ${tab.parent.label}, Nama` : 'Kode, Nama';

  return (
    <div className="dash-modal-bg" onClick={() => phase !== 'running' && onClose()}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Impor {tab.label} dari Excel</h3>

        {phase === 'pick' && (
          <>
            <p className="dash-card-desc">Unduh template, isi datanya, lalu unggah kembali. Kolom: <strong>{cols}</strong>. Semua data baru berstatus aktif.</p>
            <div className="dash-form-group">
              <button id="btn-import-template" data-testid="btn-import-template" type="button" className="dash-btn outline" onClick={handleTemplate}>Unduh template Excel</button>
            </div>
            <div className="dash-form-group">
              <label htmlFor="master-file">File Excel (.xlsx)</label>
              <input id="master-file" data-testid="master-file" className="dash-input" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFile} disabled={busy} />
              {busy && <p className="dash-map-hint"><Spin /> Membaca file...</p>}
            </div>
          </>
        )}

        {phase === 'ready' && (
          <>
            <p className="dash-card-desc">File <strong>{fileName}</strong>: <strong>{total}</strong> baris siap diimpor{parsed.errors.length > 0 && <>, <strong>{parsed.errors.length}</strong> baris dilewati karena tidak valid</>}.</p>
            {parsed.errors.length > 0 && (
              <div className="dash-alert warning">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {parsed.errors.slice(0, SHOW).map((x) => <li key={x.line}>Baris {x.line}: {x.message}</li>)}
                </ul>
                {parsed.errors.length > SHOW && <p style={{ margin: '6px 0 0' }}>...dan {parsed.errors.length - SHOW} lainnya.</p>}
              </div>
            )}
            {total > BIG && <p className="dash-alert warning">Jumlah data besar: tiap baris dikirim satu per satu, jadi proses bisa memakan waktu beberapa menit. Jangan tutup halaman selama berjalan.</p>}
            {total === 0 && <p className="dash-empty">Tidak ada baris valid untuk diimpor.</p>}
          </>
        )}

        {phase === 'running' && (
          <>
            <p className="dash-card-desc"><Spin /> Mengimpor... <strong>{progress.done}</strong> dari <strong>{total}</strong> baris. Jangan tutup halaman ini.</p>
            <progress value={progress.done} max={total} style={{ width: '100%' }} />
          </>
        )}

        {phase === 'done' && result && (
          <>
            <p className="dash-card-desc">
              {result.cancelled && 'Impor dibatalkan. '}
              <strong>{result.ok}</strong> {tab.label.toLowerCase()} berhasil ditambahkan{result.failures.length > 0 && <>, <strong>{result.failures.length}</strong> ditolak server</>}.
            </p>
            {result.failures.length > 0 && (
              <div className="dash-alert warning">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.failures.slice(0, SHOW).map((x) => <li key={x.line}>Baris {x.line} (kode {x.kode}): {x.message}</li>)}
                </ul>
                {result.failures.length > SHOW && <p style={{ margin: '6px 0 0' }}>...dan {result.failures.length - SHOW} lainnya.</p>}
              </div>
            )}
          </>
        )}

        {error && <p className="dash-alert error">{error}</p>}

        <div className="dash-modal-actions">
          {phase === 'running' ? (
            <button id="btn-import-abort" data-testid="btn-import-abort" type="button" className="dash-btn outline" onClick={() => { cancelled.current = true; }}>Batalkan</button>
          ) : phase === 'done' ? (
            <button id="btn-import-done" data-testid="btn-import-done" type="button" className="dash-btn solid" onClick={onClose}>Selesai</button>
          ) : (
            <>
              <button id="btn-import-cancel" data-testid="btn-import-cancel" type="button" className="dash-btn outline" onClick={onClose}>Batal</button>
              {phase === 'ready' && (
                <>
                  <button id="btn-import-change-file" data-testid="btn-import-change-file" type="button" className="dash-btn outline" onClick={() => { setPhase('pick'); setParsed({ rows: [], errors: [] }); }}>Ganti file</button>
                  <button id="btn-import-submit" data-testid="btn-import-submit" type="button" className="dash-btn solid" onClick={handleImport} disabled={total === 0}>Impor {total} data</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MasterImportModal;
