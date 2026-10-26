// src/api/emailSmtp.js
import api from './axios';

// Pengaturan SMTP pengirim email (BE: /email-smtps, permission email-smtps.*)
// Baris: { id, mail_mailer, mail_host, mail_port, mail_username, mail_password, mail_encryption, mail_from_address, mail_from_name, is_active }
export const getEmailSmtps = async () => (await api.get('/email-smtps')).data.data;

export const getEmailSmtp = async (id) => (await api.get(`/email-smtps/${id}`)).data.data;

export const createEmailSmtp = async (payload) => (await api.post('/email-smtps', payload)).data;

export const updateEmailSmtp = async (id, payload) => (await api.put(`/email-smtps/${id}`, payload)).data;

export const deleteEmailSmtp = async (id) => (await api.delete(`/email-smtps/${id}`)).data;
