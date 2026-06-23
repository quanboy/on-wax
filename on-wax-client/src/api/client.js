import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = `${API_URL}/spotify/login`;
    }
    return Promise.reject(error);
  }
);

export default client;

export { API_URL };
