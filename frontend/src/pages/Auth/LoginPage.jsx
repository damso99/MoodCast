import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../../hooks/useAuthState";
import { LoginView } from "./components/LoginView";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuthState();

  const [member, setMember] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    type: "",
    message: "",
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

    console.log("로그인 요청 데이터:", member);

    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoading(false);
      setMember({
        email: "",
        password: "",
        remember: false,
      });
      showToast("success", "로그인되었습니다.");
      navigate("/app/feed");
    }, 300);
  };

  const showReadyMessage = (label) => {
    showToast("info", `${label}은 백엔드 연결 후 사용할 수 있습니다.`);
  };

  const goSignup = () => {
    navigate("/auth/signup");
  };

  return (
    <LoginView
      member={member}
      message={message}
      toast={toast}
      isLoading={isLoading}
      inputMember={inputMember}
      handleLogin={handleLogin}
      showReadyMessage={showReadyMessage}
      goSignup={goSignup}
    />
  );
};

export default LoginPage;
