import { useEffect, useState } from 'react';
import { getMotorsPage, errorMessage } from '../../../api/authServices';
import Modal from '../../../shared/components/Modal';
import { Spin } from '../../../shared/components/Loading';

const formatMotorLabel = (m) =>
  `${m.item_code} — ${m.market_name} (${m.type_code} · ${m.color_description})`;

export default function MotorSelect({
  id = 'motor-select',
  label = 'Model Motor (Kode Item)',
  required = true,
  value = '',
  error = '',
  onChange,
  onError,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [options, setOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value && selected) {
      setSelected(null);
    }
  }, [value, selected]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getMotorsPage({
          page: 1,
          per_page: 10,
          search: search.trim() || undefined,
        });
        if (!active) return;
        setOptions(res.rows);
        setTotal(res.meta?.total ?? res.rows.length);
      } catch (err) {
        if (active) onError?.(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, search, onError]);

  const handleOpen = () => {
    setSearch('');
    setOpen(true);
  };

  const handleSelect = (m) => {
    setSelected(m);
    onChange?.(m.item_code, m);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelected(null);
    onChange?.('', null);
  };

  const displayText = selected
    ? formatMotorLabel(selected)
    : value
      ? value
      : '';

  return (
    <div className={`dash-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>

      <div style={{ position: 'relative' }}>
        <button
          id={id}
          type="button"
          className={`dash-input ${error ? 'dash-input-error' : ''}`}
          style={{
            width: '100%',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingRight: displayText ? 34 : 12,
            cursor: 'pointer',
            background: '#fff',
            color: displayText ? 'var(--ink, #1e293b)' : '#94a3b8',
          }}
          onClick={handleOpen}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayText || '-- Pilih Model Motor --'}
          </span>
          {!displayText && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 8 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </button>

        {displayText && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Hapus pilihan motor"
            title="Hapus pilihan"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 0,
              cursor: 'pointer',
              color: '#64748b',
              padding: 4,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="dash-field-error">{error}</p>}

      {open && (
        <Modal onClose={() => setOpen(false)} dismissOnBackdrop>
          <div className="dash-modal-head">
            <h3>Pilih Model Motor</h3>
            <button
              type="button"
              className="dash-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
              title="Tutup"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <input
            type="search"
            className="dash-input"
            style={{ marginTop: 10, marginBottom: 12 }}
            placeholder="Cari kode item, tipe, warna, atau nama pasar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              maxHeight: 320,
              overflowY: 'auto',
              background: '#fff',
            }}
          >
            {loading ? (
              <div style={{ padding: '18px 14px', fontSize: '0.9em', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Spin /> <span>Mencari model motor...</span>
              </div>
            ) : options.length === 0 ? (
              <div style={{ padding: '20px 14px', fontSize: '0.9em', color: '#64748b', textAlign: 'center' }}>
                Model motor tidak ditemukan.
              </div>
            ) : (
              <>
                {options.map((m) => {
                  const isSelected = value === m.item_code;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelect(m)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        border: 0,
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#fff0e6' : '#fff',
                        color: '#1e293b',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                    >
                      <div>
                        <div>
                          <strong>{m.item_code}</strong> — {m.market_name}
                        </div>
                        <div style={{ fontSize: '0.84em', color: '#64748b', marginTop: 2 }}>
                          {m.type_code} · {m.color_description} ({m.class})
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ color: 'var(--accent, #c42d00)', fontWeight: 600, fontSize: '0.85em', flexShrink: 0 }}>
                          Terpilih
                        </span>
                      )}
                    </button>
                  );
                })}
                {total > options.length && (
                  <div style={{ padding: '8px 12px', fontSize: '0.82em', color: '#64748b', background: '#f8fafc', textAlign: 'center' }}>
                    Menampilkan {options.length} dari {total} hasil — ketik lebih spesifik untuk menyaring
                  </div>
                )}
              </>
            )}
          </div>

          <div className="dash-modal-actions" style={{ marginTop: 14 }}>
            <button type="button" className="dash-btn outline" onClick={() => setOpen(false)}>
              Tutup
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
