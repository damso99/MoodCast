import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SignupView } from "./components/SignupView";
import axios from "axios";

const defaultSignup = {
  name: "",
  nickname: "",
  email: "",
  emailCode: "",
  password: "",
  passwordConfirm: "",
  phone: "",
  phoneCode: "",
};

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

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const SignupPage = () => {
  const navigate = useNavigate();

  // 이 파일은 세미프로젝트 Page 파일처럼 데이터와 이벤트만 담당합니다.
  const [step, setStep] = useState(1);
  const [signup, setSignup] = useState(defaultSignup);

  // 0: 인증 전, 1: 인증번호 발송 완료, 3: 인증 완료
  const [emailAuth, setEmailAuth] = useState(0);
  const [phoneAuth, setPhoneAuth] = useState(0);

  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });

  const [message, setMessage] = useState("");

  const inputSignup = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setSignup({
      ...signup,
      [name]: value,
    });

    if (name === "email") {
      setEmailAuth(0);
    }

    if (name === "phone") {
      setPhoneAuth(0);
    }

    setMessage("");
  };

  const sendEmailAuthCode = () => {
    if (!signup.email.trim()) {
      setMessage("이메일을 입력해주세요.");
      return;
    }

    if (!emailRegex.test(signup.email.trim())) {
      setMessage("이메일 형식이 올바르지 않습니다.");
      return;
    }

    // 백엔드 연결 시 axios.post(`${BACKSERVER}/api/auth/email/send`, { email: signup.email }) 자리입니다.
    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/email/send`, {
        email: signup.email,
      })
      .then((res) => {
        console.log(res);
        setEmailAuth(1);
        setMessage(res.data.message);
      })
      .catch((err) => {
        console.log(err);
        setEmailAuth(0);
        setMessage(
          err.response?.data?.message ||
            "이메일 인증 요청 중 오류가 발생했습니다.",
        );
      });
  };

  const checkEmailAuthCode = () => {
    if (emailAuth !== 1) {
      setMessage("먼저 이메일 인증번호를 요청해주세요.");
      return;
    }

    if (!signup.emailCode.trim()) {
      setMessage("이메일 인증번호를 입력해주세요.");
      return;
    }

    // 백엔드 연결 시 axios.post(`${BACKSERVER}/api/auth/email/verify`, { email, code }) 자리입니다.
    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/email/verify`, {
        email: signup.email,
        authCode: signup.emailCode,
      })
      .then((res) => {
        console.log(res);
        setEmailAuth(3);
        setMessage(res.data.message);
      })
      .catch((err) => {
        console.log(err);
        setEmailAuth(1);
        setMessage(
          err.response?.data?.message ||
            "이메일 인증 확인 중 오류가 발생했습니다.",
        );
      });
  };

  const movePhoneStep = () => {
    if (!signup.name.trim()) {
      setMessage("이름을 입력해주세요.");
      return;
    }

    if (!signup.email.trim()) {
      setMessage("이메일을 입력해주세요.");
      return;
    }

    if (emailAuth !== 3) {
      setMessage("이메일 인증을 완료해주세요.");
      return;
    }

    if (!signup.password.trim() || !signup.passwordConfirm.trim()) {
      setMessage("비밀번호를 입력해주세요.");
      return;
    }

    if (signup.password !== signup.passwordConfirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setStep(2);
    setMessage("");
  };

  const sendPhoneAuthCode = () => {
    if (!signup.phone.trim()) {
      setMessage("휴대폰 번호를 입력해주세요.");
      return;
    }

    // 백엔드 연결 시 axios.post(`${BACKSERVER}/api/auth/phone/send`, { phone: signup.phone }) 자리입니다.
    setPhoneAuth(1);
    setMessage("휴대폰 인증번호를 발송한 상태로 처리했습니다.");
  };

  const checkPhoneAuthCode = () => {
    if (phoneAuth !== 1) {
      setMessage("먼저 휴대폰 인증번호를 요청해주세요.");
      return;
    }

    if (!signup.phoneCode.trim()) {
      setMessage("휴대폰 인증번호를 입력해주세요.");
      return;
    }

    // 백엔드 연결 시 axios.post(`${BACKSERVER}/api/auth/phone/verify`, { phone, code }) 자리입니다.
    setPhoneAuth(3);
    setMessage("휴대폰 인증이 완료된 상태로 처리했습니다.");
  };

  const moveTermsStep = () => {
    if (phoneAuth !== 3) {
      setMessage("휴대폰 인증을 완료해주세요.");
      return;
    }

    setStep(3);
    setMessage("");
  };

  const toggleTerm = (e) => {
    const name = e.target.name;
    const checked = e.target.checked;

    if (name === "all") {
      setTerms({
        service: checked,
        privacy: checked,
        marketing: checked,
      });
      return;
    }

    setTerms({
      ...terms,
      [name]: checked,
    });
  };

  const completeSignup = () => {
    if (!terms.service || !terms.privacy) {
      setMessage("필수 약관에 동의해주세요.");
      return;
    }

    // 최종 백엔드 연결 시 members insert가 아니라 회원가입 API 호출 자리입니다.
    setMessage(
      "프론트 회원가입 흐름 확인 완료. 이제 백엔드 API를 붙이면 됩니다.",
    );
  };

  const showReadyMessage = (label) => {
    setMessage(`${label}은 백엔드 연결 후 사용할 수 있습니다.`);
  };

  return (
    <SignupView
      step={step}
      signup={signup}
      terms={terms}
      emailAuth={emailAuth}
      phoneAuth={phoneAuth}
      message={message}
      inputSignup={inputSignup}
      sendEmailAuthCode={sendEmailAuthCode}
      checkEmailAuthCode={checkEmailAuthCode}
      sendPhoneAuthCode={sendPhoneAuthCode}
      checkPhoneAuthCode={checkPhoneAuthCode}
      movePhoneStep={movePhoneStep}
      moveTermsStep={moveTermsStep}
      movePrevStep={() => setStep(step - 1)}
      toggleTerm={toggleTerm}
      completeSignup={completeSignup}
      showReadyMessage={showReadyMessage}
      goLogin={() => navigate("/auth/login")}
      toast={toast}
    />
  );
};

export default SignupPage;
