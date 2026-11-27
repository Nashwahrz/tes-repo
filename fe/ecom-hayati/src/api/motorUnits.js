import api from './axios';
import { toPage } from './pagination';

export const getMotorUnitsPage = async (params = {}) => {
  const response = await api.get('/motor-units', { params });
  return toPage(response.data);
};

export const getMotorUnit = async (id) => (await api.get(`/motor-units/${id}`)).data.data;

export const createMotorUnit = async (payload) => (await api.post('/motor-units', payload)).data;

export const importMotorUnits = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/motor-units/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;
};