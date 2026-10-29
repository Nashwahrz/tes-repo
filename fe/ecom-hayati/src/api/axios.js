// src/api/axios.js
import axios from 'axios';
import { recordServerDate } from './serverTime';

const api = axios.create({
  // Atur lewat .env (VITE_API_URL), contoh: https://api.domain.com/api
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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

// Token kedaluwarsa/dicabut -> bersihkan sesi dan kembali ke login.
// Hanya jika user memang sedang punya token, supaya 401 "password salah" di /login tidak ikut terpicu.
api.interceptors.response.use(
  (response) => {
    recordServerDate(response.headers);
    return response;
  },
  (error) => {
    recordServerDate(error.response?.headers);
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      window.location.replace('/');
    }
    return Promise.reject(error);
  },
);

export default api;
