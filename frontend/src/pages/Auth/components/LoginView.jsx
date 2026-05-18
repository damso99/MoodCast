import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import styles from "../LoginPage.module.css";

export const LoginView = ({
  member,
  message,
  isLoading,
  inputMember,
  handleLogin,
  showReadyMessage,
  goSignup,
}) => {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <img src="/MoodCast-logo.svg" alt="" aria-hidden="true" />
            <strong>MoodCast</strong>
          </div>
          <h1>로그인</h1>
          <p>MoodCast에 오신 것을 환영합니다</p>
        </header>

        <form className={styles.form} onSubmit={handleLogin}>
          <label className={styles.field}>
            <span>
              이메일 <b>*</b>
            </span>
            <input
              type="email"
              name="email"
              id="email"
              value={member.email}
              onChange={inputMember}
              placeholder="이메일 주소를 입력하세요"
            />
          </label>

          <label className={styles.field}>
            <span>
              비밀번호 <b>*</b>
            </span>
            <input
              type="password"
              name="password"
              id="password"
              value={member.password}
              onChange={inputMember}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin(e);
                }
              }}
              placeholder="비밀번호를 입력하세요"
            />
          </label>

          <div className={styles.options}>
            <label className={styles.remember}>
              <input
                type="checkbox"
                name="remember"
                checked={member.remember}
                onChange={inputMember}
              />
              <span>로그인 상태 유지</span>
            </label>

            <div className={styles.findLinks}>
              <button
                type="button"
                onClick={() => showReadyMessage("아이디 찾기")}
              >
                아이디 찾기
              </button>
              <i />
              <button
                type="button"
                onClick={() => showReadyMessage("비밀번호 찾기")}
              >
                비밀번호 찾기
              </button>
            </div>
          </div>

          {message ? <p className={styles.message}>{message}</p> : null}

          <button type="submit" className={styles.primary} disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className={styles.socialArea}>
          <div className={styles.divider}>
            <span />
            <em>또는 소셜 계정으로 로그인</em>
            <span />
          </div>

          <button
            type="button"
            className={`${styles.socialButton} ${styles.kakao}`}
            onClick={() => showReadyMessage("카카오 로그인")}
          >
            <ChatBubbleRoundedIcon fontSize="small" />
            카카오로 로그인
          </button>
          <button
            type="button"
            className={`${styles.socialButton} ${styles.naver}`}
            onClick={() => showReadyMessage("네이버 로그인")}
          >
            <b>N</b>
            네이버로 로그인
          </button>
          <button
            type="button"
            className={styles.socialButton}
            onClick={() => showReadyMessage("Google 로그인")}
          >
            <span className={styles.googleMark}>G</span>
            Google로 로그인
          </button>
        </div>

        <p className={styles.signupText}>
          아직 회원이 아니신가요?{" "}
          <button type="button" onClick={goSignup}>
            회원가입
          </button>
        </p>
      </section>
    </main>
  );
};
