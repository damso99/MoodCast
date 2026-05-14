import { DesktopShell } from '../../components/layout/DesktopShell';
import { MobileShell } from '../../components/layout/MobileShell';
import { useIsDesktop } from '../../hooks/useViewportWidth';
import styles from './CreatePostPage.module.css';

export function CreatePostPage() {
  const desktop = useIsDesktop();

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>새 게시물 작성</strong>
        <p>감정, 사진, 분위기를 함께 담아 게시물을 만들 수 있습니다.</p>
      </div>
      <div className={styles.card}>
        <p>지금 어떤 기분인가요?</p>
        <input placeholder="무슨 생각을 하고 계신가요?" />
        <textarea placeholder="오늘의 감정과 생각을 적어보세요." />
        <button type="button">게시하기</button>
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="새 게시물 작성" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
