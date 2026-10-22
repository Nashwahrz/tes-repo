// src/api/access.js
// Menu dan permission per role
import api from './axios';

// Menu & permission milik user yang sedang login
export const getUserMenus = async () => (await api.get('/role-menus/user-menus')).data.data;

export const getUserPermissions = async () => (await api.get('/role-permissions/user-permissions')).data.data;

// Kelola hak akses role (butuh role-menus.kelola / role-permissions.kelola)
// data: { roles: [{ id, name, menus: [] }], menus: [] }
export const getRoleMenus = async () => (await api.get('/role-menus')).data.data;

// Hak menu satu role: { id, name, menu_ids, menus }
export const getRoleMenu = async (roleId) => (await api.get(`/role-menus/${roleId}`)).data.data;

export const updateRoleMenus = async (roleId, menu_ids) => (await api.put(`/role-menus/${roleId}`, { menu_ids })).data;

// data: { roles: [{ id, name, permissions: [] }], permissions: [] }
export const getRolePermissions = async () => (await api.get('/role-permissions')).data.data;

// Hak permission satu role: { id, name, permission_ids, permissions }
export const getRolePermission = async (roleId) => (await api.get(`/role-permissions/${roleId}`)).data.data;

export const updateRolePermissions = async (roleId, permission_ids) => (await api.put(`/role-permissions/${roleId}`, { permission_ids })).data;
