import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../../hooks/useAuthState";
import { LoginView } from "./components/LoginView";

const defaultMember = {
  email: "",
  password: "",
  remember: false,
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuthState();

  // map-C 세미프로젝트 LoginPage처럼 이 파일은 데이터와 이벤트만 담당합니다.
  const [member, setMember] = useState(defaultMember);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

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
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    console.log("로그인 요청 데이터:", member);
    console.log("서버 주소:", BACKSERVER);

    // 백엔드 연결 전 임시 성공 처리입니다.
    // 실제 연결 시 이 부분을 axios.post(`${BACKSERVER}/api/member/login`, member)로 바꾸면 됩니다.
    setTimeout(() => {
      setIsLoggedIn(true);
      setIsLoading(false);
      setMember(defaultMember);
      navigate("/app/feed");
    }, 300);
  };

  const showReadyMessage = (label) => {
    setMessage(`${label}은 백엔드 연결 후 사용할 수 있습니다.`);
  };

  return (
    <LoginView
      member={member}
      message={message}
      isLoading={isLoading}
      inputMember={inputMember}
      handleLogin={handleLogin}
      showReadyMessage={showReadyMessage}
      goSignup={() => navigate("/auth/signup")}
    />
  );
};

export default LoginPage;
