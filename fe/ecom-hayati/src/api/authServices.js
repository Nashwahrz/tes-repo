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

export const sendOtp = async (email) => {
  const response = await api.post('/otp/send', { email });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await api.post('/otp/verify', { email, otp });
  return response.data;
};
