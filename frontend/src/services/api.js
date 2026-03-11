import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) => {
  return API.post('/auth/login', { email, password });
};

export const register = (fullName, email, password, confirmPassword) => {
  return API.post('/auth/register', { fullName, email, password, confirmPassword });
};

export default API;
