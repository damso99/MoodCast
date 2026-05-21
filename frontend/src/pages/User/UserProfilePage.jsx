import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import { useParams } from 'react-router-dom';
import { followers, following } from '../../data/moodcastData';
import styles from './UserProfilePage.module.css';

export function UserProfilePage() {
  const desktop = useIsDesktop();
  const { handle } = useParams();
  const userHandle = `@${handle}`;
  const user = [...followers, ...following].find((item) => item.handle === userHandle);

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.avatar}>{user?.avatar ?? '?'}</div>
        <div>
          <strong>{user?.name ?? '알 수 없는 사용자'}</strong>
          <span>{user?.handle ?? ''}</span>
          <p>{user ? '함께 MoodCast를 즐기는 사용자입니다.' : '존재하지 않는 사용자입니다.'}</p>
        </div>
      </div>
      {user ? (
        <div className={styles.stats}>
          <article>
            <strong>18</strong>
            <span>게시물</span>
          </article>
          <article>
            <strong>254</strong>
            <span>팔로워</span>
          </article>
          <article>
            <strong>98</strong>
            <span>팔로잉</span>
          </article>
        </div>
      ) : null}
    </section>
  );

  if (!desktop) return <MobileShell title="사용자 프로필" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
