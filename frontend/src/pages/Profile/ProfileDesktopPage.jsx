import { DesktopShell } from '../../components/layout/DesktopShell';
import { FeedCard } from '../../components/common/FeedCard';
import { feedPosts, profileHighlights, profileStats } from '../../data/moodcastData';
import styles from './ProfileDesktopPage.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuthState';

export function ProfileDesktopPage() {
  const navigate = useNavigate();
  const { member } = useAuthState();

  const displayName = member?.nickname || member?.name || 'MoodCast';
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayText = member
    ? '감성을 기록하고 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.'
    : '로그인 후 프로필 정보를 확인할 수 있습니다.';

  const handleStatClick = (label) => {
    if (label === '저장됨') navigate('/app/saved');
    if (label === '팔로워') navigate('/app/followers');
    if (label === '팔로잉') navigate('/app/following');
  };

  return (
    <DesktopShell>
      <section className={styles.wrap}>
        <article className={styles.hero}>
          <div className={styles.avatar}>{displayInitial}</div>
          <div>
            <strong>{displayName}</strong>
            <p>{displayText}</p>
          </div>
          <button type="button" onClick={() => navigate('/app/profile/edit')}>
            프로필 편집
          </button>
        </article>

        <div className={styles.stats}>
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
        </div>

        <section className={styles.highlights}>
          {profileHighlights.map((item) => (
            <div key={item.label} className={styles.highlight}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </section>

        <section className={styles.recent}>
          <div className={styles.sectionHeader}>
            <h2>최근 게시물</h2>
            <button type="button" onClick={() => navigate('/app/write')}>
              + 새 게시물
            </button>
          </div>
          {feedPosts.map((post) => (
            <FeedCard key={post.id} post={post} compact />
          ))}
        </section>
      </section>
    </DesktopShell>
  );
}
