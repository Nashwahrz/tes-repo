// src/api/whitelist.js
import api from './axios';

// Whitelist domain email untuk registrasi (BE: /email-whitelists, permission email-whitelists.*)
// payload: { domain: '@gmail.com', is_active: true, created_by: <id user> }; domain wajib berawalan @ dan unik
export const getEmailWhitelists = async () => (await api.get('/email-whitelists')).data.data;

export const createEmailWhitelist = async (payload) => (await api.post('/email-whitelists', payload)).data;

export const updateEmailWhitelist = async (id, payload) => (await api.put(`/email-whitelists/${id}`, payload)).data;

export const deleteEmailWhitelist = async (id) => (await api.delete(`/email-whitelists/${id}`)).data;
