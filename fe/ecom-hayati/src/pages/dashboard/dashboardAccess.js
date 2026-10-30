import {
  MENU_HOME, MENU_PRODUK, MENU_PENJUALAN, MENU_DEALER, MENU_KONSUMEN, MENU_ACC, MENU_ROLE, MENU_WHITELIST, MENU_SMTP, MENU_URLIP, MENU_OCR, MENU_RATELIMIT, MENU_LOG, MENU_AGAMA, MENU_PEKERJAAN, MENU_PROVINSI, MENU_KABUPATEN, MENU_KECAMATAN, MENU_KELURAHAN,
} from './menuPaths';
import { MENU_URL } from './navConfig';

export const EMPTY_ACCESS = { menus: [], permissions: [] };

export function deriveAccess(access) {
  const hasMenu = (url) => access.menus.includes(url);
  const can = (perm) => access.permissions.includes(perm);
  // Wilayah punya menu/permission sendiri di BE (provinsis, kabupaten-kotas, kecamatans, kelurahans)
  const canWil = (url) => hasMenu(url) && can(`${url}.lihat`);

  const canDealer = hasMenu('dealers') && can('dealers.lihat');
  const canUsers = hasMenu('users') && can('users.lihat');
  const canSales = hasMenu('penjualan');
  const canKonsumen = hasMenu('konsumens') && can('konsumens.lihat');
  // Menu Pengguna & Akses cukup users.lihat; tombol setujui/tolak/atur hanya muncul bila users.aktivasi dicentang
  const canAcc = canUsers;
  const canActivate = canAcc && can('users.aktivasi');
  const canRoleMenu = hasMenu('role-menus') && can('role-menus.kelola');
  const canRolePerm = hasMenu('role-menus') && can('role-permissions.kelola');
  const canRole = canRoleMenu || canRolePerm;
  const canWhitelist = hasMenu('email-whitelists') && can('email-whitelists.lihat');
  const canUrlIp = hasMenu('url-ip-logins') && can('url-ip-logins.lihat');
  const canOcr = hasMenu('app-key-ocrs') && can('app-key-ocrs.lihat');
  const canSmtp = hasMenu('email-smtps') && can('email-smtps.lihat');
  const canLoginLog = hasMenu('log-users') && can('log-users.lihat');
  const canKonsumenLog = hasMenu('konsumens') && can('konsumens.logs');
  const canLog = canLoginLog || canKonsumenLog;
  const canRateLimit = hasMenu('configurasi-rate-limits') && can('configurasi-rate-limits.lihat');
  const canAgama = hasMenu('agamas') && can('agamas.lihat');
  const canPekerjaan = hasMenu('pekerjaans') && can('pekerjaans.lihat');
  const canVerifyKonsumen = canKonsumen && can('konsumens.aktivasi');

  const menus = [
    ...(hasMenu(MENU_URL[MENU_HOME]) ? [MENU_HOME] : []),
    ...(hasMenu(MENU_URL[MENU_PRODUK]) ? [MENU_PRODUK] : []),
    ...(canSales ? [MENU_PENJUALAN] : []),
    ...(canDealer ? [MENU_DEALER] : []),
    ...(canKonsumen ? [MENU_KONSUMEN] : []),
    ...(canAcc ? [MENU_ACC] : []),
    ...(canRole ? [MENU_ROLE] : []),
    ...(canWhitelist ? [MENU_WHITELIST] : []),
    ...(canSmtp ? [MENU_SMTP] : []),
    ...(canUrlIp ? [MENU_URLIP] : []),
    ...(canOcr ? [MENU_OCR] : []),
    ...(canRateLimit ? [MENU_RATELIMIT] : []),
    ...(canLog ? [MENU_LOG] : []),
    ...(canAgama ? [MENU_AGAMA] : []),
    ...(canPekerjaan ? [MENU_PEKERJAAN] : []),
    ...(canWil('provinsis') ? [MENU_PROVINSI] : []),
    ...(canWil('kabupaten-kotas') ? [MENU_KABUPATEN] : []),
    ...(canWil('kecamatans') ? [MENU_KECAMATAN] : []),
    ...(canWil('kelurahans') ? [MENU_KELURAHAN] : []),
  ];

  return {
    hasMenu, can, menus,
    canDealer, canUsers, canSales, canKonsumen, canAcc, canActivate, canRoleMenu, canRolePerm, canRole,
    canWhitelist, canUrlIp, canOcr, canSmtp, canLoginLog, canKonsumenLog, canLog, canRateLimit, canVerifyKonsumen,
  };
}
