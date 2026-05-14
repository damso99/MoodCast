import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { savedPosts } from '../../data/moodcastData';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import styles from './SavedPage.module.css';

function SavedList() {
  return (
    <div className={styles.grid}>
      {savedPosts.map((post) => (
        <article key={post.id} className={styles.card}>
          <span>{post.tag}</span>
          <h2>{post.title}</h2>
          <p>{post.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function SavedPage() {
  const desktop = useIsDesktop();

  if (!desktop) {
    return (
      <MobileShell title="저장된 게시물" hideSearch>
        <SavedList />
      </MobileShell>
    );
  }

  return (
    <DesktopShell>
      <section className={styles.desktopWrap}>
        <div className={styles.hero}>
          <strong>저장된 게시물</strong>
          <p>나중에 다시 보고 싶은 글과 이미지를 모아두는 공간입니다.</p>
        </div>
        <SavedList />
      </section>
    </DesktopShell>
  );
}
