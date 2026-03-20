import client from './client';

export const createSession = async () => {
  const response = await client.post('/sessions');
  return response.data;
};

export const getActiveSession = async () => {
  const response = await client.get('/sessions/active');
  if (response.status === 204) return null;
  return response.data;
};

export const getAllSessions = async () => {
  const response = await client.get('/sessions');
  return response.data;
};

export const getSessionById = async (id) => {
  const response = await client.get(`/sessions/${id}`);
  return response.data;
};

export const abandonSession = async (id) => {
  const response = await client.delete(`/sessions/${id}`);
  return response.data;
};
