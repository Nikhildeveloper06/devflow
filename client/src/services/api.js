import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Automatically attach the JWT token (if we have one) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
