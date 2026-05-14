import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuthState';
import { Logo } from '../../components/common/Logo';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useAuthState();

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/app/feed');
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Logo compact />
        <h1>MoodCast</h1>
        <p>감정을 기록하고, 저장하고, 공유하는 감성 SNS</p>
        <button type="button" className={styles.primary} onClick={handleLogin}>
          로그인
        </button>
        <button type="button" className={styles.secondary} onClick={handleLogin}>
          비회원으로 시작
        </button>
      </section>
    </main>
  );
}
