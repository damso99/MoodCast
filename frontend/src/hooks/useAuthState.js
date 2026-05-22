import { useEffect, useState } from 'react';
import axios from 'axios';

const ACCESS_TOKEN_KEY = 'moodcast-access-token';
const MEMBER_KEY = 'moodcast-member';
const AUTH_EVENT_NAME = 'moodcast-auth-change';
const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

const readAuthState = () => {
  const accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const memberText = window.sessionStorage.getItem(MEMBER_KEY);
  let member = null;

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

export function useAuthState() {
  const [authState, setAuthState] = useState(readAuthState);

  useEffect(() => {
    const syncAuthState = () => {
      setAuthState(readAuthState());
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_EVENT_NAME, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_EVENT_NAME, syncAuthState);
    };
  }, []);

  const notifyAuthChange = () => {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  };

  const setAuthData = (accessToken, member) => {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    window.localStorage.setItem('moodcast-auth', 'true');
    setAuthState(readAuthState());
    notifyAuthChange();
  };

  const clearAuthData = () => {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(MEMBER_KEY);
    window.localStorage.setItem('moodcast-auth', 'false');
    setAuthState(readAuthState());
    notifyAuthChange();
  };

  const setIsLoggedIn = (value) => {
    if (!value) {
      clearAuthData();
      return;
    }

    window.localStorage.setItem('moodcast-auth', 'true');
    setAuthState((prev) => ({
      ...prev,
      isLoggedIn: true,
    }));
    notifyAuthChange();
  };

  useEffect(() => {
    if (!authState.accessToken) {
      return;
    }

    axios
      .get(`${BACKSERVER}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.member) {
          window.sessionStorage.setItem(MEMBER_KEY, JSON.stringify(res.data.member));
          setAuthState(readAuthState());
        }
      })
      .catch(() => {
        clearAuthData();
      });
  }, [authState.accessToken]);

  return {
    isLoggedIn: authState.isLoggedIn,
    accessToken: authState.accessToken,
    member: authState.member,
    setIsLoggedIn,
    setAuthData,
    clearAuthData,
  };
}
