// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://skiing-wellington-till-para.trycloudflare.com/api',
  baseURL: 'https://expect-delivered-governance-grace.trycloudflare.com/api',
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

export default api;
