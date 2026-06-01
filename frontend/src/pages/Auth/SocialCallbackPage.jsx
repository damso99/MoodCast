import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";
import AuthToast from "./components/AuthToast";
import {
  getKakaoRedirectUri,
  KAKAO_OAUTH_MODE_KEY,
  KAKAO_OAUTH_MODE_LINK,
  KAKAO_OAUTH_STATE_KEY,
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

  const showToast = (type, message) => {
    setToast({ show: true, type, message, duration: getToastDuration(type) });
  };

  useEffect(() => {
    if (calledRef.current) {
      return;
    }
    calledRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = window.sessionStorage.getItem(KAKAO_OAUTH_STATE_KEY);
    const oauthMode = window.sessionStorage.getItem(KAKAO_OAUTH_MODE_KEY);
    window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_KEY);
    window.sessionStorage.removeItem(KAKAO_OAUTH_MODE_KEY);

    if (!code) {
      showToast("error", "카카오 인증 코드가 없습니다.");
      setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
      return;
    }

    if (!savedState || savedState !== state) {
      showToast("error", "카카오 로그인 요청 정보가 올바르지 않습니다.");
      setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
      return;
    }

    if (oauthMode === KAKAO_OAUTH_MODE_LINK) {
      if (!accessToken) {
        showToast("error", "로그인 후 카카오 계정을 연결해주세요.");
        setTimeout(() => navigate("/auth/login", { replace: true }), 1200);
        return;
      }

      axios
        .post(
          `${BACKSERVER}/oauth/kakao/link`,
          {
            code,
            redirectUri: getKakaoRedirectUri(),
          },
          {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          },
        )
        .then((res) => {
          showToast("success", res.data?.message || "카카오 계정이 연결되었습니다.");
          setTimeout(() => navigate("/app/settings", { replace: true }), 900);
        })
        .catch((err) => {
          showToast(
            "error",
            getApiMessage(err, err.message || "카카오 계정 연결 정보를 확인해주세요."),
          );
          setTimeout(() => navigate("/app/settings", { replace: true }), 1600);
        });
      return;
    }

    axios
      .post(
        `${BACKSERVER}/oauth/kakao/login`,
        {
          code,
          redirectUri: getKakaoRedirectUri(),
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

        throw new Error("카카오 로그인 응답이 올바르지 않습니다.");
      })
      .catch((err) => {
        showToast(
          "error",
          getApiMessage(err, err.message || "카카오 로그인 설정을 확인해주세요."),
        );
        setTimeout(() => navigate("/auth/login", { replace: true }), 1600);
      });
  }, [BACKSERVER, accessToken, navigate, searchParams, setAuthData]);

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
            <strong>MoodCast</strong>
          </div>
          <h1>카카오 로그인</h1>
          <p>로그인 정보를 확인하고 있습니다</p>
        </header>
      </section>
    </main>
  );
};

export default SocialCallbackPage;
