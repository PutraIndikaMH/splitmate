import api from './api';

export const getAIHealth = async () => {
  const res = await api.get('/ai/health');
  return res.data;
};

export const predictExpense = async (payload) => {
  const res = await api.post('/ai/predict', payload);
  return res.data;
};

export const classifyExpense = async (payload) => {
  const res = await api.post('/ai/classify', payload);
  return res.data;
};

