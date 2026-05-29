import axios from 'axios';
import { useAuthStore, logoutAndRedirect } from '../../stores/useAuthStore';

const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
axios.defaults.baseURL = BACKSERVER;

axios.interceptors.request.use(
  (config) => {
    // 요청을 보낼 때마다 현재 저장된 토큰을 가져옴
    // 토큰이 있으면 Authorization 헤더에 붙여서 보냄
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
    // 서버가 401 또는 403을 보내면 로그인 정보가 무효해진 것임
    // 이럴 때는 로그아웃 후 로그인 페이지로 이동함
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      logoutAndRedirect();
    }
    return Promise.reject(error);
  },
);

export default axios;
