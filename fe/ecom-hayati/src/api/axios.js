// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://skiing-wellington-till-para.trycloudflare.com/api',
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token kedaluwarsa/dicabut: bersihkan sesi lalu kembali ke login.
// Login/register/OTP dikecualikan karena 401 di sana berarti kredensial salah.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url ?? '';
    const publik = /^\/(login|register|otp)/.test(url);
    if (err.response?.status === 401 && !publik && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.replace('/');
    }
    return Promise.reject(err);
  },
);

export default api;
