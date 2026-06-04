export const KAKAO_OAUTH_STATE_KEY = "moodcast-kakao-oauth-state";
export const KAKAO_OAUTH_MODE_KEY = "moodcast-kakao-oauth-mode";
export const GOOGLE_OAUTH_STATE_KEY = "moodcast-google-oauth-state";
export const GOOGLE_OAUTH_MODE_KEY = "moodcast-google-oauth-mode";
export const NAVER_OAUTH_STATE_KEY = "moodcast-naver-oauth-state";
export const NAVER_OAUTH_MODE_KEY = "moodcast-naver-oauth-mode";
export const SOCIAL_SIGNUP_PENDING_KEY = "moodcast-social-signup-pending";
export const OAUTH_MODE_LOGIN = "LOGIN";
export const OAUTH_MODE_LINK = "LINK";
export const KAKAO_OAUTH_MODE_LOGIN = OAUTH_MODE_LOGIN;
export const KAKAO_OAUTH_MODE_LINK = OAUTH_MODE_LINK;

export const getKakaoRedirectUri = () => {
  return `${window.location.origin}/auth/kakao/callback`;
};

export const getGoogleRedirectUri = () => {
  return `${window.location.origin}/auth/google/callback`;
};

export const getNaverRedirectUri = () => {
  return `${window.location.origin}/auth/naver/callback`;
};

const createOAuthState = () => {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
};

const startKakaoOAuth = (mode) => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;

  if (!clientId) {
    throw new Error("카카오 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
  }

  const state = createOAuthState();
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(KAKAO_OAUTH_MODE_KEY, mode);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    response_type: "code",
    state: state,
  });

  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};

const startGoogleOAuth = (mode) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("Google 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
  }

  const state = createOAuthState();
  window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(GOOGLE_OAUTH_MODE_KEY, mode);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: state,
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const startNaverOAuth = (mode) => {
  const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;

  if (!clientId) {
    throw new Error("네이버 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
  }

  const state = createOAuthState();
  window.sessionStorage.setItem(NAVER_OAUTH_STATE_KEY, state);
  window.sessionStorage.setItem(NAVER_OAUTH_MODE_KEY, mode);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getNaverRedirectUri(),
    state: state,
  });

  window.location.href = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
};

export const startKakaoLogin = () => {
  startKakaoOAuth(OAUTH_MODE_LOGIN);
};

export const startKakaoLink = () => {
  startKakaoOAuth(OAUTH_MODE_LINK);
};

export const startGoogleLogin = () => {
  startGoogleOAuth(OAUTH_MODE_LOGIN);
};

export const startGoogleLink = () => {
  startGoogleOAuth(OAUTH_MODE_LINK);
};

export const startNaverLogin = () => {
  startNaverOAuth(OAUTH_MODE_LOGIN);
};

export const startNaverLink = () => {
  startNaverOAuth(OAUTH_MODE_LINK);
};
