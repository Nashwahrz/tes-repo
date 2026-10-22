// src/api/dealers.js
import api from './axios';
import { fetchAllPages } from './shared';

export const getDealers = () => fetchAllPages('/dealers');

// Dealer (BE: /dealers, butuh permission dealers.*)
// Detail satu dealer (BE: GET /dealers/{id})
export const getDealer = async (id) => (await api.get(`/dealers/${id}`)).data.data;

export const createDealer = async (payload) => (await api.post('/dealers', payload)).data;

export const updateDealer = async (id, payload) => (await api.put(`/dealers/${id}`, payload)).data;

export const deleteDealer = async (id) => (await api.delete(`/dealers/${id}`)).data;
