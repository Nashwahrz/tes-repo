import { useEffect, useId, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal bertumpuk: hanya yang teratas menanggapi Esc/Tab
const stack = [];
let scrollLocks = 0;

// onClose kosong = modal terkunci (mis. sedang menyimpan)
function Modal({ as: Tag = 'div', className = '', onClose, dismissOnBackdrop = false, closeOnEscape = true, children, ...rest }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const escRef = useRef(closeOnEscape);
  const uid = useId();
  useEffect(() => { closeRef.current = onClose; escRef.current = closeOnEscape; });

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const heading = dialog.querySelector('h1, h2, h3');
    if (heading) {
      heading.id ||= `${uid}-title`;
      dialog.setAttribute('aria-labelledby', heading.id);
    }
    const token = {};
    stack.push(token);
    scrollLocks += 1;
    document.body.style.overflow = 'hidden';

    if (!dialog.contains(document.activeElement)) {
      const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      (items.find((el) => /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) ?? items[0] ?? dialog).focus();
    }

    const onKey = (e) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape' && escRef.current && closeRef.current) {
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = [...dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (items.length === 0) { e.preventDefault(); return; }
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      scrollLocks -= 1;
      if (scrollLocks === 0) document.body.style.overflow = '';
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, [uid]);

  return (
    <div className="dash-modal-bg" onClick={dismissOnBackdrop && onClose ? onClose : undefined}>
      <Tag
        ref={dialogRef}
        className={`dash-modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {children}
      </Tag>
    </div>
  );
}

export default Modal;
