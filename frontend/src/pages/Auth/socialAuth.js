export const KAKAO_OAUTH_STATE_KEY = "moodcast-kakao-oauth-state";
export const KAKAO_OAUTH_MODE_KEY = "moodcast-kakao-oauth-mode";
export const SOCIAL_SIGNUP_PENDING_KEY = "moodcast-social-signup-pending";
export const KAKAO_OAUTH_MODE_LOGIN = "LOGIN";
export const KAKAO_OAUTH_MODE_LINK = "LINK";

export const getKakaoRedirectUri = () => {
  return `${window.location.origin}/auth/kakao/callback`;
};

const startKakaoOAuth = (mode) => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;

  if (!clientId) {
    throw new Error("카카오 로그인 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
  }

  const state =
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
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

export const startKakaoLogin = () => {
  startKakaoOAuth(KAKAO_OAUTH_MODE_LOGIN);
};

export const startKakaoLink = () => {
  startKakaoOAuth(KAKAO_OAUTH_MODE_LINK);
};
