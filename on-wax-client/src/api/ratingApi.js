import client from './client';

export const submitRating = async (payload) => {
  const response = await client.post('/ratings', payload);
  return response.data;
};
