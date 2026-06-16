import { create } from "zustand";

const ACCESS_TOKEN_KEY = "moodcast-access-token";
const MEMBER_KEY = "moodcast-member";

const safeStorageGet = (storage, key) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch (error) {
    return null;
  }
};

const safeStorageSet = (storage, key, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    storage.setItem(key, value);
  } catch (error) {
    // 저장 실패는 로그인 흐름을 막지 않도록 무시합니다.
  }
};

const safeStorageRemove = (storage, key) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    storage.removeItem(key);
  } catch (error) {
    // 정리 실패는 치명적이지 않으므로 무시합니다.
  }
};

const readMemberFromStorage = (storage) => {
  const rawValue = safeStorageGet(storage, MEMBER_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return null;
  }
};

const readAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const persistentToken = safeStorageGet(window.localStorage, ACCESS_TOKEN_KEY);
  if (persistentToken) {
    return persistentToken;
  }

  return safeStorageGet(window.sessionStorage, ACCESS_TOKEN_KEY);
};

const readMember = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const persistentMember = readMemberFromStorage(window.localStorage);
  if (persistentMember) {
    return persistentMember;
  }

  return readMemberFromStorage(window.sessionStorage);
};

const readRemember = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(safeStorageGet(window.localStorage, ACCESS_TOKEN_KEY));
};

const persistAuthData = (accessToken, member, remember) => {
  if (typeof window === "undefined") {
    return;
  }

  safeStorageRemove(window.sessionStorage, ACCESS_TOKEN_KEY);
  safeStorageRemove(window.sessionStorage, MEMBER_KEY);
  safeStorageRemove(window.localStorage, ACCESS_TOKEN_KEY);
  safeStorageRemove(window.localStorage, MEMBER_KEY);

  if (remember) {
    safeStorageSet(window.localStorage, ACCESS_TOKEN_KEY, accessToken);
    safeStorageSet(window.localStorage, MEMBER_KEY, JSON.stringify(member));
  }

  safeStorageSet(window.sessionStorage, ACCESS_TOKEN_KEY, accessToken);
  safeStorageSet(window.sessionStorage, MEMBER_KEY, JSON.stringify(member));
};

export const useAuthStore = create((set) => ({
  accessToken: readAccessToken(),
  member: readMember(),
  remember: readRemember(),
  isLoggedIn: Boolean(readAccessToken()),

  setAuthData: (accessToken, member, remember) => {
    const nextRemember =
      typeof remember === "boolean"
        ? remember
        : Boolean(safeStorageGet(window.localStorage, ACCESS_TOKEN_KEY));

    persistAuthData(accessToken, member, nextRemember);

    set({
      accessToken,
      member,
      remember: nextRemember,
      isLoggedIn: true,
    });
  },

  clearAuthData: () => {
    safeStorageRemove(window.sessionStorage, ACCESS_TOKEN_KEY);
    safeStorageRemove(window.sessionStorage, MEMBER_KEY);
    safeStorageRemove(window.localStorage, ACCESS_TOKEN_KEY);
    safeStorageRemove(window.localStorage, MEMBER_KEY);

    set({
      accessToken: null,
      member: null,
      remember: false,
      isLoggedIn: false,
    });
  },
}));

export const logoutAndRedirect = () => {
  const store = useAuthStore.getState();

  if (store && typeof store.clearAuthData === "function") {
    store.clearAuthData();
  } else {
    safeStorageRemove(window.sessionStorage, ACCESS_TOKEN_KEY);
    safeStorageRemove(window.sessionStorage, MEMBER_KEY);
    safeStorageRemove(window.localStorage, ACCESS_TOKEN_KEY);
    safeStorageRemove(window.localStorage, MEMBER_KEY);
    useAuthStore.setState({
      accessToken: null,
      member: null,
      remember: false,
      isLoggedIn: false,
    });
  }

  if (typeof window !== "undefined") {
    window.location.replace("/auth/login");
  }
};
