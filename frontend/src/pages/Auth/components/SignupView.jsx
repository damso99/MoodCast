import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AuthToast from "./AuthToast";
import styles from "../SignupPage.module.css";

export const SignupView = ({
  step,
  signup,
  terms,
  emailAuth,
  phoneAuth,
  message,
  inputSignup,
  sendEmailAuthCode,
  checkEmailAuthCode,
  sendPhoneAuthCode,
  checkPhoneAuthCode,
  movePhoneStep,
  moveTermsStep,
  movePrevStep,
  toggleTerm,
  completeSignup,
  showReadyMessage,
  goLogin,
  toast,
  fieldMessage,
  fieldStatus,
  emailSendLoading,
  emailCooldown,
  emailExpireTime,
  termsList,
  selectedTerm,
  openTermContent,
  closeTermContent,
  phoneSendLoading,
  phoneCooldown,
  phoneExpireTime,
  termsLoading,
  signupSubmitting,
}) => {
  const phoneExpireMinute = Math.floor(phoneExpireTime / 60);
  const phoneExpireSecond = String(phoneExpireTime % 60).padStart(2, "0");
  const allTermsChecked = terms.service && terms.privacy && terms.marketing;
  const hasNickname = signup.nickname.trim().length > 0;
  const canMovePhoneStep =
    fieldStatus.name === "valid" &&
    (!hasNickname || fieldStatus.nickname === "valid") &&
    fieldStatus.email === "valid" &&
    emailAuth === 3 &&
    fieldStatus.password === "valid" &&
    fieldStatus.passwordConfirm === "valid";
  const canMoveTermsStep = phoneAuth === 3 && !termsLoading;
  const canCompleteSignup =
    terms.service &&
    terms.privacy &&
    termsList.length > 0 &&
    !termsLoading &&
    !signupSubmitting;
  const emailExpireMinute = Math.floor(emailExpireTime / 60);
  const emailExpireSecond = String(emailExpireTime % 60).padStart(2, "0");
  const getMessageClass = (status) => {
    if (status === "checking") {
      return styles.timerText;
    }

    return styles.invalidText;
  };

  return (
    <main className={styles.page}>
      <AuthToast toast={toast} />

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
          <h1>회원가입</h1>
          <p>MoodCast에서 당신의 감정을 공유하세요</p>
        </header>

        <section
          className={styles.progressGroup}
          aria-label="회원가입 진행 상황"
        >
          <ol className={styles.stepper} aria-label="회원가입 단계">
            <li
              className={`${styles.stepItem} ${
                step === 1 ? styles.stepActive : styles.stepDone
              }`}
            >
              <span className={styles.stepDot}>
                {step > 1 ? <CheckRoundedIcon fontSize="inherit" /> : 1}
              </span>
              <span className={styles.stepText}>기본 정보</span>
            </li>

            <li
              className={`${styles.stepItem} ${
                step === 2 ? styles.stepActive : step > 2 ? styles.stepDone : ""
              }`}
            >
              <span className={styles.stepDot}>
                {step > 2 ? <CheckRoundedIcon fontSize="inherit" /> : 2}
              </span>
              <span className={styles.stepText}>인증</span>
            </li>

            <li
              className={`${styles.stepItem} ${
                step === 3 ? styles.stepActive : ""
              }`}
            >
              <span className={styles.stepDot}>3</span>
              <span className={styles.stepText}>약관 동의</span>
            </li>
          </ol>
        </section>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <>
              <div className={styles.formFields}>
                <div className={styles.fieldPair}>
                  <div className={styles.field}>
                    <label htmlFor="signupName">
                      이름 <b>*</b>
                    </label>
                    <div className={styles.inputCheckWrap}>
                      <input
                        type="text"
                        id="signupName"
                        name="name"
                        value={signup.name}
                        onChange={inputSignup}
                        placeholder="실명을 입력하세요"
                      />
                      {fieldStatus.name === "valid" && (
                        <span className={styles.validIcon}>
                          <CheckRoundedIcon fontSize="inherit" />
                        </span>
                      )}
                    </div>
                    {fieldMessage.name && fieldStatus.name !== "valid" && (
                      <p className={getMessageClass(fieldStatus.name)}>
                        {fieldMessage.name}
                      </p>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="signupNickname">닉네임</label>
                    <div className={styles.inputCheckWrap}>
                      <input
                        type="text"
                        id="signupNickname"
                        name="nickname"
                        value={signup.nickname}
                        onChange={inputSignup}
                        placeholder="닉네임 입력"
                      />
                    </div>
                    {fieldMessage.nickname && (
                      <p
                        className={
                          fieldStatus.nickname === "valid"
                            ? styles.validText
                            : getMessageClass(fieldStatus.nickname)
                        }
                      >
                        {fieldMessage.nickname}
                      </p>
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="signupEmail">
                    이메일 <b>*</b>
                  </label>

                  <div className={styles.inputAction}>
                    <div className={styles.inputCheckWrap}>
                      <input
                        type="email"
                        id="signupEmail"
                        name="email"
                        value={signup.email}
                        onChange={inputSignup}
                        placeholder="이메일 주소를 입력하세요"
                        readOnly={emailSendLoading || emailAuth === 3}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={sendEmailAuthCode}
                      disabled={
                        emailSendLoading || emailCooldown > 0 || emailAuth === 3
                      }
                    >
                      {emailSendLoading
                        ? "발송 중..."
                        : emailAuth === 3
                          ? "인증완료"
                          : emailCooldown > 0
                            ? `${emailCooldown}초`
                            : emailAuth === 1
                              ? "재요청"
                              : "인증 요청"}
                    </button>
                  </div>
                  {fieldMessage.email && (
                    <p
                      className={
                        fieldStatus.email === "valid"
                          ? styles.validText
                          : getMessageClass(fieldStatus.email)
                      }
                    >
                      {fieldMessage.email}
                    </p>
                  )}
                </div>

                {emailAuth === 1 && (
                  <div className={styles.field}>
                    <label htmlFor="signupEmailCode">
                      이메일 인증번호 <b>*</b>
                    </label>

                    <div className={styles.inputAction}>
                      <input
                        type="text"
                        id="signupEmailCode"
                        name="emailCode"
                        value={signup.emailCode}
                        onChange={inputSignup}
                        placeholder="인증번호 입력"
                        readOnly={emailAuth === 3}
                      />

                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={checkEmailAuthCode}
                        disabled={emailAuth === 3}
                      >
                        확인
                      </button>
                    </div>

                    {emailAuth === 1 && (
                      <p
                        className={
                          emailExpireTime > 0
                            ? styles.timerText
                            : styles.invalidText
                        }
                      >
                        {emailExpireTime > 0
                          ? `남은 시간 ${emailExpireMinute}:${emailExpireSecond}`
                          : "인증번호가 만료되었습니다. 다시 요청해주세요."}
                      </p>
                    )}
                  </div>
                )}

                <div className={styles.fieldPair}>
                  <div className={styles.field}>
                    <label htmlFor="signupPassword">
                      비밀번호 <b>*</b>
                    </label>
                    <div className={styles.inputCheckWrap}>
                      <input
                        type="password"
                        id="signupPassword"
                        name="password"
                        value={signup.password}
                        onChange={inputSignup}
                        placeholder="8자 이상"
                      />
                    </div>
                    {fieldMessage.password && (
                      <p
                        className={
                          fieldStatus.password === "valid"
                            ? styles.validText
                            : getMessageClass(fieldStatus.password)
                        }
                      >
                        {fieldMessage.password}
                      </p>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="signupPasswordConfirm">
                      비밀번호 확인 <b>*</b>
                    </label>
                    <div className={styles.inputCheckWrap}>
                      <input
                        type="password"
                        id="signupPasswordConfirm"
                        name="passwordConfirm"
                        value={signup.passwordConfirm}
                        onChange={inputSignup}
                        placeholder="다시 입력"
                      />
                    </div>
                    {fieldMessage.passwordConfirm && (
                      <p
                        className={
                          fieldStatus.passwordConfirm === "valid"
                            ? styles.validText
                            : getMessageClass(fieldStatus.passwordConfirm)
                        }
                      >
                        {fieldMessage.passwordConfirm}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.bottomGroup}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={movePhoneStep}
                  disabled={!canMovePhoneStep}
                >
                  다음 단계
                </button>

                <div className={styles.socialArea}>
                  <div className={styles.divider}>
                    <span />
                    <em>또는 소셜로 간편가입</em>
                    <span />
                  </div>

                  <div className={styles.socialIconRow}>
                    <button
                      type="button"
                      className={`${styles.socialButton} ${styles.kakao}`}
                      onClick={() => showReadyMessage("카카오 간편가입")}
                      aria-label="카카오로 간편가입"
                    >
                      <ChatBubbleRoundedIcon fontSize="small" />
                    </button>

                    <button
                      type="button"
                      className={styles.socialButton}
                      onClick={() => showReadyMessage("Google 간편가입")}
                      aria-label="Google로 간편가입"
                    >
                      <span className={styles.googleMark}>G</span>
                    </button>

                    <button
                      type="button"
                      className={`${styles.socialButton} ${styles.naver}`}
                      onClick={() => showReadyMessage("네이버 간편가입")}
                      aria-label="네이버로 간편가입"
                    >
                      <b>N</b>
                    </button>
                  </div>
                </div>

                <p className={styles.switchText}>
                  이미 계정이 있으신가요?{" "}
                  <button type="button" onClick={goLogin}>
                    로그인
                  </button>
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.successNotice}>
                <CheckRoundedIcon fontSize="small" />
                <div>
                  <strong>이메일 인증 완료</strong>
                  <span>{signup.email}</span>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="signupPhone">
                  휴대폰 번호 <b>*</b>
                </label>

                <div className={styles.inputAction}>
                  <input
                    type="text"
                    id="signupPhone"
                    name="phone"
                    value={signup.phone}
                    onChange={inputSignup}
                    placeholder="'-' 없이 번호만 입력"
                    readOnly={phoneAuth === 3}
                  />

                  <button
                    type="button"
                    className={styles.ghostButton}
                    onClick={sendPhoneAuthCode}
                    disabled={
                      phoneSendLoading || phoneCooldown > 0 || phoneAuth === 3
                    }
                  >
                    {phoneSendLoading
                      ? "발송 중..."
                      : phoneAuth === 3
                        ? "인증완료"
                        : phoneCooldown > 0
                          ? `${phoneCooldown}초`
                          : phoneAuth === 1
                            ? "재요청"
                    : "인증번호 발송"}
                  </button>
                </div>
              </div>

              {phoneAuth === 1 && (
                <div className={styles.field}>
                  <label htmlFor="signupPhoneCode">
                    휴대폰 인증번호 <b>*</b>
                  </label>

                  <div className={styles.inputAction}>
                    <input
                      type="text"
                      id="signupPhoneCode"
                      name="phoneCode"
                      value={signup.phoneCode}
                      onChange={inputSignup}
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

                  <p
                    className={
                      phoneExpireTime > 0
                        ? styles.timerText
                        : styles.invalidText
                    }
                  >
                    {phoneExpireTime > 0
                      ? `남은 시간 ${phoneExpireMinute}:${phoneExpireSecond}`
                      : "인증번호가 만료되었습니다. 다시 요청해주세요."}
                  </p>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.outlineButton}
                  onClick={movePrevStep}
                >
                  이전
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={moveTermsStep}
                  disabled={!canMoveTermsStep}
                >
                  {termsLoading ? "약관 불러오는 중..." : "다음 단계"}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.badgeRow}>
                <span>
                  <CheckRoundedIcon fontSize="small" />
                  이메일 인증 완료
                </span>
                <span>
                  <CheckRoundedIcon fontSize="small" />
                  휴대폰 인증 완료
                </span>
              </div>

              <section className={styles.termsBox} aria-label="약관 동의">
                <label className={styles.termAll}>
                  <input
                    type="checkbox"
                    name="all"
                    checked={allTermsChecked}
                    onChange={toggleTerm}
                  />
                  <span>전체 동의</span>
                </label>

                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="service"
                    checked={terms.service}
                    onChange={toggleTerm}
                  />
                  <span>[필수] 이용약관 동의</span>
                  <button
                    type="button"
                    onClick={() => openTermContent("SERVICE")}
                    disabled={termsLoading || termsList.length === 0}
                  >
                    내용 보기
                    <ChevronRightRoundedIcon fontSize="small" />
                  </button>
                </label>

                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="privacy"
                    checked={terms.privacy}
                    onChange={toggleTerm}
                  />
                  <span>[필수] 개인정보 수집 및 이용 동의</span>
                  <button
                    type="button"
                    onClick={() => openTermContent("PRIVACY")}
                    disabled={termsLoading || termsList.length === 0}
                  >
                    내용 보기
                    <ChevronRightRoundedIcon fontSize="small" />
                  </button>
                </label>

                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="marketing"
                    checked={terms.marketing}
                    onChange={toggleTerm}
                  />
                  <span>[선택] 마케팅 정보 수신 동의</span>
                  <button
                    type="button"
                    onClick={() => openTermContent("MARKETING")}
                    disabled={termsLoading || termsList.length === 0}
                  >
                    내용 보기
                    <ChevronRightRoundedIcon fontSize="small" />
                  </button>
                </label>
              </section>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.outlineButton}
                  onClick={movePrevStep}
                >
                  이전
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={completeSignup}
                  disabled={!canCompleteSignup}
                >
                  {signupSubmitting ? "가입 중..." : "가입 완료"}
                </button>
              </div>
              {selectedTerm && (
                <div className={styles.termsModal} role="presentation">
                  <div
                    className={styles.termsModalBox}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="termsModalTitle"
                  >
                    <div className={styles.termsModalHeader}>
                      <div>
                        <span className={styles.termsRequiredBadge}>
                          {selectedTerm.isRequired === 1 ? "필수" : "선택"}
                        </span>
                        <h2 id="termsModalTitle">{selectedTerm.title}</h2>
                        <p>
                          {selectedTerm.termsType} · v{selectedTerm.version}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.termsCloseButton}
                        onClick={closeTermContent}
                        aria-label="약관 내용 닫기"
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </button>
                    </div>

                    <div className={styles.termsModalContent}>
                      {selectedTerm.content}
                    </div>

                    <div className={styles.termsModalFooter}>
                      <button type="button" onClick={closeTermContent}>
                        확인했습니다
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {message ? <p className={styles.helperText}>{message}</p> : null}
        </form>
      </section>
    </main>
  );
};
