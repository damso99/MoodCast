import { useEffect, useState } from 'react';
import axios from 'axios';

const ACCESS_TOKEN_KEY = 'moodcast-access-token';
const MEMBER_KEY = 'moodcast-member';
const AUTH_EVENT_NAME = 'moodcast-auth-change';
const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

const readAuthStore = () => {
  const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const memberText = window.sessionStorage.getItem(MEMBER_KEY);
  let member = null;

  // 문자열 -> json 파싱
  if (memberText) {
    try {
      member = JSON.parse(memberText);
    } catch (e) {
      member = null;
    }
  }


  return {
    isLoggedIn: Boolean(accessToken),
    accessToken,
    member,
  };
};

// 본체
export function useAuthStore() {
  const [authStore, setAuthStore] = useState(readAuthStore);

  useEffect(() => {
    const syncAuthStore = () => {
      setAuthStore(readAuthStore());
    };

    window.addEventListener('storage', syncAuthStore);
    window.addEventListener(AUTH_EVENT_NAME, syncAuthStore);

    return () => {
      window.removeEventListener('storage', syncAuthStore);
      window.removeEventListener(AUTH_EVENT_NAME, syncAuthStore);
    };
  }, []);

  const notifyAuthChange = () => {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  };

  const setAuthData = (accessToken, member) => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    window.localStorage.setItem('moodcast-auth', 'true');
    setAuthStore(readAuthStore());
    notifyAuthChange();
  };

  const clearAuthData = () => {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(MEMBER_KEY);
    window.localStorage.setItem('moodcast-auth', 'false');
    setAuthStore(readAuthStore());
    notifyAuthChange();
  };

  const setIsLoggedIn = (value) => {
    if (!value) {
      clearAuthData();
      return;
    }

    window.localStorage.setItem('moodcast-auth', 'true');
    setAuthStore((prev) => ({
      ...prev,
      isLoggedIn: true,
    }));
    notifyAuthChange();
  };

  useEffect(() => {
    if (!authStore.accessToken) {
      return;
    }

    axios
      .get(`${BACKSERVER}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authStore.accessToken}`,
        },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.member) {
          window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(res.data.member));
          setAuthStore(readAuthStore());
        }
      })
      .catch(() => {
        clearAuthData();
      });
  }, [authStore.accessToken]);

  return {
    isLoggedIn: authStore.isLoggedIn,
    accessToken: authStore.accessToken,
    member: authStore.member,
    setIsLoggedIn,
    setAuthData,
    clearAuthData,
  };
}
