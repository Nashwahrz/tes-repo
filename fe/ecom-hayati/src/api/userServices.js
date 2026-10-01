// src/api/userServices.js
import api from './axios';

export const getUsers = async (status) => {
  const response = await api.get('/users', { params: status ? { status } : {} });
  return response.data.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await api.patch(`/users/${id}/status`, { status });
  return response.data;
};
