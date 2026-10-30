// Modal konfirmasi; terkunci selama busy
import { Spin } from './Loading';
import Modal from './Modal';

function ConfirmModal({ title, children, confirmLabel, busyLabel, busy = false, confirmDisabled = false, onConfirm, onCancel }) {
  return (
    <Modal onClose={busy ? undefined : onCancel} dismissOnBackdrop>
      <h3>{title}</h3>
      {children}
      <div className="dash-modal-actions">
        <button id="btn-confirm-cancel" className="dash-btn outline" onClick={onCancel} disabled={busy}>Batal</button>
        <button id="btn-confirm-submit" className="dash-btn solid" onClick={onConfirm} disabled={busy || confirmDisabled}>
          {busy && busyLabel ? <><Spin />{busyLabel}</> : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
