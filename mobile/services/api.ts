import axios from 'axios';
import { API_URL } from '../constants/config';
import { normalizeError } from '../utils/error';

type Handlers = { getToken: () => string | null; onUnauthorized: () => void };
let handlers: Handlers = { getToken: () => null, onUnauthorized: () => {} };

export const setAuthHandlers = (h: Handlers) => {
  handlers = h;
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // free hosts cold-start slowly
});

api.interceptors.request.use((cfg) => {
  const token = handlers.getToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r, // do NOT unwrap here: services need meta
  (err) => {
    const code = err.response?.data?.error?.code;
    if (err.response?.status === 401 && code !== 'INVALID_CREDENTIALS') {
      handlers.onUnauthorized();
    }
    return Promise.reject(normalizeError(err));
  }
);
