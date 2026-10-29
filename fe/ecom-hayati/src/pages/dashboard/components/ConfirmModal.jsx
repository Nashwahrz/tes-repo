// Modal konfirmasi; terkunci selama busy
import { Spin } from './Loading';

function ConfirmModal({ title, children, confirmLabel, busyLabel, busy = false, confirmDisabled = false, onConfirm, onCancel }) {
  return (
    <div className="dash-modal-bg" onClick={() => !busy && onCancel()}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
        <div className="dash-modal-actions">
          <button id="btn-confirm-cancel" data-testid="btn-confirm-cancel" className="dash-btn outline" onClick={onCancel} disabled={busy}>Batal</button>
          <button id="btn-confirm-submit" data-testid="btn-confirm-submit" className="dash-btn solid" onClick={onConfirm} disabled={busy || confirmDisabled}>
            {busy && busyLabel ? <><Spin />{busyLabel}</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
