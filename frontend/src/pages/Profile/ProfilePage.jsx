import { MobileShell } from '../../components/layout/MobileShell';
import { profileHighlights, profileStats } from '../../data/moodcastData';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuthState';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const { member } = useAuthState();

  const displayName = member?.nickname || member?.name || 'MoodCast';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayText = member
    ? '감정을 기록하고 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.'
    : '로그인 후 프로필 정보를 확인할 수 있습니다.';

  const handleStatClick = (label) => {
    if (label === '저장됨') navigate('/app/saved');
    if (label === '팔로워') navigate('/app/followers');
    if (label === '팔로잉') navigate('/app/following');
  };

  return (
    <MobileShell title="프로필" hideSearch>
      <section className={styles.hero}>
        <div className={styles.avatar}>{displayInitial}</div>
        <p>MOODCAST PROFILE</p>
        <h1>{displayName}</h1>
        <span>{displayText}</span>
      </section>

      <section className={styles.stats}>
        {profileStats.map((item) => {
          const isClickable = ['저장됨', '팔로워', '팔로잉'].includes(item.label);
          if (!isClickable) {
            return (
              <div key={item.label} className={styles.stat}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              className={styles.stat}
              onClick={() => handleStatClick(item.label)}
              aria-label={`${item.label} 보기`}
            >
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </button>
          );
        })}
      </section>

      <div className={styles.pill}>
        <strong>{profileHighlights[0].label}</strong>
        <span>{profileHighlights[0].value}</span>
      </div>
      <div className={styles.pill}>
        <strong>{profileHighlights[1].label}</strong>
        <span>{profileHighlights[1].value}</span>
      </div>
      <div className={styles.pill}>
        <strong>{profileHighlights[2].label}</strong>
        <span>{profileHighlights[2].value}</span>
      </div>
    </MobileShell>
  );
}
