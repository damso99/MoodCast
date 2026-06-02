import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";
import AuthToast from "./components/AuthToast";
import {
  getGoogleRedirectUri,
  getKakaoRedirectUri,
  GOOGLE_OAUTH_MODE_KEY,
  GOOGLE_OAUTH_STATE_KEY,
  KAKAO_OAUTH_MODE_KEY,
  KAKAO_OAUTH_STATE_KEY,
  OAUTH_MODE_LINK,
  SOCIAL_SIGNUP_PENDING_KEY,
} from "./socialAuth";
import { getApiMessage, getToastDuration } from "./authFeedback";
import styles from "./LoginPage.module.css";

export const SocialCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accessToken, setAuthData } = useAuthStore();
  const calledRef = useRef(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
  const isGoogleCallback = window.location.pathname.includes("/auth/google/");
  const providerLabel = isGoogleCallback ? "Google" : "카카오";
  const stateKey = isGoogleCallback ? GOOGLE_OAUTH_STATE_KEY : KAKAO_OAUTH_STATE_KEY;
  const modeKey = isGoogleCallback ? GOOGLE_OAUTH_MODE_KEY : KAKAO_OAUTH_MODE_KEY;
  const redirectUri = isGoogleCallback ? getGoogleRedirectUri() : getKakaoRedirectUri();
  const loginUrl = `${BACKSERVER}/oauth/${isGoogleCallback ? "google" : "kakao"}/login`;
  const linkUrl = `${BACKSERVER}/oauth/${isGoogleCallback ? "google" : "kakao"}/link`;

  const showToast = (type, message) => {
    setToast({ show: true, type, message, duration: getToastDuration(type) });
  };

  const getSocialLoginErrorMessage = (error) => {
    const data = error?.response?.data;

    if (data?.status === "EMAIL_CONFLICT" || error?.response?.status === 409) {
      return `이미 일반 회원으로 가입된 이메일입니다. 일반 로그인 후 설정에서 ${providerLabel} 계정을 연결해주세요.`;
    }

    return getApiMessage(error, error.message || `${providerLabel} 로그인 설정을 확인해주세요.`);
  };

  useEffect(() => {
    if (calledRef.current) {
      return;
    }
    calledRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = window.sessionStorage.getItem(stateKey);
    const oauthMode = window.sessionStorage.getItem(modeKey);
    window.sessionStorage.removeItem(stateKey);
    window.sessionStorage.removeItem(modeKey);

    if (!code) {
      showToast("error", `${providerLabel} 인증 코드가 없습니다.`);
      setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
      return;
    }

    if (!savedState || savedState !== state) {
      showToast("error", `${providerLabel} 로그인 요청 정보가 올바르지 않습니다.`);
      setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
      return;
    }

    if (oauthMode === OAUTH_MODE_LINK) {
      if (!accessToken) {
        showToast("error", `로그인 후 ${providerLabel} 계정을 연결해주세요.`);
        setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
        return;
      }

      axios
        .post(
          linkUrl,
          {
            code,
            redirectUri,
          },
          {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          },
        )
        .then((res) => {
          showToast("success", res.data?.message || `${providerLabel} 계정이 연결되었습니다.`);
          setTimeout(() => navigate("/app/settings", { replace: true }), 900);
        })
        .catch((err) => {
          showToast(
            "error",
            getApiMessage(err, err.message || `${providerLabel} 계정 연결 정보를 확인해주세요.`),
          );
          setTimeout(() => navigate("/app/settings", { replace: true }), 1600);
        });
      return;
    }

    axios
      .post(
        loginUrl,
        {
          code,
          redirectUri,
        },
        {
          withCredentials: true,
        },
      )
      .then((res) => {
        if (res.data?.accessToken) {
          setAuthData(res.data.accessToken, res.data.member);
          navigate("/app/feed", { replace: true });
          return;
        }

        if (res.data?.status === "NEED_EXTRA_SIGNUP") {
          window.sessionStorage.setItem(
            SOCIAL_SIGNUP_PENDING_KEY,
            JSON.stringify(res.data),
          );
          navigate("/auth/social/signup", { replace: true });
          return;
        }

        throw new Error(`${providerLabel} 로그인 응답이 올바르지 않습니다.`);
      })
      .catch((err) => {
        showToast("error", getSocialLoginErrorMessage(err));
        setTimeout(() => navigate("/auth/login", { replace: true }), 1600);
      });
  }, [accessToken, linkUrl, loginUrl, modeKey, navigate, providerLabel, redirectUri, searchParams, setAuthData, stateKey]);

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
            <strong>MoodCast</strong>
          </div>
          <h1>{providerLabel} 로그인</h1>
          <p>로그인 정보를 확인하고 있습니다</p>
        </header>
      </section>
    </main>
  );
};

export default SocialCallbackPage;
