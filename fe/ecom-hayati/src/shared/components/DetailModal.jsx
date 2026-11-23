import Modal from './Modal';

export default function DetailModal({
  title = 'Detail Data',
  items = [],
  children,
  onClose,
  actions,
}) {
  return (
    <Modal onClose={onClose} dismissOnBackdrop>
      <div className="dash-modal-head">
        <h3>{title}</h3>
        <button
          type="button"
          className="dash-modal-close"
          onClick={onClose}
          aria-label="Tutup"
          title="Tutup"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {items.length > 0 && (
        <dl className="dash-detail" style={{ marginTop: 14 }}>
          {items.map((item, idx) => {
            const label = Array.isArray(item) ? item[0] : item.label;
            const value = Array.isArray(item) ? item[1] : item.value;
            const isBold = Array.isArray(item) ? (item[2] ?? true) : (item.bold ?? true);

            return (
              <div key={idx}>
                <dt>{label}</dt>
                <dd>
                  {isBold ? <strong>{value ?? '-'}</strong> : (value ?? '-')}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      {children}

      <div className="dash-modal-actions" style={{ marginTop: 20 }}>
        {actions}
        <button type="button" className="dash-btn" onClick={onClose}>
          Tutup
        </button>
      </div>
    </Modal>
  );
}
