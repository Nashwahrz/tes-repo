// src/pages/dashboard/components/SalesChart.jsx
import { useId, useMemo, useState } from 'react';
import {
  getSalesChartData,
  rupiah,
  rupiahCompact,
  WEEK_OPTIONS,
} from '../salesAnalytics';

// Helper membuat kurva Bezier mulus dari sekumpulan koordinat (x, y)
function getSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function SalesChart({
  rows: allRows = [],
  dealerName = null,
  scopeLabel = null, // nama dealer yang ditampilkan pada judul; bawaan: dealerName, atau "Semua Dealer" untuk admin
  isAdmin = false,
  onViewAll = null,
  compact = false,
  showDealerFilter = false, // tampilkan dropdown dealer di grafik (bila baris berasal dari lebih dari satu dealer)
}) {
  const chartId = useId();
  const [period, setPeriod] = useState('minggu'); // 'minggu' | 'bulan' | 'tahun'
  const [metric, setMetric] = useState('revenue'); // 'revenue' (Rp) | 'units' (Motor)
  const chartMode = 'both'; // batang + garis tren
  const [selectedWeek, setSelectedWeek] = useState('2026-W42');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [hoverIndex, setHoverIndex] = useState(null);

  const [dealerSel, setDealerSel] = useState(''); // id dealer terpilih; kosong = semua

  const dealerOptions = useMemo(
    () => [...new Map(allRows.map((r) => [r.id_dealer, r.dealer])).entries()]
      .sort((a, b) => String(a[1]).localeCompare(String(b[1]))),
    [allRows],
  );
  const canFilterDealer = showDealerFilter && dealerOptions.length > 1;
  const rows = useMemo(
    () => (canFilterDealer && dealerSel ? allRows.filter((r) => String(r.id_dealer) === dealerSel) : allRows),
    [allRows, canFilterDealer, dealerSel],
  );
  const selectedDealerName = canFilterDealer && dealerSel ? dealerOptions.find(([id]) => String(id) === dealerSel)?.[1] : null;
  const dealerTag = selectedDealerName ?? scopeLabel ?? dealerName ?? (isAdmin || canFilterDealer ? 'Semua Dealer' : null);

  // Ambil data agregasi sesuai periode terpilih
  const chartData = useMemo(() => {
    return getSalesChartData(rows, period, {
      weekId: selectedWeek,
      year: selectedYear,
    });
  }, [rows, period, selectedWeek, selectedYear]);

  const { items = [], summary = {} } = chartData;

  // Ukuran viewBox chart SVG
  const svgWidth = 820;
  const svgHeight = 270;
  const padLeft = 70;
  const padRight = 30;
  const padTop = 26;
  const padBottom = 42;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const chartBottom = padTop + chartHeight;

  // Nilai maksimum untuk skala sumbu Y
  const rawMax = Math.max(...items.map((it) => (metric === 'revenue' ? it.revenue : it.units)), 0);
  const maxVal = useMemo(() => {
    if (metric === 'revenue') {
      if (rawMax <= 0) return 50000000;
      // Bulatkan ke kelipatan terdekat (misal kelipatan 10 juta atau 20 juta)
      const step = rawMax > 150000000 ? 50000000 : rawMax > 50000000 ? 20000000 : 10000000;
      return Math.ceil(rawMax / step) * step;
    }
    if (rawMax <= 0) return 5;
    return Math.ceil(rawMax / 2) * 2;
  }, [rawMax, metric]);

  // Titik grid horizontal (4 baris)
  const gridSteps = 4;
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= gridSteps; i += 1) {
      const ratio = i / gridSteps;
      const y = padTop + chartHeight * (1 - ratio);
      const val = maxVal * ratio;
      lines.push({
        y,
        label: metric === 'revenue' ? rupiahCompact(val) : `${Math.round(val)} unit`,
      });
    }
    return lines;
  }, [maxVal, metric, chartHeight, padTop]);

  // Kalkulasi koordinat posisi X & Y untuk tiap data point
  const stepWidth = items.length > 0 ? chartWidth / items.length : chartWidth;
  const maxBarWidth = period === 'minggu' ? 44 : period === 'bulan' ? 34 : 64;
  const barWidth = Math.min(maxBarWidth, Math.max(14, stepWidth * 0.52));

  const points = useMemo(() => {
    return items.map((it, idx) => {
      const val = metric === 'revenue' ? it.revenue : it.units;
      const ratio = maxVal > 0 ? Math.min(1, Math.max(0, val / maxVal)) : 0;
      const h = Math.round(ratio * chartHeight);
      const x = padLeft + (idx + 0.5) * stepWidth;
      const y = chartBottom - h;
      return {
        ...it,
        index: idx,
        val,
        x,
        y,
        h,
        barX: x - barWidth / 2,
        barY: y,
      };
    });
  }, [items, metric, maxVal, chartHeight, chartBottom, padLeft, stepWidth, barWidth]);

  // Kurva garis & area
  const curvePath = useMemo(() => getSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length < 2 || !curvePath) return '';
    return `${curvePath} L ${points[points.length - 1].x} ${chartBottom} L ${points[0].x} ${chartBottom} Z`;
  }, [curvePath, points, chartBottom]);

  // Item yang sedang di-hover
  const activeItem = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className={`dash-chart-card${compact ? ' compact' : ''}`}>
      {/* HEADER BAGIAN ATAS */}
      <div className="dash-chart-header">
        <div className="dash-chart-title-area">
          <div className="dash-chart-badge-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 3v18h18" />
              <path d="M7 15l4-4 3 3 5-6" />
            </svg>
            <h3>Grafik & Tren Penjualan</h3>
            {dealerTag && !canFilterDealer && <span className="dash-badge" title="Dealer yang ditampilkan">{dealerTag}</span>}
          </div>
        </div>

        {/* TAB PERIODE: MINGGU, BULAN, TAHUN */}
        <div className="dash-chart-period-tabs" role="tablist" aria-label="Pilih Periode Penjualan">
          <button id="btn-sales-period-minggu"
            type="button"
            role="tab"
            aria-selected={period === 'minggu'}
            className={`dash-chart-tab${period === 'minggu' ? ' active' : ''}`}
            onClick={() => { setPeriod('minggu'); setHoverIndex(null); }}
          >
            Per Minggu
          </button>
          <button id="btn-sales-period-bulan"
            type="button"
            role="tab"
            aria-selected={period === 'bulan'}
            className={`dash-chart-tab${period === 'bulan' ? ' active' : ''}`}
            onClick={() => { setPeriod('bulan'); setHoverIndex(null); }}
          >
            Per Bulan
          </button>
          <button id="btn-sales-period-tahun"
            type="button"
            role="tab"
            aria-selected={period === 'tahun'}
            className={`dash-chart-tab${period === 'tahun' ? ' active' : ''}`}
            onClick={() => { setPeriod('tahun'); setHoverIndex(null); }}
          >
            Per Tahun
          </button>
        </div>
      </div>

      {/* SUB-TOOLBAR FILTER: PEMILIH MINGGU / TAHUN + TOGGLE METRIK */}
      <div className="dash-chart-toolbar">
        <div className="dash-chart-subfilters">
          {period === 'minggu' && (
            <div className="dash-chart-selector-wrap">
              <label htmlFor="sales-week-select" className="dash-chart-filter-label">Minggu:</label>
              <select
                id="sales-week-select"
                className="dash-chart-select"
                value={selectedWeek}
                onChange={(e) => { setSelectedWeek(e.target.value); setHoverIndex(null); }}
              >
                {WEEK_OPTIONS.map((w) => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          )}

          {period === 'bulan' && (
            <div className="dash-chart-selector-wrap">
              <label htmlFor="sales-year-select" className="dash-chart-filter-label">Tahun:</label>
              <select
                id="sales-year-select"
                className="dash-chart-select"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setHoverIndex(null); }}
              >
                <option value={2026}>2026 (Tahun Berjalan)</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          )}

          {canFilterDealer && (
            <div className="dash-chart-selector-wrap">
              <label htmlFor={`${chartId}-dealer`} className="dash-chart-filter-label">Dealer:</label>
              <select
                id={`${chartId}-dealer`}
                className="dash-chart-select"
                value={dealerSel}
                onChange={(e) => { setDealerSel(e.target.value); setHoverIndex(null); }}
              >
                <option value="">Semua Dealer</option>
                {dealerOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* METRIC & DISPLAY TOGGLES */}
        <div className="dash-chart-controls-right">
          {/* Toggle Metrik: Rupiah vs Unit */}
          <div className="dash-chart-toggle-group" aria-label="Metrik tampilan">
            <button id="btn-sales-metric-revenue"
              type="button"
              className={`dash-chart-toggle-btn${metric === 'revenue' ? ' active' : ''}`}
              onClick={() => setMetric('revenue')}
              title="Tampilkan Nilai Penjualan (Rupiah)"
            >
              Rp Omset
            </button>
            <button id="btn-sales-metric-units"
              type="button"
              className={`dash-chart-toggle-btn${metric === 'units' ? ' active' : ''}`}
              onClick={() => setMetric('units')}
              title="Tampilkan Volume Unit Motor Terjual"
            >
              Unit Motor
            </button>
          </div>
        </div>
      </div>

      {/* KARTU RINGKASAN KPI SINGKAT */}
      <div className="dash-chart-kpis">
        <div className="dash-chart-kpi">
          <small>Total Penjualan</small>
          <strong>{rupiah(summary.totalRevenue)}</strong>
          <span className="dash-chart-kpi-sub">{summary.totalUnits} unit motor terjual</span>
        </div>
        <div className="dash-chart-kpi">
          <small>Puncak Tertinggi</small>
          <strong>{summary.peak ? rupiah(summary.peak.revenue) : 'Rp 0'}</strong>
          <span className="dash-chart-kpi-sub">{summary.peak?.fullLabel || '-'} ({summary.peak?.units || 0} unit)</span>
        </div>
      </div>

      {/* CANVAS GRAFIK SVG & FLOATING TOOLTIP */}
      <div
        className="dash-chart-canvas-wrap"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          className="dash-chart-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Grafik Tren Penjualan"
        >
          <defs>
            {/* Gradien Batang Standar */}
            <linearGradient id={`${chartId}-barGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            {/* Gradien Batang saat di-hover */}
            <linearGradient id={`${chartId}-barGradHover`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff7828" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            {/* Gradien Area Bawah Garis */}
            <linearGradient id={`${chartId}-areaGrad`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.02" />
            </linearGradient>

            {/* Filter Bayangan Halus Bar */}
            <filter id={`${chartId}-shadow`} x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.16" />
            </filter>
          </defs>

          {/* Garis Grid Horizontal & Label Sumbu Y */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={padLeft - 6}
                y1={gl.y}
                x2={svgWidth - padRight}
                y2={gl.y}
                className="dash-chart-grid-line"
              />
              <text
                x={padLeft - 12}
                y={gl.y + 4}
                className="dash-chart-axis-text y-axis"
                textAnchor="end"
              >
                {gl.label}
              </text>
            </g>
          ))}

          {/* AREA / KURVA GARIS TREN */}
          {(chartMode === 'both' || chartMode === 'line') && areaPath && (
            <path
              d={areaPath}
              fill={`url(#${chartId}-areaGrad)`}
              className="dash-chart-area-fill"
            />
          )}

          {(chartMode === 'both' || chartMode === 'line') && curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke="#b32400"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dash-chart-curve-stroke"
            />
          )}

          {/* DIAGRAM BATANG (BARS) */}
          {(chartMode === 'both' || chartMode === 'bar') && points.map((p, i) => {
            const isHover = hoverIndex === i;
            const isPeak = summary.peak && summary.peak.id === p.id && p.val > 0;
            return (
              <g key={p.id}>
                <rect
                  x={p.barX}
                  y={p.barY}
                  width={barWidth}
                  height={Math.max(3, p.h)}
                  rx="5"
                  ry="5"
                  fill={isHover ? `url(#${chartId}-barGradHover)` : `url(#${chartId}-barGrad)`}
                  filter={isHover ? `url(#${chartId}-shadow)` : undefined}
                  className={`dash-chart-bar${isHover ? ' is-hover' : ''}${isPeak ? ' is-peak' : ''}`}
                />
              </g>
            );
          })}

          {/* TITIK DATA POINT PADA GARIS */}
          {(chartMode === 'both' || chartMode === 'line') && points.map((p, i) => {
            const isHover = hoverIndex === i;
            if (p.val <= 0 && !isHover) return null;
            return (
              <g key={`pt-${p.id}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHover ? 6.5 : 4}
                  fill="#ffffff"
                  stroke="#b32400"
                  strokeWidth={isHover ? 3.5 : 2.2}
                  className="dash-chart-data-point"
                />
              </g>
            );
          })}

          {/* INDIKATOR KURSOR SAAT DI-HOVER */}
          {activeItem && (
            <line
              x1={activeItem.x}
              y1={padTop}
              x2={activeItem.x}
              y2={chartBottom}
              className="dash-chart-hover-line"
            />
          )}

          {/* LABEL SUMBU X */}
          {points.map((p, i) => {
            const isHover = hoverIndex === i;
            return (
              <g key={`lbl-${p.id}`} transform={`translate(${p.x}, ${chartBottom + 16})`}>
                <text
                  x="0"
                  y="0"
                  className={`dash-chart-axis-text x-axis${isHover ? ' active' : ''}`}
                  textAnchor="middle"
                >
                  {p.label}
                </text>
                {period === 'minggu' && (
                  <text
                    x="0"
                    y="13"
                    className="dash-chart-sublabel-text"
                    textAnchor="middle"
                  >
                    {p.date ? p.date.slice(8) : ''}
                  </text>
                )}
              </g>
            );
          })}

          {/* AREA INTERAKSI MOUSE (TRANSPARAN OVERLAY) */}
          {points.map((p, i) => (
            <rect
              key={`hit-${p.id}`}
              x={padLeft + i * stepWidth}
              y={padTop}
              width={stepWidth}
              height={chartHeight + padBottom}
              fill="transparent"
              className="dash-chart-hitbox"
              onMouseEnter={() => setHoverIndex(i)}
            />
          ))}
        </svg>

        {/* FLOATING TOOLTIP HTML INTERAKTIF */}
        {activeItem && (
          <div
            className="dash-chart-tooltip"
            style={{
              left: `${(activeItem.x / svgWidth) * 100}%`,
              top: `${Math.max(10, (activeItem.y / svgHeight) * 100 - 18)}%`,
            }}
          >
            <div className="dash-chart-tip-header">
              <strong>{activeItem.fullLabel}</strong>
              {activeItem.growth !== undefined && activeItem.growth !== null && (
                <span className={`dash-chart-growth-tag ${activeItem.growth >= 0 ? 'pos' : 'neg'}`}>
                  {activeItem.growth >= 0 ? `+${activeItem.growth}%` : `${activeItem.growth}%`}
                </span>
              )}
            </div>

            <div className="dash-chart-tip-values">
              <div className="dash-chart-tip-main-val">
                <span className="dash-chart-tip-lbl">Total Nilai:</span>
                <strong>{rupiah(activeItem.revenue)}</strong>
              </div>
              <div className="dash-chart-tip-sub-val">
                <span>Unit: <strong>{activeItem.units} unit</strong></span>
                <span>•</span>
                <span>{activeItem.count} transaksi</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {onViewAll && (
        <div className="dash-chart-footer">
          <div className="dash-chart-footer-right">
            <button id="btn-sales-view-all" type="button" className="dash-link dash-chart-view-btn" onClick={onViewAll}>
              Buka Rekap Tabel Penjualan →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesChart;
