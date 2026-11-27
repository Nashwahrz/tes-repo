import api from './axios';
import { toPage, DEFAULT_PER_PAGE } from './pagination';
import { fetchAllPages } from './shared';

export const getMotorsPage = async (params = {}) => {
  const response = await api.get('/motors', { params });
  return toPage(response.data);
};

export const getAllMotors = () => fetchAllPages('/motors');

export const importMotors = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/motors/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;
};

export const exportMotors = async (search = '') => {
  const res = await api.get('/motors/export', {
    params: search ? { search } : {},
    responseType: 'blob',
  });
  const name =
    /filename="?([^";]+)"?/i.exec(res.headers?.['content-disposition'] ?? '')?.[1] ??
    `data_motor_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
