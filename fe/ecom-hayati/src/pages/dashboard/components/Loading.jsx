// Penanda proses berjalan: Spin (putaran kecil di dalam tombol) dan Loading (blok pemuatan data)
export function Spin() {
  return <span className="dash-spin" aria-hidden="true" />;
}

// rows > 0 menambahkan baris kerangka agar terlihat ada daftar yang sedang disiapkan
function Loading({ label = 'Memuat data...', rows = 0 }) {
  return (
    <div className="dash-loading" role="status" aria-live="polite">
      <div className="dash-loading-head">
        <span className="dash-spin lg" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {rows > 0 && (
        <div className="dash-skeleton" aria-hidden="true">
          {Array.from({ length: rows }, (_, i) => <div key={i} className="dash-skeleton-row" />)}
        </div>
      )}
    </div>
  );
}

export default Loading;
