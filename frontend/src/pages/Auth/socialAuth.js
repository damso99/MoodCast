export const KAKAO_OAUTH_STATE_KEY = "moodcast-kakao-oauth-state";
export const SOCIAL_SIGNUP_PENDING_KEY = "moodcast-social-signup-pending";

export const getKakaoRedirectUri = () => {
  return `${window.location.origin}/auth/kakao/callback`;
};

export const startKakaoLogin = () => {
  const clientId = import.meta.env.VITE_KAKAO_CLIENT_ID;

  if (!clientId) {
    throw new Error("카카오 REST API 키가 설정되지 않았습니다.");
  }

  const state =
    window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  window.sessionStorage.setItem(KAKAO_OAUTH_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getKakaoRedirectUri(),
    response_type: "code",
    state: state,
  });

  window.location.href = `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
};
