// src/pages/dashboard/components/Pager.jsx
// Kontrol halaman: Sebelumnya / Berikutnya + info halaman. Tidak tampil bila hanya ada satu halaman.
function Pager({ page, lastPage, total, unit, onPage }) {
  if (lastPage <= 1) return null;
  return (
    <div className="dash-pager">
      <button id="btn-pager-prev" data-testid="btn-pager-prev" type="button" className="dash-btn outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Sebelumnya
      </button>
      <span>Halaman {page} dari {lastPage} ({total} {unit})</span>
      <button id="btn-pager-next" data-testid="btn-pager-next" type="button" className="dash-btn outline" disabled={page >= lastPage} onClick={() => onPage(page + 1)}>
        Berikutnya
      </button>
    </div>
  );
}

export default Pager;
