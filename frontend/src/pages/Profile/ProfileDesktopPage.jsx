import { DesktopShell } from '../../components/layout/DesktopShell';
import { FeedCard } from '../../components/common/FeedCard';
import { feedPosts, profileHighlights, profileStats } from '../../data/moodcastData';
import styles from './ProfileDesktopPage.module.css';
import { useNavigate } from 'react-router-dom';

export function ProfileDesktopPage() {
  const navigate = useNavigate();

  const handleStatClick = (label) => {
    if (label === '저장됨') navigate('/app/saved');
    if (label === '팔로워') navigate('/app/followers');
    if (label === '팔로잉') navigate('/app/following');
  };

  return (
    <DesktopShell>
      <section className={styles.wrap}>
        <article className={styles.hero}>
          <div className={styles.avatar}>L</div>
          <div>
            <strong>Lena Parks</strong>
            <p>감성 기록과 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.</p>
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
