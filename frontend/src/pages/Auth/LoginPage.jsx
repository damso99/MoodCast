import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";
import { LoginView } from "./components/LoginView";
import AuthConfirmModal from "./components/AuthConfirmModal";
import { getApiMessage, getToastDuration } from "./authFeedback";
import {
  startGoogleLogin,
  startKakaoLogin,
  startNaverLogin,
} from "./socialAuth";

const SAVED_EMAIL_KEY = "moodcast-saved-email";
const ADMIN_ROLES = ["SUPER_ADMIN"];
const TEST_LOGIN_ACCOUNTS = {
  admin: {
    email: "admin01@gmail.com",
    password: "admin01!@",
  },
  user01: {
    email: "user01@gmail.com",
    password: "user01!@",
  },
  user02: {
    email: "user02@gmail.com",
    password: "user02!@",
  },
};

/*
 * 관리자 기능 담당 작업(문건우): 관리자 제재로 로그인 제한된 회원에게
 * 일시/영구 정지 안내 문구를 정확히 보여주기 위한 표시 전용 유틸입니다.
 */
const formatSuspendedDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10).replaceAll("-", "/");
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
};

const buildSuspendedLoginMessage = (data, fallbackMessage) => {
  if (data?.suspendType === "TEMPORARY") {
    const suspendDays =
      data.suspendDays === null || data.suspendDays === undefined
        ? "-"
        : data.suspendDays;
    const suspendedUntil = formatSuspendedDate(data.suspendedUntil);

    return [
      "계정이 일시 정지되었습니다.",
      "",
      `정지 기간: ${suspendDays}일`,
      `해제 예정일: ${suspendedUntil || "-"}`,
    ].join("\n");
  }

  if (data?.suspendType === "PERMANENT") {
    return [
      "영구 정지된 계정입니다.",
      "",
      "서비스 이용이 제한됩니다.",
    ].join("\n");
  }

  return fallbackMessage;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuthStore();

  const [member, setMember] = useState({
    email: "",
    password: "",
    rememberId: false,
    remember: false,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [sanctionModal, setSanctionModal] = useState({
    open: false,
    message: "",
  });
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(SAVED_EMAIL_KEY);

    if (!savedEmail) {
      return;
    }

    setMember((prev) => ({
      ...prev,
      email: savedEmail,
      rememberId: true,
    }));
  }, []);

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

  const inputMember = (e) => {
    const name = e.target.name;
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setMember({
      ...member,
      [name]: value,
    });

    setMessage("");
  };

  const fillTestLoginAccount = (accountType) => {
    const account = TEST_LOGIN_ACCOUNTS[accountType];

    if (!account) {
      return;
    }

    setMember((prev) => ({
      ...prev,
      email: account.email,
      password: account.password,
    }));
    setMessage("");
  };

  const handleLogin = (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!member.email.trim() || !member.password.trim()) {
      showToast(
        "error",
        "이메일과 비밀번호를 입력해주세요.",
      );
      return;
    }

    setIsLoading(true);

    axios
      .post(
        `${BACKSERVER}/auth/login`,
        {
          email: member.email,
          password: member.password,
          remember: member.remember,
        },
        {
          withCredentials: true,
        },
      )
      .then((res) => {
        if (member.rememberId) {
          window.localStorage.setItem(SAVED_EMAIL_KEY, member.email.trim());
        } else {
          window.localStorage.removeItem(SAVED_EMAIL_KEY);
        }

        const loginMember = res.data?.member || {};
        setAuthData(res.data.accessToken, loginMember, res.data.remember);
        setMember({
          email: member.rememberId ? member.email : "",
          password: "",
          rememberId: member.rememberId,
          remember: false,
        });

        if (ADMIN_ROLES.includes(loginMember.role)) {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/app/feed", { replace: true });
        }
      })
      .catch((err) => {
        const errorData = err?.response?.data;
        const loginErrorMessage = getApiMessage(err, "로그인 정보를 확인해주세요.");

        if (
          errorData?.code === "ACCOUNT_SUSPENDED" ||
          loginErrorMessage.includes("제재된 계정") ||
          loginErrorMessage.includes("정지된 계정") ||
          loginErrorMessage.includes("로그인할 수 없습니다")
        ) {
          setSanctionModal({
            open: true,
            message: buildSuspendedLoginMessage(errorData, loginErrorMessage),
          });
          return;
        }

        showToast("error", loginErrorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const showReadyMessage = (label) => {
    showToast("info", `${label}은 아직 준비 중입니다. 현재는 카카오, Google, 네이버 로그인을 이용해주세요.`);
  };

  const handleKakaoLogin = () => {
    try {
      startKakaoLogin(member.remember);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const handleGoogleLogin = () => {
    try {
      startGoogleLogin(member.remember);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const handleNaverLogin = () => {
    try {
      startNaverLogin(member.remember);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const goSignup = () => {
    navigate("/auth/signup");
  };

  const goRecovery = (mode) => {
    navigate(`/auth/recovery?mode=${mode}`);
  };

  return (
    <>
      <LoginView
        member={member}
        message={message}
        toast={toast}
        isLoading={isLoading}
        inputMember={inputMember}
        handleLogin={handleLogin}
        handleKakaoLogin={handleKakaoLogin}
        handleGoogleLogin={handleGoogleLogin}
        handleNaverLogin={handleNaverLogin}
        fillTestLoginAccount={fillTestLoginAccount}
        testLoginAccounts={TEST_LOGIN_ACCOUNTS}
        showReadyMessage={showReadyMessage}
        goRecovery={goRecovery}
        goSignup={goSignup}
      />

      <AuthConfirmModal
        open={sanctionModal.open}
        title={"로그인 제한 안내"}
        description={sanctionModal.message}
        confirmOnly
        confirmText={"확인"}
        onConfirm={() => setSanctionModal({ open: false, message: "" })}
      />
    </>
  );
};

export default LoginPage;
