// src/shared/components/Pager.jsx
// Kontrol halaman: Sebelumnya / Berikutnya + info halaman. Tidak tampil bila hanya ada satu halaman.
function Pager({ page, lastPage, total, unit = 'data', onPage, onPageChange }) {
  const handlePage = onPage || onPageChange;
  if (lastPage <= 1) return null;
  return (
    <div className="dash-pager">
      <button
        id="btn-pager-prev"
        data-testid="btn-pager-prev"
        type="button"
        className="dash-btn outline"
        disabled={page <= 1}
        onClick={() => handlePage?.(page - 1)}
      >
        Sebelumnya
      </button>
      <span>
        Halaman {page} dari {lastPage} ({total} {unit})
      </span>
      <button
        id="btn-pager-next"
        data-testid="btn-pager-next"
        type="button"
        className="dash-btn outline"
        disabled={page >= lastPage}
        onClick={() => handlePage?.(page + 1)}
      >
        Berikutnya
      </button>
    </div>
  );
}

export default Pager;
