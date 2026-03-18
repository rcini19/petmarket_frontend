import axios from 'axios';
import { getValidToken } from '../utils/auth';

const normalizePrefix = (prefix) => {
  const trimmed = (prefix || '').trim();
  if (trimmed === '' || trimmed === '/') {
    return '';
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  return withoutTrailingSlash.startsWith('/')
    ? withoutTrailingSlash
    : `/${withoutTrailingSlash}`;
};

const normalizeEndpoint = (endpoint) => {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

const API_HOST = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const PRIMARY_API_PREFIX = normalizePrefix(process.env.REACT_APP_API_PREFIX || '/api');
const API_PREFIXES = Array.from(new Set([PRIMARY_API_PREFIX, '']));

const API = axios.create({
  baseURL: API_HOST,
});

API.interceptors.request.use((config) => {
  const token = getValidToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const shouldRetryWithNextPrefix = (error) => {
  const status = error?.response?.status;
  return status === 403 || status === 404;
};

const withPrefix = (prefix, endpoint) => {
  return `${prefix}${normalizeEndpoint(endpoint)}`;
};

const requestWithFallback = async ({ endpoint, method, data }) => {
  let lastError;

  // Some backend builds expose /api/* while others expose root paths.
  for (let index = 0; index < API_PREFIXES.length; index += 1) {
    const prefix = API_PREFIXES[index];

    try {
      return await API.request({
        method,
        url: withPrefix(prefix, endpoint),
        data,
      });
    } catch (error) {
      lastError = error;
      const hasMorePrefixes = index < API_PREFIXES.length - 1;
      if (!hasMorePrefixes || !shouldRetryWithNextPrefix(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const login = (email, password) => {
  return requestWithFallback({
    endpoint: '/auth/login',
    method: 'post',
    data: { email, password, loginAs: 'USER' },
  });
};

export const register = (fullName, email, password, confirmPassword) => {
  return requestWithFallback({
    endpoint: '/auth/register',
    method: 'post',
    data: { fullName, email, password, confirmPassword },
  });
};

export const loginWithRole = (email, password, loginAs) => {
  return requestWithFallback({
    endpoint: '/auth/login',
    method: 'post',
    data: { email, password, loginAs },
  });
};

export const getProfile = () => {
  return requestWithFallback({
    endpoint: '/profile/me',
    method: 'get',
  });
};

export const updateProfile = (fullName, email) => {
  return requestWithFallback({
    endpoint: '/profile/me',
    method: 'put',
    data: { fullName, email },
  });
};

export const changePassword = (currentPassword, newPassword, confirmPassword) => {
  return requestWithFallback({
    endpoint: '/profile/me/password',
    method: 'put',
    data: { currentPassword, newPassword, confirmPassword },
  });
};

export const updateProfilePhoto = (profileImageUrl) => {
  return requestWithFallback({
    endpoint: '/profile/me/photo',
    method: 'put',
    data: { profileImageUrl },
  });
};

export const getOrderHistory = () => {
  return requestWithFallback({
    endpoint: '/profile/me/orders',
    method: 'get',
  });
};

export const getTradeHistory = () => {
  return requestWithFallback({
    endpoint: '/profile/me/trades',
    method: 'get',
  });
};

export default API;
