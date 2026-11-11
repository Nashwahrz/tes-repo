// src/api/pagination.js
// Paginasi BE (Laravel): current_page, last_page, total, per_page. Batas per_page BE: 1-100 (default 10).
export const DEFAULT_PER_PAGE = 10;
export const MAX_PER_PAGE = 100;

// Ubah objek paginasi BE (meta) jadi bentuk yang dipakai FE
export const toMeta = (m = {}, perPage = DEFAULT_PER_PAGE) => ({
  page: m.current_page ?? 1,
  lastPage: m.last_page ?? 1,
  total: m.total ?? 0,
  perPage: m.per_page ?? perPage,
});
