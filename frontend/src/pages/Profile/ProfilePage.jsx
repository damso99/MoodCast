import { MobileShell } from '../../components/layout/MobileShell';
import { profileHighlights, profileStats } from '../../data/moodcastData';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  return (
    <MobileShell title="프로필" hideSearch>
      <section className={styles.hero}>
        <div className={styles.avatar}>L</div>
        <p>MOODCAST PROFILE</p>
        <h1>Lena_Parks</h1>
        <span>감정을 기록하고 커뮤니티에 참여하는 라이프로그 스타일의 프로필입니다.</span>
      </section>

      <section className={styles.stats}>
        {profileStats.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
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
