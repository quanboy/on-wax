import axios from 'axios';

const client = axios.create({
  baseURL: 'http://127.0.0.1:8080',
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = 'http://127.0.0.1:8080/spotify/login';
    }
    return Promise.reject(error);
  }
);

export default client;
