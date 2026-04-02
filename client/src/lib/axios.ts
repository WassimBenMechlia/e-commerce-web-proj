import axios from 'axios';

const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

let refreshPromise: Promise<void> | null = null;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(
        error instanceof Error ? error : new Error('Request failed.'),
      );
    }

    const request = error.config;
    const isAuthRoute =
      request.url?.includes('/auth/login') ||
      request.url?.includes('/auth/register') ||
      request.url?.includes('/auth/refresh') ||
      request.url?.includes('/auth/forgot-password') ||
      request.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !request._retry && !isAuthRoute) {
      request._retry = true;
      refreshPromise ??= axios
        .post(`${API_URL}/auth/refresh`, null, {
          withCredentials: true,
        })
        .then(() => undefined)
        .finally(() => {
          refreshPromise = null;
        });

      await refreshPromise;
      return api(request);
    }

    return Promise.reject(error);
  },
);
