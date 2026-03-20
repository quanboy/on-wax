import client from './client';

export const getNowPlaying = async () => {
  const response = await client.get('/spotify/now-playing');
  return response.data;
};

export const login = () => 'http://127.0.0.1:8080/spotify/login';
