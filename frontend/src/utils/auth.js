const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

const parseJwtPayload = (token) => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isPlaceholderToken = (token) => {
  if (token == null) {
    return true;
  }

  const normalized = String(token).trim().toLowerCase();
  return normalized === '' || normalized === 'null' || normalized === 'undefined';
};

export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const isTokenValid = (token = getStoredToken()) => {
  if (isPlaceholderToken(token)) {
    return false;
  }

  if (typeof token !== 'string' || token.split('.').length !== 3) {
    return false;
  }

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!payload.exp) {
    return true;
  }

  const expiresAtMs = Number(payload.exp) * 1000;
  return Number.isFinite(expiresAtMs) && expiresAtMs > Date.now();
};

export const getValidToken = () => {
  const token = getStoredToken();
  return isTokenValid(token) ? token : null;
};

export const saveAuthSession = ({ token, user }) => {
  if (!isTokenValid(token)) {
    throw new Error('Invalid authentication token received.');
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
};