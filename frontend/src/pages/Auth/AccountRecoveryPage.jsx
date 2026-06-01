import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AuthToast from "./components/AuthToast";
import styles from "./LoginPage.module.css";

export const AccountRecoveryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "password" ? "password" : "email";
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [foundAccount, setFoundAccount] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [findEmailForm, setFindEmailForm] = useState({
    name: "",
    phone: "",
    authCode: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    email: "",
    phone: "",
    authCode: "",
    newPassword: "",
    newPasswordConfirm: "",
  });

  const showToast = (type, message) => {
    setToast({
      show: true,
      type: type,
      message: message,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "",
        message: "",
      });
    }, 2500);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode });
    setFoundAccount(null);
  };

  const inputFindEmail = (e) => {
    setFindEmailForm({
      ...findEmailForm,
      [e.target.name]: e.target.value,
    });
    setFoundAccount(null);
  };

  const inputPassword = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const sendFindEmailCode = () => {
    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/email/send-phone-code`, {
        name: findEmailForm.name,
        phone: findEmailForm.phone,
      })
      .then((res) => {
        if (res.data.authCode) {
          console.log("아이디 찾기 인증번호:", res.data.authCode);
        }
        showToast("success", res.data.message || "인증번호가 발송되었습니다.");
      })
      .catch((err) => {
        showToast("error", err.response?.data?.message || "인증번호 발송에 실패했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const verifyFindEmail = (e) => {
    e.preventDefault();
    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/email/verify`, findEmailForm)
      .then((res) => {
        setFoundAccount({
          email: res.data.email || "",
          kakaoLinked: Boolean(res.data.kakaoLinked),
        });
        showToast("success", res.data.message || "계정을 찾았습니다.");
      })
      .catch((err) => {
        showToast("error", err.response?.data?.message || "계정 찾기에 실패했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const sendPasswordCode = () => {
    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/password/send-phone-code`, {
        email: passwordForm.email,
        phone: passwordForm.phone,
      })
      .then((res) => {
        if (res.data.authCode) {
          console.log("비밀번호 재설정 인증번호:", res.data.authCode);
        }
        showToast("success", res.data.message || "인증번호가 발송되었습니다.");
      })
      .catch((err) => {
        showToast("error", err.response?.data?.message || "인증번호 발송에 실패했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const resetPassword = (e) => {
    e.preventDefault();
    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/password/reset`, passwordForm)
      .then((res) => {
        showToast("success", res.data.message || "비밀번호가 재설정되었습니다.");
        setTimeout(() => {
          navigate("/auth/login");
        }, 900);
      })
      .catch((err) => {
        showToast("error", err.response?.data?.message || "비밀번호 재설정에 실패했습니다.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />

      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
            <strong>MoodCast</strong>
          </div>
          <h1>계정 찾기</h1>
          <p>가입 정보와 휴대폰 인증으로 계정을 확인합니다</p>
        </header>

        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "email" ? styles.tabActive : ""}
            onClick={() => changeMode("email")}
          >
            아이디 찾기
          </button>
          <button
            type="button"
            className={mode === "password" ? styles.tabActive : ""}
            onClick={() => changeMode("password")}
          >
            비밀번호 재설정
          </button>
        </div>

        {mode === "email" ? (
          <form className={styles.form} onSubmit={verifyFindEmail}>
            <div className={styles.field}>
              <label htmlFor="findEmailName">
                이름 <b>*</b>
              </label>
              <input
                id="findEmailName"
                name="name"
                value={findEmailForm.name}
                onChange={inputFindEmail}
                placeholder="이름을 입력하세요"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="findEmailPhone">
                휴대폰 번호 <b>*</b>
              </label>
              <input
                id="findEmailPhone"
                name="phone"
                value={findEmailForm.phone}
                onChange={inputFindEmail}
                placeholder="01012345678"
              />
            </div>

            <div className={styles.codeRow}>
              <div className={styles.field}>
                <label htmlFor="findEmailAuthCode">
                  인증번호 <b>*</b>
                </label>
                <input
                  id="findEmailAuthCode"
                  name="authCode"
                  value={findEmailForm.authCode}
                  onChange={inputFindEmail}
                  placeholder="6자리"
                />
              </div>
              <button type="button" className={styles.secondary} onClick={sendFindEmailCode} disabled={isLoading}>
                번호 받기
              </button>
            </div>

            {foundAccount ? (
              <p className={styles.resultBox}>
                가입 이메일: {foundAccount.email}
                {foundAccount.kakaoLinked ? <span>카카오 연동 계정입니다.</span> : null}
              </p>
            ) : null}

            <button type="submit" className={styles.primary} disabled={isLoading}>
              {isLoading ? "확인 중..." : "아이디 찾기"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={resetPassword}>
            <div className={styles.field}>
              <label htmlFor="resetEmail">
                이메일 <b>*</b>
              </label>
              <input
                type="email"
                id="resetEmail"
                name="email"
                value={passwordForm.email}
                onChange={inputPassword}
                placeholder="이메일 주소를 입력하세요"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="resetPhone">
                휴대폰 번호 <b>*</b>
              </label>
              <input
                id="resetPhone"
                name="phone"
                value={passwordForm.phone}
                onChange={inputPassword}
                placeholder="01012345678"
              />
            </div>

            <div className={styles.codeRow}>
              <div className={styles.field}>
                <label htmlFor="resetAuthCode">
                  인증번호 <b>*</b>
                </label>
                <input
                  id="resetAuthCode"
                  name="authCode"
                  value={passwordForm.authCode}
                  onChange={inputPassword}
                  placeholder="6자리"
                />
              </div>
              <button type="button" className={styles.secondary} onClick={sendPasswordCode} disabled={isLoading}>
                번호 받기
              </button>
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword">
                새 비밀번호 <b>*</b>
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={inputPassword}
                placeholder="영문, 숫자, 특수문자 포함 8~20자"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="newPasswordConfirm">
                새 비밀번호 확인 <b>*</b>
              </label>
              <input
                type="password"
                id="newPasswordConfirm"
                name="newPasswordConfirm"
                value={passwordForm.newPasswordConfirm}
                onChange={inputPassword}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
            </div>

            <button type="submit" className={styles.primary} disabled={isLoading}>
              {isLoading ? "변경 중..." : "비밀번호 재설정"}
            </button>
          </form>
        )}

        <p className={styles.signupText}>
          로그인 화면으로 돌아갈까요?{" "}
          <button type="button" onClick={() => navigate("/auth/login")}>
            로그인
          </button>
        </p>
      </section>
    </main>
  );
};

export default AccountRecoveryPage;
