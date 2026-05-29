import axios from 'axios';
import { useAuthStore, logoutAndRedirect } from '../../stores/useAuthStore';

const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
axios.defaults.baseURL = BACKSERVER;

axios.interceptors.request.use(
  (config) => {
    const state = useAuthStore.getState ? useAuthStore.getState() : null;
    const token = state?.accessToken || window.sessionStorage.getItem('moodcast-access-token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      logoutAndRedirect();
    }
    return Promise.reject(error);
  },
);

export default axios;
