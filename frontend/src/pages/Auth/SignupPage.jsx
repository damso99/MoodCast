import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SignupView } from "./components/SignupView";

const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const SignupPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [signup, setSignup] = useState({
    name: "",
    nickname: "",
    email: "",
    emailCode: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    phoneCode: "",
  });

  const [fieldMessage, setFieldMessage] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [fieldStatus, setFieldStatus] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });

  const [terms, setTerms] = useState({
    service: false,
    privacy: false,
    marketing: false,
  });

  // 0: 인증 전, 1: 인증번호 발송 완료, 3: 인증 완료
  const [emailAuth, setEmailAuth] = useState(0);
  const [phoneAuth, setPhoneAuth] = useState(0);

  const [emailSendLoading, setEmailSendLoading] = useState(false);

  const [message, setMessage] = useState("");
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

  useEffect(() => {
    const email = signup.email.trim().toLowerCase();

    if (!email) {
      setFieldMessage((prev) => ({
        ...prev,
        email: "",
      }));

      setFieldStatus((prev) => ({
        ...prev,
        email: "",
      }));

      return;
    }

    if (!emailRegex.test(email)) {
      setFieldMessage((prev) => ({
        ...prev,
        email: "이메일 형식이 올바르지 않습니다.",
      }));

      setFieldStatus((prev) => ({
        ...prev,
        email: "invalid",
      }));

      return;
    }

    setFieldMessage((prev) => ({
      ...prev,
      email: "이메일 중복 확인 중입니다.",
    }));

    setFieldStatus((prev) => ({
      ...prev,
      email: "checking",
    }));

    const timer = setTimeout(() => {
      axios
        .get(`${import.meta.env.VITE_BACKSERVER}/signup/check/email`, {
          params: {
            email: email,
          },
        })
        .then((res) => {
          if (res.data.available) {
            setFieldMessage((prev) => ({
              ...prev,
              email: "사용 가능한 이메일입니다.",
            }));

            setFieldStatus((prev) => ({
              ...prev,
              email: "valid",
            }));
          } else {
            setFieldMessage((prev) => ({
              ...prev,
              email: "이미 사용 중인 이메일입니다.",
            }));

            setFieldStatus((prev) => ({
              ...prev,
              email: "invalid",
            }));
          }
        })
        .catch((err) => {
          console.log(err);

          setFieldMessage((prev) => ({
            ...prev,
            email:
              err.response?.data?.message ||
              "이메일 확인 중 오류가 발생했습니다.",
          }));

          setFieldStatus((prev) => ({
            ...prev,
            email: "invalid",
          }));
        });
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [signup.email]);

  const sendEmailAuthCode = () => {
    const email = signup.email.trim().toLowerCase();

    if (!email) {
      showToast("error", "이메일을 입력해주세요.");
      return;
    }

    if (fieldStatus.email !== "valid") {
      showToast("error", "사용 가능한 이메일을 입력해주세요.");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/email/send`, {
        email: email,
      })
      .then((res) => {
        console.log(res);
        setEmailAuth(1);
        showToast("success", res.data.message);
      })
      .catch((err) => {
        console.log(err);
        setEmailAuth(0);
        showToast(
          "error",
          err.response?.data?.message ||
            "이메일 인증 요청 중 오류가 발생했습니다.",
        );
      });
  };

  const checkEmailAuthCode = () => {
    if (emailAuth !== 1) {
      showToast("error", "먼저 이메일 인증번호를 요청해주세요.");
      return;
    }

    if (!signup.emailCode.trim()) {
      showToast("error", "이메일 인증번호를 입력해주세요.");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/email/verify`, {
        email: signup.email,
        authCode: signup.emailCode,
      })
      .then((res) => {
        console.log(res);
        setEmailAuth(3);
        showToast("success", res.data.message);
      })
      .catch((err) => {
        console.log(err);
        setEmailAuth(1);
        showToast(
          "error",
          err.response?.data?.message ||
            "이메일 인증 확인 중 오류가 발생했습니다.",
        );
      });
  };

  const movePhoneStep = () => {
    if (!signup.name.trim()) {
      showToast("error", "이름을 입력해주세요.");
      return;
    }

    if (!signup.email.trim()) {
      showToast("error", "이메일을 입력해주세요.");
      return;
    }

    if (emailAuth !== 3) {
      showToast("error", "이메일 인증을 완료해주세요.");
      return;
    }

    if (!signup.password.trim() || !signup.passwordConfirm.trim()) {
      showToast("error", "비밀번호를 입력해주세요.");
      return;
    }

    if (signup.password !== signup.passwordConfirm) {
      showToast("error", "비밀번호가 일치하지 않습니다.");
      return;
    }

    setStep(2);
    setMessage("");
  };

  const sendPhoneAuthCode = () => {
    // 프론트 1차 빈값 체크
    if (!signup.phone.trim()) {
      showToast("error", "휴대폰 번호를 입력해주세요.");
      return;
    }
    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/phone/send`, {
        phone: signup.phone,
      })
      .then((res) => {
        console.log(res.data);
        setPhoneAuth(1);
        showToast("success", res.data.message);
      })
      .catch((err) => {
        console.log(err);
        setPhoneAuth(0);
        showToast(
          "error",
          err.response?.data?.message ||
            "인증번호 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요",
        );
      });
  };

  const checkPhoneAuthCode = () => {
    if (phoneAuth !== 1) {
      showToast("error", "먼저 휴대폰 인증번호를 요청해주세요.");
      return;
    }

    if (!signup.phoneCode.trim()) {
      showToast("error", "휴대폰 인증번호를 입력해주세요.");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKSERVER}/signup/auth/phone/verify`, {
        phone: signup.phone,
        authCode: signup.phoneCode,
      })
      .then((res) => {
        console.log(res);
        setPhoneAuth(3);
        showToast("success", res?.data?.message);
      })
      .catch((err) => {
        setPhoneAuth(1);
        showToast(
          "error",
          err.response?.data?.message || "인증 오류가 발생했습니다.",
        );
      });
  };

  const moveTermsStep = () => {
    if (phoneAuth !== 3) {
      showToast("error", "휴대폰 인증을 완료해주세요.");
      return;
    }

    setStep(3);
    setMessage("");
  };

  const movePrevStep = () => {
    setStep(step - 1);
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
      showToast("error", "필수 약관에 동의해주세요.");
      return;
    }

    showToast(
      "success",
      "프론트 회원가입 흐름 확인 완료. 이제 백엔드 API를 붙이면 됩니다.",
    );
  };

  const showReadyMessage = (label) => {
    showToast("info", `${label}은 백엔드 연결 후 사용할 수 있습니다.`);
  };

  const goLogin = () => {
    navigate("/auth/login");
  };

  return (
    <SignupView
      step={step}
      signup={signup}
      terms={terms}
      emailAuth={emailAuth}
      phoneAuth={phoneAuth}
      message={message}
      toast={toast}
      inputSignup={inputSignup}
      sendEmailAuthCode={sendEmailAuthCode}
      checkEmailAuthCode={checkEmailAuthCode}
      sendPhoneAuthCode={sendPhoneAuthCode}
      checkPhoneAuthCode={checkPhoneAuthCode}
      movePhoneStep={movePhoneStep}
      moveTermsStep={moveTermsStep}
      movePrevStep={movePrevStep}
      toggleTerm={toggleTerm}
      completeSignup={completeSignup}
      showReadyMessage={showReadyMessage}
      goLogin={goLogin}
      fieldMessage={fieldMessage}
      fieldStatus={fieldStatus}
    />
  );
};

export default SignupPage;
