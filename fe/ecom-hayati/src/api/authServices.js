// src/api/authService.js
import api from './axios';

export const loginUser = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
  // response.data = { message, data: { id, email }, token }
};

export const registerUser = async (name, email, password, password_confirmation, id_role) => {
  const response = await api.post('/register', { name, email, password, password_confirmation, id_role });
  return response.data;
};

export const getUsers = async (status) => (await api.get(status ? `/users/${status}` : '/users')).data.data;

export const getDealers = async () => (await api.get('/dealers')).data.data;

// status: 'aktif' | 'ditolak' | 'nonaktif'
export const updateUserStatus = async (id, id_dealer, status) => (await api.put(`/users/${id}`, { id_dealer, status })).data;

export const sendOtp = async (email) => (await api.post('/otp/send', { email })).data;

export const verifyOtp = async (email, otp) => (await api.post('/otp/verify', { email, otp })).data;
