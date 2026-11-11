// src/features/master/components/MasterImportModal.jsx
// Tambah data master lewat file Excel: pilih file -> unggah ke BE (POST {path}/import). Template diunduh dari sini.
import { useState } from 'react';
import { importMaster, errorMessage } from '../../../api/authServices';
import { downloadMasterTemplate, masterImportHeaders, MASTER_CODE_LENGTH, IMPORT_MAX_BYTES } from '../../../api/masterExcel';
import { Spin } from '../../../shared/components/Loading';
import Modal from '../../../shared/components/Modal';

// 422 format file memberi `errors` berupa array teks per baris; selain itu pakai pesan umum
const importError = (err) => {
  const data = err.response?.data;
  const list = data?.errors;
  if (Array.isArray(list)) return { title: data.message || 'Impor gagal.', errors: list };
  return { title: 'Impor gagal.', errors: [errorMessage(err)] };
};

function MasterImportModal({ tab, onClose, onImported }) {
  const [phase, setPhase] = useState('pick'); // pick | ready | running | done
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // { ok, failed, errors }
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    if (!/\.xlsx?$/i.test(f.name)) return setError('Format file harus .xlsx atau .xls (Excel).');
    if (f.size > IMPORT_MAX_BYTES) return setError('Ukuran file maksimal 2MB.');
    setFile(f);
    setPhase('ready');
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
    setError('');
    setPhase('running');
    try {
      const res = await importMaster(tab.path, file);
      setResult(res);
      setPhase('done');
      if (res.ok > 0) onImported();
    } catch (err) {
      setResult({ ok: 0, failed: 0, ...importError(err) });
      setPhase('done');
    }
  };

  const cols = masterImportHeaders(tab).join(', ');
  const isPekerjaan = tab.key === 'pekerjaan';

  return (
    <Modal onClose={phase === 'running' ? undefined : onClose} dismissOnBackdrop>
      <h3>Impor {tab.label} dari Excel</h3>

      {phase === 'pick' && (
        <>
          {isPekerjaan ? (
            <p className="dash-card-desc">
              Unduh template, isi datanya, lalu unggah kembali. Kolom: <strong>{cols}</strong>.{' '}
              Pekerjaan memakai hierarki 2 tingkat (<strong>H</strong>=Header, <strong>D</strong>=Detail).{' '}
              Kode bebas 1–3 karakter. <strong>sector_job</strong>: Formal / Informal / Tidak Bekerja.{' '}
              <strong>id_parent</strong> Detail = kode Header induk. Impor Header sebelum Detail.
            </p>
          ) : (
            <p className="dash-card-desc">Unduh template, isi datanya, lalu unggah kembali. Kolom: <strong>{cols}</strong>. Kode <strong>{MASTER_CODE_LENGTH[tab.key]} digit</strong> angka. Semua data baru berstatus aktif.</p>
          )}
          <div className="dash-form-group">
            <button id="btn-import-template" type="button" className="dash-btn outline" onClick={handleTemplate}>Unduh template Excel</button>
          </div>
          <div className="dash-form-group">
            <label htmlFor="master-file">File Excel (.xlsx / .xls, maks. 2MB)</label>
            <input id="master-file" className="dash-input" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleFile} />
          </div>
        </>
      )}

      {phase === 'ready' && file && (
        <p className="dash-card-desc">File <strong>{file.name}</strong> ({Math.max(1, Math.round(file.size / 1024))} KB) siap diimpor. Baris yang tidak valid dilewati dan dilaporkan setelah proses selesai.</p>
      )}

      {phase === 'running' && (
        <p className="dash-card-desc"><Spin /> Mengimpor {tab.label.toLowerCase()}... Jangan tutup halaman ini.</p>
      )}

      {phase === 'done' && result && (
        <>
          {result.title ? (
            <p className="dash-alert error">{result.title}</p>
          ) : (
            <p className="dash-card-desc">
              <strong>{result.ok}</strong> {tab.label.toLowerCase()} berhasil ditambahkan{result.failed > 0 && <>, <strong>{result.failed}</strong> baris ditolak server</>}.
            </p>
          )}
          {result.errors.length > 0 && (
            <div className={`dash-alert ${result.title ? 'error' : 'warning'}`}>
              <strong>{result.errors.length} kesalahan:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, maxHeight: 240, overflowY: 'auto' }}>
                {result.errors.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
        </>
      )}

      {error && <p className="dash-alert error">{error}</p>}

      <div className="dash-modal-actions">
        {phase === 'running' ? null : phase === 'done' ? (
          <button id="btn-import-done" type="button" className="dash-btn solid" onClick={onClose}>Selesai</button>
        ) : (
          <>
            <button id="btn-import-cancel" type="button" className="dash-btn outline" onClick={onClose}>Batal</button>
            {phase === 'ready' && (
              <>
                <button id="btn-import-change-file" type="button" className="dash-btn outline" onClick={() => { setPhase('pick'); setFile(null); }}>Ganti file</button>
                <button id="btn-import-submit" type="button" className="dash-btn solid" onClick={handleImport}>Impor</button>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

export default MasterImportModal;
