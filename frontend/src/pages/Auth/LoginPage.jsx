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

  const handleLogin = (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!member.email.trim() || !member.password.trim()) {
      showToast(
        "error",
        "\uC774\uBA54\uC77C\uACFC \uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.",
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
        const loginErrorMessage = getApiMessage(
          err,
          "\uB85C\uADF8\uC778 \uC815\uBCF4\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.",
        );

        if (
          loginErrorMessage.includes("\uC81C\uC7AC\uB41C \uACC4\uC815") ||
          loginErrorMessage.includes(
            "\uB85C\uADF8\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4",
          )
        ) {
          setSanctionModal({
            open: true,
            message: loginErrorMessage,
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
    showToast(
      "info",
      `${label}\uC740 \uC544\uC9C1 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4. \uD604\uC7AC\uB294 \uCE74\uCE74\uC624 \uB610\uB294 Google \uB85C\uADF8\uC778\uC744 \uC774\uC6A9\uD574\uC8FC\uC138\uC694.`,
    );
  };

  const handleKakaoLogin = () => {
    try {
      startKakaoLogin();
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const handleGoogleLogin = () => {
    try {
      startGoogleLogin();
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const handleNaverLogin = () => {
    try {
      startNaverLogin();
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
        showReadyMessage={showReadyMessage}
        goRecovery={goRecovery}
        goSignup={goSignup}
      />

      <AuthConfirmModal
        open={sanctionModal.open}
        title={"\uB85C\uADF8\uC778 \uC81C\uD55C \uC548\uB0B4"}
        description={sanctionModal.message}
        confirmOnly
        confirmText={"\uD655\uC778"}
        onConfirm={() => setSanctionModal({ open: false, message: "" })}
      />
    </>
  );
};

export default LoginPage;
