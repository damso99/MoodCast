import { DesktopShell } from '../../components/layout/DesktopShell';
import { FeedCard } from '../../components/common/FeedCard';
import { feedPosts, profileHighlights, profileStats } from '../../data/moodcastData';
import styles from './ProfileDesktopPage.module.css';
import { useNavigate } from 'react-router-dom';

export function ProfileDesktopPage() {
  const navigate = useNavigate();

  return (
    <DesktopShell>
      <section className={styles.wrap}>
        <article className={styles.hero}>
          <div className={styles.avatar}>L</div>
          <div>
            <strong>Lena Parks</strong>
            <p>감성 기록과 커뮤니티 참여를 즐기는 MoodCast 프로필입니다.</p>
          </div>
          <button type="button" onClick={() => navigate('/app/write')}>
            새 게시물 작성
          </button>
        </article>

        <div className={styles.stats}>
          {profileStats.map((item) => (
            <div key={item.label} className={styles.stat}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
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
