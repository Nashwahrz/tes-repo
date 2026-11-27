import api from './axios';
import { toPage } from './pagination';

export const getMotorPricesPage = async (params = {}) => {
  const response = await api.get('/motor-prices', { params });
  return toPage(response.data);
};

export const createMotorPrice = async (payload) => (await api.post('/motor-prices', payload)).data;

export const setMotorPriceStatus = async (id, status) =>
  (await api.put(`/motor-prices/${id}/status`, { status })).data;

export const importMotorPrice = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/motor-prices/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;
};
