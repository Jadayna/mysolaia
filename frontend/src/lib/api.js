import axios from 'axios';

// URL du backend FastAPI/Node en dur
const API = 'http://mysolaia.onrender.com/api';

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ordre_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;