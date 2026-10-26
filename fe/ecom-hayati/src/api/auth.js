// src/api/auth.js
// Login, registrasi, OTP, dan reset password
import api from './axios';
import { normEmail } from './shared';

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email: normEmail(email), password });
  return response.data;
  // response.data = { message, data: { id, email }, token }
};

// Cabut token Sanctum di server; dipanggil sebelum sesi lokal dibersihkan
export const logoutUser = async () => (await api.post('/logout')).data;

export const registerUser = async (name, email, password, password_confirmation, id_role) => {
  const response = await api.post('/register', { name, email: normEmail(email), password, password_confirmation, id_role });
  return response.data;
};

export const sendOtp = async (email) => (await api.post('/otp/send', { email: normEmail(email) })).data;

export const verifyOtp = async (email, otp) => (await api.post('/otp/verify', { email: normEmail(email), otp })).data;

// Reset password (BE: 3 langkah). OTP reset hanya untuk email yang sudah terverifikasi; OTP berlaku 5 menit.
export const sendResetPasswordOtp = async (email) => (await api.post('/otp/send-reset-password', { email: normEmail(email) })).data;

// Respons: { reset_token } (berlaku 15 menit, dipakai di langkah terakhir)
export const verifyResetPasswordOtp = async (email, otp) => (await api.post('/otp/verify-reset-password', { email: normEmail(email), otp })).data;

export const resetPassword = async (email, reset_token, password, password_confirmation) =>
  (await api.post('/reset-password', { email: normEmail(email), reset_token, password, password_confirmation })).data;
