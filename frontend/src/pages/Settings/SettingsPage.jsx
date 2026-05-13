import { DesktopShell } from '../../layouts/DesktopShell/DesktopShell';
import { MobileShell } from '../../layouts/MobileShell/MobileShell';
import { useIsDesktop } from '../../app/hooks/useViewportWidth';
import styles from './SettingsPage.module.css';

const sections = ['계정', '알림', '보안'];

export function SettingsPage() {
  const desktop = useIsDesktop();

  const content = (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <strong>설정</strong>
        <p>계정, 알림, 보안 관련 옵션을 한곳에서 관리할 수 있습니다.</p>
      </div>
      <div className={styles.grid}>
        {sections.map((title) => (
          <article key={title} className={styles.card}>
            <h2>{title}</h2>
            <button type="button">세부 설정</button>
          </article>
        ))}
      </div>
    </section>
  );

  if (!desktop) return <MobileShell title="설정" hideSearch>{content}</MobileShell>;
  return <DesktopShell>{content}</DesktopShell>;
}
