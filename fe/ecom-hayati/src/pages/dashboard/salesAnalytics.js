// src/pages/dashboard/salesAnalytics.js

export const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(n || 0))}`;

export const rupiahCompact = (n) => {
  const val = Number(n) || 0;
  if (val >= 1_000_000_000) {
    const b = val / 1_000_000_000;
    return `Rp ${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)} M`;
  }
  if (val >= 1_000_000) {
    const m = val / 1_000_000;
    return `Rp ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)} Jt`;
  }
  if (val >= 1_000) {
    const k = val / 1_000;
    return `Rp ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)} Rb`;
  }
  return `Rp ${val}`;
};

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
];

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Daftar opsi minggu contoh untuk demonstrasi interaktif
export const WEEK_OPTIONS = [
  { id: '2026-W42', label: 'Minggu Ini (12 - 18 Okt 2026)', start: '2026-10-12', end: '2026-10-18' },
  { id: '2026-W41', label: 'Minggu Lalu (05 - 11 Okt 2026)', start: '2026-10-05', end: '2026-10-11' },
  { id: '2026-W40', label: 'Minggu ke-1 Okt (28 Sep - 04 Okt 2026)', start: '2026-09-28', end: '2026-10-04' },
  { id: '2026-W39', label: 'Minggu ke-4 Sep (21 - 27 Sep 2026)', start: '2026-09-21', end: '2026-09-27' },
];

/**
 * Format tanggal string YYYY-MM-DD ke objek Date lokal (aman timezone)
 */
function parseDateParts(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * Mengelompokkan data penjualan berdasarkan periode (minggu, bulan, tahun)
 */
export function getSalesChartData(rows = [], period = 'minggu', options = {}) {
  // Hanya hitung baris yang tidak dibatalkan
  const validRows = rows.filter((r) => r.status !== 'batal');

  if (period === 'minggu') {
    const weekId = options.weekId || WEEK_OPTIONS[0].id;
    const weekDef = WEEK_OPTIONS.find((w) => w.id === weekId) || WEEK_OPTIONS[0];
    const [sY, sM, sD] = weekDef.start.split('-').map(Number);

    const items = [];
    for (let i = 0; i < 7; i += 1) {
      const curDate = new Date(sY, sM - 1, sD + i);
      const isoDate = `${curDate.getFullYear()}-${String(curDate.getMonth() + 1).padStart(2, '0')}-${String(curDate.getDate()).padStart(2, '0')}`;
      const dayMatches = validRows.filter((r) => r.tanggal === isoDate);

      const revenue = dayMatches.reduce((acc, r) => acc + (Number(r.harga) || 0), 0);
      const units = dayMatches.reduce((acc, r) => acc + (Number(r.unit) || 1), 0);

      items.push({
        id: isoDate,
        label: DAY_SHORT[i],
        fullLabel: `${DAY_NAMES[i]}, ${curDate.getDate()} ${MONTH_SHORT[curDate.getMonth()]}`,
        date: isoDate,
        revenue,
        units,
        count: dayMatches.length,
        items: dayMatches,
      });
    }

    const totalRevenue = items.reduce((acc, it) => acc + it.revenue, 0);
    const totalUnits = items.reduce((acc, it) => acc + it.units, 0);
    const totalCount = items.reduce((acc, it) => acc + it.count, 0);
    const activeDays = items.filter((it) => it.revenue > 0).length || 1;
    const avgRevenue = Math.round(totalRevenue / 7);

    let peak = items[0];
    for (const it of items) {
      if (it.revenue > peak.revenue) peak = it;
    }

    return {
      period: 'minggu',
      activePeriodLabel: weekDef.label,
      items,
      summary: {
        totalRevenue,
        totalUnits,
        totalCount,
        avgRevenue,
        peak,
        activeDays,
      },
    };
  }

  if (period === 'bulan') {
    const selectedYear = Number(options.year) || 2026;
    const yearRows = validRows.filter((r) => {
      const parts = parseDateParts(r.tanggal);
      return parts && parts.year === selectedYear;
    });

    const items = MONTH_SHORT.map((shortName, idx) => {
      const mNum = idx + 1;
      const monthRows = yearRows.filter((r) => {
        const parts = parseDateParts(r.tanggal);
        return parts && parts.month === mNum;
      });

      const revenue = monthRows.reduce((acc, r) => acc + (Number(r.harga) || 0), 0);
      const units = monthRows.reduce((acc, r) => acc + (Number(r.unit) || 1), 0);

      return {
        id: `M-${idx}`,
        label: shortName,
        fullLabel: `${MONTH_NAMES[idx]} ${selectedYear}`,
        monthIndex: idx,
        revenue,
        units,
        count: monthRows.length,
        items: monthRows,
      };
    });

    const totalRevenue = items.reduce((acc, it) => acc + it.revenue, 0);
    const totalUnits = items.reduce((acc, it) => acc + it.units, 0);
    const totalCount = items.reduce((acc, it) => acc + it.count, 0);
    const activeMonths = items.filter((it) => it.revenue > 0).length || 1;
    const avgRevenue = Math.round(totalRevenue / (activeMonths || 1));

    let peak = items[0];
    for (const it of items) {
      if (it.revenue > peak.revenue) peak = it;
    }

    return {
      period: 'bulan',
      activePeriodLabel: `Tahun ${selectedYear}`,
      items,
      summary: {
        totalRevenue,
        totalUnits,
        totalCount,
        avgRevenue,
        peak,
        activeMonths,
      },
    };
  }

  // period === 'tahun'
  // Ambil tahun unik dari data, minimal 2024-2026
  const availableYearsSet = new Set(['2024', '2025', '2026']);
  validRows.forEach((r) => {
    const parts = parseDateParts(r.tanggal);
    if (parts) availableYearsSet.add(String(parts.year));
  });
  const sortedYears = Array.from(availableYearsSet).sort();

  let prevRevenue = null;
  const items = sortedYears.map((yrStr) => {
    const yrNum = Number(yrStr);
    const yrRows = validRows.filter((r) => {
      const parts = parseDateParts(r.tanggal);
      return parts && parts.year === yrNum;
    });

    const revenue = yrRows.reduce((acc, r) => acc + (Number(r.harga) || 0), 0);
    const units = yrRows.reduce((acc, r) => acc + (Number(r.unit) || 1), 0);

    let growth = null;
    if (prevRevenue !== null && prevRevenue > 0) {
      growth = Math.round(((revenue - prevRevenue) / prevRevenue) * 100);
    }
    prevRevenue = revenue;

    return {
      id: `Y-${yrStr}`,
      label: yrStr,
      fullLabel: `Tahun ${yrStr}`,
      year: yrNum,
      revenue,
      units,
      count: yrRows.length,
      growth,
      items: yrRows,
    };
  });

  const totalRevenue = items.reduce((acc, it) => acc + it.revenue, 0);
  const totalUnits = items.reduce((acc, it) => acc + it.units, 0);
  const totalCount = items.reduce((acc, it) => acc + it.count, 0);
  const avgRevenue = Math.round(totalRevenue / (items.length || 1));

  let peak = items[0];
  for (const it of items) {
    if (it.revenue > peak.revenue) peak = it;
  }

  return {
    period: 'tahun',
    activePeriodLabel: `${sortedYears[0]} - ${sortedYears[sortedYears.length - 1]}`,
    items,
    summary: {
      totalRevenue,
      totalUnits,
      totalCount,
      avgRevenue,
      peak,
      totalYears: items.length,
    },
  };
}
