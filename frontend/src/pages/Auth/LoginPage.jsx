import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../stores/useAuthStore";
import { LoginView } from "./components/LoginView";
import { getApiMessage, getToastDuration } from "./authFeedback";
import { startKakaoLogin } from "./socialAuth";

const SAVED_EMAIL_KEY = "moodcast-saved-email";
const ADMIN_ROLES = ["ADMIN", "NORMAL_ADMIN", "SUPER_ADMIN"];

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

  const handleLogin = (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!member.email.trim() || !member.password.trim()) {
      showToast("error", "이메일과 비밀번호를 입력해주세요.");
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
        console.log(res.data);

        if (member.rememberId) {
          window.localStorage.setItem(SAVED_EMAIL_KEY, member.email.trim());
        } else {
          window.localStorage.removeItem(SAVED_EMAIL_KEY);
        }

        const loginMember = res.data?.member || {};
        setAuthData(res.data.accessToken, loginMember);
        setMember({
          email: member.rememberId ? member.email : "",
          password: "",
          rememberId: member.rememberId,
          remember: false,
        });

        if (ADMIN_ROLES.includes(loginMember.role)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/app/feed");
        }
      })
      .catch((err) => {
        console.log(err);
        showToast(
          "error",
          getApiMessage(err, "로그인 정보를 확인해주세요."),
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const showReadyMessage = (label) => {
    showToast("info", `${label}은 아직 준비 중입니다. 현재는 카카오 로그인을 이용해주세요.`);
  };

  const handleKakaoLogin = () => {
    try {
      startKakaoLogin();
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
    <LoginView
      member={member}
      message={message}
      toast={toast}
      isLoading={isLoading}
      inputMember={inputMember}
      handleLogin={handleLogin}
      handleKakaoLogin={handleKakaoLogin}
      showReadyMessage={showReadyMessage}
      goRecovery={goRecovery}
      goSignup={goSignup}
    />
  );
};

export default LoginPage;
