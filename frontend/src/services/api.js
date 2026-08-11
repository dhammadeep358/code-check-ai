import axios from 'axios';

// Local dev: backend runs separately on :5000 (set in frontend/.env).
// Netlify: leave VITE_API_BASE_URL unset — '/api' is same-origin and is
// rewritten by netlify.toml to the serverless function.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.';
}

export default api;
