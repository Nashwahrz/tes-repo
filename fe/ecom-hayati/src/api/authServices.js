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

// export const getPendingUsers = async () => {
//   const response = await api.get('/users/pending');
//   return response.data.data;
// };

// export const approveUser = async (id) => (await api.post(`/users/${id}/approve`)).data;

// export const rejectUser = async (id) => (await api.post(`/users/${id}/reject`)).data;

export const sendOtp = async (email) => (await api.post('/otp/send', { email })).data;

export const verifyOtp = async (email, otp) => (await api.post('/otp/verify', { email, otp })).data;
