import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AuthToast from "./components/AuthToast";
import AuthConfirmModal from "./components/AuthConfirmModal";
import { getApiMessage, getToastDuration } from "./authFeedback";
import styles from "./LoginPage.module.css";

const phoneRegex = /^010[0-9]{8}$/;
const passwordRegex =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[?!@#$%^&*])[A-Za-z\d?!@#$%^&*]{8,20}$/;

export const AccountRecoveryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "password" ? "password" : "email";
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [foundAccount, setFoundAccount] = useState(null);
  const [passwordCodeVerified, setPasswordCodeVerified] = useState(false);
  const [resetSuccessModalOpen, setResetSuccessModalOpen] = useState(false);
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
    const duration = getToastDuration(type);

    setToast({
      show: true,
      type: type,
      message: message,
      duration: duration,
    });

    setTimeout(() => {
      setToast({
        show: false,
        type: "",
        message: "",
      });
    }, duration);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode });
    setFoundAccount(null);
    setPasswordCodeVerified(false);
  };

  const inputFindEmail = (e) => {
    setFindEmailForm({
      ...findEmailForm,
      [e.target.name]: e.target.value,
    });
    setFoundAccount(null);
  };

  const inputPassword = (e) => {
    const shouldResetVerification = ["email", "phone", "authCode"].includes(e.target.name);

    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });

    if (shouldResetVerification) {
      setPasswordCodeVerified(false);
    }
  };

  const sendFindEmailCode = () => {
    if (!findEmailForm.name.trim()) {
      showToast("error", "이름을 입력해주세요.");
      return;
    }

    if (!phoneRegex.test(findEmailForm.phone.trim())) {
      showToast("error", "휴대폰 번호는 010으로 시작하는 11자리 숫자로 입력해주세요.");
      return;
    }

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
        showToast("success", res.data.message || "아이디 찾기 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
      })
      .catch((err) => {
        showToast("error", getApiMessage(err, "이름과 휴대폰 번호를 다시 확인해주세요."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const verifyFindEmail = (e) => {
    e.preventDefault();

    if (!findEmailForm.authCode.trim()) {
      showToast("error", "인증번호를 입력해주세요.");
      return;
    }

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
        showToast("error", getApiMessage(err, "인증번호를 확인해주세요."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const sendPasswordCode = () => {
    if (!passwordForm.email.trim()) {
      showToast("error", "이메일을 입력해주세요.");
      return;
    }

    if (!phoneRegex.test(passwordForm.phone.trim())) {
      showToast("error", "휴대폰 번호는 010으로 시작하는 11자리 숫자로 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setPasswordCodeVerified(false);

    axios
      .post(`${BACKSERVER}/auth/recovery/password/send-phone-code`, {
        email: passwordForm.email,
        phone: passwordForm.phone,
      })
      .then((res) => {
        if (res.data.authCode) {
          console.log("비밀번호 재설정 인증번호:", res.data.authCode);
        }
        showToast("success", res.data.message || "비밀번호 재설정 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
      })
      .catch((err) => {
        showToast("error", getApiMessage(err, "이메일과 휴대폰 번호를 다시 확인해주세요."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const verifyPasswordCode = () => {
    if (!passwordForm.authCode.trim()) {
      showToast("error", "인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/password/verify`, {
        email: passwordForm.email,
        phone: passwordForm.phone,
        authCode: passwordForm.authCode,
      })
      .then((res) => {
        setPasswordCodeVerified(true);
        showToast("success", res.data.message || "휴대폰 인증이 완료되었습니다.");
      })
      .catch((err) => {
        setPasswordCodeVerified(false);
        showToast("error", getApiMessage(err, "인증번호를 확인해주세요."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const resetPassword = (e) => {
    e.preventDefault();

    if (!passwordCodeVerified) {
      showToast("error", "휴대폰 인증을 먼저 완료해주세요.");
      return;
    }

    if (!passwordRegex.test(passwordForm.newPassword)) {
      showToast("error", "비밀번호는 영문, 숫자, 특수문자를 포함한 8~20자입니다.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      showToast("error", "새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    axios
      .post(`${BACKSERVER}/auth/recovery/password/reset`, passwordForm)
      .then((res) => {
        showToast("success", res.data.message || "비밀번호가 재설정되었습니다.");
        setResetSuccessModalOpen(true);
      })
      .catch((err) => {
        showToast("error", getApiMessage(err, "새 비밀번호 조건을 확인해주세요."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />
      <AuthConfirmModal
        open={resetSuccessModalOpen}
        title="비밀번호 재설정 완료"
        description="새 비밀번호로 다시 로그인해주세요. 기존 로그인 세션은 모두 만료됩니다."
        confirmOnly
        confirmText="로그인하러 가기"
        onConfirm={() => navigate("/auth/login", { replace: true })}
      />

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

            <div className={styles.codeRow}>
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
              <button type="button" className={styles.secondary} onClick={sendFindEmailCode} disabled={isLoading}>
                인증번호 발송
              </button>
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
              <button type="submit" className={styles.secondary} disabled={isLoading}>
                인증 확인
              </button>
            </div>

            {foundAccount ? (
              <p className={styles.resultBox}>
                가입 이메일: {foundAccount.email}
                {foundAccount.kakaoLinked ? <span>카카오 연동 계정입니다.</span> : null}
              </p>
            ) : null}

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

            <div className={styles.codeRow}>
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
              <button type="button" className={styles.secondary} onClick={sendPasswordCode} disabled={isLoading}>
                인증번호 발송
              </button>
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
              <button type="button" className={styles.secondary} onClick={verifyPasswordCode} disabled={isLoading}>
                인증 확인
              </button>
            </div>

            {passwordCodeVerified ? <p className={styles.message}>휴대폰 인증이 완료되었습니다.</p> : null}

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
                disabled={!passwordCodeVerified}
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
                disabled={!passwordCodeVerified}
              />
            </div>

            <button type="submit" className={styles.primary} disabled={isLoading || !passwordCodeVerified}>
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
