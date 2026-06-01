import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";
import AuthConfirmModal from "./components/AuthConfirmModal";
import AuthToast from "./components/AuthToast";
import { getApiMessage, getToastDuration } from "./authFeedback";
import { SOCIAL_SIGNUP_PENDING_KEY } from "./socialAuth";
import styles from "./SignupPage.module.css";

const nameRegex = /^[가-힣]{2,10}$/;
const nicknameRegex = /^[가-힣A-Za-z0-9]{2,12}$/;
const phoneRegex = /^010[0-9]{8}$/;

export const SocialExtraSignupPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  const [pending, setPending] = useState(null);
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    phone: "",
    phoneCode: "",
  });
  const [phoneAuth, setPhoneAuth] = useState(0);
  const [phoneSendLoading, setPhoneSendLoading] = useState(false);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [termsList, setTermsList] = useState([]);
  const [agreements, setAgreements] = useState({});
  const [signupCompleteModalOpen, setSignupCompleteModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  const showToast = (type, message) => {
    const duration = getToastDuration(type);
    setToast({ show: true, type, message, duration });
    setTimeout(() => setToast({ show: false, type: "", message: "" }), duration);
  };

  useEffect(() => {
    const pendingText = window.sessionStorage.getItem(SOCIAL_SIGNUP_PENDING_KEY);
    if (!pendingText) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const nextPending = JSON.parse(pendingText);
    setPending(nextPending);
    setForm((prev) => ({
      ...prev,
      nickname: nicknameRegex.test(nextPending.providerNickname || "")
        ? nextPending.providerNickname
        : "",
    }));

    axios
      .get(`${BACKSERVER}/signup/terms`)
      .then((res) => {
        const nextTermsList = res.data.terms || [];
        setTermsList(nextTermsList);
        setAgreements(
          nextTermsList.reduce((acc, term) => {
            acc[term.termsId] = false;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        showToast("error", "약관 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
      });
  }, [BACKSERVER, navigate]);

  const inputForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "phone") {
      setPhoneAuth(0);
    }
  };

  const sendPhoneAuthCode = () => {
    if (!phoneRegex.test(form.phone.trim())) {
      showToast("error", "휴대폰 번호는 010 포함 11자리로 입력해주세요.");
      return;
    }

    setPhoneSendLoading(true);
    axios
      .post(`${BACKSERVER}/signup/auth/phone/send`, {
        phone: form.phone.trim(),
      })
      .then((res) => {
        setPhoneAuth(1);
        if (res.data.authCode) {
          console.log("휴대폰 인증번호:", res.data.authCode);
        }
        showToast("success", res.data?.message || "휴대폰 인증번호를 발송했습니다. 3분 안에 입력해주세요.");
      })
      .catch((err) => {
        showToast(
          "error",
          getApiMessage(err, "휴대폰 번호와 요청 제한을 확인해주세요."),
        );
      })
      .finally(() => {
        setPhoneSendLoading(false);
      });
  };

  const checkPhoneAuthCode = () => {
    if (!form.phoneCode.trim()) {
      showToast("error", "휴대폰 인증번호를 입력해주세요.");
      return;
    }

    axios
      .post(`${BACKSERVER}/signup/auth/phone/verify`, {
        phone: form.phone.trim(),
        authCode: form.phoneCode.trim(),
      })
      .then((res) => {
        setPhoneAuth(3);
        showToast("success", res.data?.message || "휴대폰 인증이 완료되었습니다.");
      })
      .catch((err) => {
        showToast(
          "error",
          getApiMessage(err, "휴대폰 인증번호를 확인해주세요."),
        );
      });
  };

  const toggleAgreement = (termsId) => {
    setAgreements((prev) => ({
      ...prev,
      [termsId]: !prev[termsId],
    }));
  };

  const completeSocialSignup = () => {
    if (!nameRegex.test(form.name.trim())) {
      showToast("error", "이름은 한글 2~10자로 입력해주세요.");
      return;
    }

    if (form.nickname.trim() && !nicknameRegex.test(form.nickname.trim())) {
      showToast("error", "닉네임은 한글, 영문, 숫자만 사용해 2~12자로 입력해주세요.");
      return;
    }

    if (phoneAuth !== 3) {
      showToast("error", "휴대폰 인증을 완료해주세요.");
      return;
    }

    const requiredNotAgreed = termsList.some(
      (term) => term.isRequired === 1 && !agreements[term.termsId],
    );
    if (requiredNotAgreed) {
      showToast("error", "필수 약관에 동의해주세요.");
      return;
    }

    setSignupSubmitting(true);
    axios
      .post(
        `${BACKSERVER}/oauth/social/signup`,
        {
          pendingToken: pending.pendingToken,
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          phone: form.phone.trim(),
          agreements: termsList.map((term) => ({
            termsId: term.termsId,
            agreed: Boolean(agreements[term.termsId]),
          })),
        },
        {
          withCredentials: true,
        },
      )
      .then((res) => {
        window.sessionStorage.removeItem(SOCIAL_SIGNUP_PENDING_KEY);
        setAuthData(res.data.accessToken, res.data.member);
        setSignupCompleteModalOpen(true);
      })
      .catch((err) => {
        showToast(
          "error",
          getApiMessage(err, "소셜 회원가입 정보를 다시 확인해주세요."),
        );
      })
      .finally(() => {
        setSignupSubmitting(false);
      });
  };

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />
      <AuthConfirmModal
        open={signupCompleteModalOpen}
        title="소셜 회원가입 완료"
        description="카카오 계정과 MoodCast 계정이 연결되었습니다. 이제 카카오 로그인으로도 이용할 수 있습니다."
        confirmOnly
        confirmText="피드로 이동"
        onConfirm={() => navigate("/app/feed", { replace: true })}
      />
      <section className={styles.authCard}>
        <header className={styles.brandHeader}>
          <div className={styles.brand}>
            <img
              className={styles.brandLogo}
              src="/MoodCast-logo.svg"
              alt=""
              aria-hidden="true"
            />
            <strong>MoodCast</strong>
          </div>
          <h1>소셜 회원가입</h1>
          <p>{pending?.providerEmail || "카카오 계정"}에 추가 정보를 연결합니다</p>
        </header>

        <form className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="socialName">
              이름 <b>*</b>
            </label>
            <input
              id="socialName"
              name="name"
              value={form.name}
              onChange={inputForm}
              placeholder="한글 2~10자"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="socialNickname">닉네임</label>
            <input
              id="socialNickname"
              name="nickname"
              value={form.nickname}
              onChange={inputForm}
              placeholder="한글, 영문, 숫자 2~12자"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="socialPhone">
              휴대폰 번호 <b>*</b>
            </label>
            <div className={styles.inputAction}>
              <input
                id="socialPhone"
                name="phone"
                value={form.phone}
                onChange={inputForm}
                placeholder="'-' 없이 번호만 입력"
                readOnly={phoneAuth === 3}
              />
              <button
                type="button"
                className={styles.ghostButton}
                onClick={sendPhoneAuthCode}
                disabled={phoneSendLoading || phoneAuth === 3}
              >
                {phoneSendLoading
                  ? "발송 중..."
                  : phoneAuth === 3
                    ? "인증완료"
                    : "인증번호 발송"}
              </button>
            </div>
          </div>

          {phoneAuth === 1 && (
            <div className={styles.field}>
              <label htmlFor="socialPhoneCode">
                휴대폰 인증번호 <b>*</b>
              </label>
              <div className={styles.inputAction}>
                <input
                  id="socialPhoneCode"
                  name="phoneCode"
                  value={form.phoneCode}
                  onChange={inputForm}
                  placeholder="인증번호 입력"
                />
                <button
                  type="button"
                  className={styles.ghostButton}
                  onClick={checkPhoneAuthCode}
                >
                  확인
                </button>
              </div>
            </div>
          )}

          <section className={styles.termsBox} aria-label="약관 동의">
            {termsList.map((term) => (
              <label className={styles.termItem} key={term.termsId}>
                <input
                  type="checkbox"
                  checked={Boolean(agreements[term.termsId])}
                  onChange={() => toggleAgreement(term.termsId)}
                />
                <span>
                  [{term.isRequired === 1 ? "필수" : "선택"}] {term.title}
                </span>
              </label>
            ))}
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.outlineButton}
              onClick={() => navigate("/auth/login")}
            >
              취소
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={completeSocialSignup}
              disabled={signupSubmitting}
            >
              {signupSubmitting ? "가입 중..." : "가입 완료"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SocialExtraSignupPage;
