import { useRef, useState } from 'react';
import Modal from './Modal';
import { Spin } from './Loading';
import { errorMessage } from '../../api/shared';

const DEFAULT_EXTS = ['xlsx', 'xls'];
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; 

export default function ImportModal({
  title = 'Import Data',
  description,
  allowedExtensions = DEFAULT_EXTS,
  maxSizeBytes = DEFAULT_MAX_BYTES,
  onImport,
  onSuccess,
  onClose,
  templateAction, 
}) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const acceptString = allowedExtensions.map((ext) => `.${ext}`).join(',');
  const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);

  const validateAndSetFile = (f) => {
    if (!f) return;
    setError('');
    setResult(null);

    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      setError(`Format berkas tidak valid. Harap gunakan berkas: .${allowedExtensions.join(', .')}`);
      return;
    }

    if (f.size > maxSizeBytes) {
      setError(`Ukuran berkas melebihi batas maksimal ${maxSizeMB}MB.`);
      return;
    }

    setFile(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    validateAndSetFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!importing) setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (importing) return;
    const f = e.dataTransfer.files?.[0];
    validateAndSetFile(f);
  };

  const handleProcessImport = async () => {
    if (!file || !onImport) return;
    setImporting(true);
    setError('');
    setResult(null);

    try {
      const res = await onImport(file);
      setResult(res);
      if (onSuccess) onSuccess(res);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  const stats = result?.data || result || {};
  const successCount = stats.success_count ?? stats.ok ?? 0;
  const UnchangedCount = stats.unchanged_count;
  const createdCount = stats.created_count;
  const updatedCount = stats.updated_count;
  const failedCount = stats.failed_count ?? stats.failed ?? 0;
  const errorList = stats.errors || [];

  return (
    <Modal onClose={importing ? undefined : onClose} dismissOnBackdrop={!importing}>
      <div className="dash-modal-head">
        <h3>{title}</h3>
        {!importing && (
          <button type="button" className="dash-modal-close" onClick={onClose} aria-label="Tutup" title="Tutup">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {description && <p className="dash-card-desc" style={{ marginTop: 8 }}>{description}</p>}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept={acceptString}
        onChange={handleFileChange}
      />

      {!result && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px dashed ${dragOver ? '#2563eb' : '#cbd5e1'}`,
            borderRadius: 8,
            padding: '26px 16px',
            textAlign: 'center',
            margin: '16px 0',
            background: dragOver ? '#eff6ff' : '#f8fafc',
            cursor: importing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => !importing && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', marginBottom: 6 }}>
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <strong style={{ display: 'block', fontSize: '1.05em', lineHeight: 1.3 }}>{file.name}</strong>
              <span className="acc-muted" style={{ fontSize: '0.85em', marginTop: 2 }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <div style={{ marginTop: 8 }}>
                <span style={{ color: '#2563eb', fontSize: '0.88em', textDecoration: 'underline' }}>
                  Pilih / seret berkas lain
                </span>
              </div>
            </div>
          ) : (
            <div id="upload-dropzone-content" data-testid="upload-dropzone-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', marginBottom: 8 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <strong style={{ fontSize: '1.05em', lineHeight: 1.3 }}>Klik atau seret berkas ke sini</strong>
              <div className="acc-muted" style={{ fontSize: '0.85em', marginTop: 4 }}>
                Mendukung {allowedExtensions.map((x) => `.${x}`).join(', ')} (Maks. {maxSizeMB}MB)
              </div>
            </div>
          )}
        </div>
      )}

      {templateAction && !result && !importing && (
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="dash-btn outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: '0.85em',
            }}
            onClick={templateAction.onDownload}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span style={{ lineHeight: 1 }}>{templateAction.label || 'Unduh Template'}</span>
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            color: '#dc2626',
            fontSize: '0.9em',
            margin: '12px 0',
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            margin: '16px 0',
            padding: 14,
            background: failedCount > 0 && successCount === 0 ? '#fff1f2' : '#f0fdf4',
            border: `1px solid ${failedCount > 0 && successCount === 0 ? '#fecdd3' : '#bbf7d0'}`,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              color: failedCount > 0 && successCount === 0 ? '#e11d48' : '#16a34a',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            {result.message || (failedCount > 0 && successCount === 0 ? 'Impor Gagal' : 'Impor Berhasil')}
          </div>
          <div style={{ fontSize: '0.9em', color: '#334155' }}>
            <div>• Berhasil diproses: <strong>{successCount}</strong></div>
            {UnchangedCount !== undefined && <div>• Data tidak berubah: <strong>{UnchangedCount}</strong></div>}
            {createdCount !== undefined && <div>• Data baru ditambahkan: <strong>{createdCount}</strong></div>}
            {updatedCount !== undefined && <div>• Data diperbarui: <strong>{updatedCount}</strong></div>}
            <div>• Gagal: <strong>{failedCount}</strong></div>

            {Array.isArray(errorList) && errorList.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  maxHeight: 120,
                  overflowY: 'auto',
                  background: '#fff',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid #e2e8f0',
                }}
              >
                <strong style={{ color: '#dc2626' }}>Catatan Kesalahan:</strong>
                <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '0.85em', color: '#dc2626' }}>
                  {errorList.map((errItem, idx) => (
                    <li key={idx}>{typeof errItem === 'string' ? errItem : JSON.stringify(errItem)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dash-modal-actions" style={{ marginTop: 20 }}>
        <button id="btn-close-import-file" data-testid="btn-close-import-file" type="button" className="dash-btn" onClick={onClose} disabled={importing}>
          {result ? 'Tutup' : 'Batal'}
        </button>
        {!result && (
          <button
            type="button"
            id="btn-import-file"
            data-testid="btn-import-file"
            className="dash-btn solid"
            disabled={!file || importing}
            onClick={handleProcessImport}
          >
            {importing ? <Spin /> : 'Proses Import'}
          </button>
        )}
      </div>
    </Modal>
  );
}
