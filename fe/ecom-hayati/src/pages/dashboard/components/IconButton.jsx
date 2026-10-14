// Tombol aksi untuk baris tabel: ikon + teks agar jelas fungsinya. `compact` hanya menampilkan ikon (teks jadi tooltip)
const ICONS = {
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></>,
  delete: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
  view: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></>,
  check: <path d="M20 6L9 17l-5-5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  redo: <><path d="M3 12a9 9 0 019-9 9 9 0 016.4 2.6L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-9 9 9 9 0 01-6.4-2.6L3 16" /><path d="M3 21v-5h5" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
};

// tone: 'ok' (hijau terisi), 'danger' (merah); tanpa tone = netral
function IconButton({ icon, label, tone, compact, ...rest }) {
  return (
    <button type="button" className={`ico-btn${tone ? ` ${tone}` : ''}${compact ? ' compact' : ''}`} title={label} aria-label={label} {...rest}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[icon]}</svg>
      {!compact && <span>{label}</span>}
    </button>
  );
}

export default IconButton;
