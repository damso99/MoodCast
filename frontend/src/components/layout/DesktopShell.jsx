import { useState } from 'react';
import styles from './DesktopShell.module.css';
import { Sidebar, SidebarContent, SidebarTop } from './Sidebar';
import { TopUtilityIcons } from './TopUtilityIcons';
import { RightRail } from './RightRail';
import { SearchModal } from '../common/SearchModal';
import { moodStats, trendingTags } from '../../data/moodcastData';

export function DesktopShell({ children, topContent, splitLayout = false }) {
  const [searchOpen, setSearchOpen] = useState(false);

  if (splitLayout) {
    return (
      <main className={styles.splitLayout}>
        <div className={styles.leftTop}>
          <SidebarTop />
        </div>
        <div className={styles.centerTop}>{topContent}</div>
        <div className={styles.rightTop}>
          <TopUtilityIcons onSearch={() => setSearchOpen(true)} />
        </div>
        <div className={styles.leftContent}>
          <SidebarContent />
        </div>
        <section className={styles.centerContent}>{children}</section>
        <aside className={styles.rightContent}>
          <RightRail moodStats={moodStats} trendingTags={trendingTags} />
        </aside>
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      </main>
    );
  }

  return (
    <main className={styles.layout}>
      <Sidebar />
      <section className={styles.center}>{children}</section>
      <aside className={styles.right}>
        <TopUtilityIcons onSearch={() => setSearchOpen(true)} />
        <RightRail moodStats={moodStats} trendingTags={trendingTags} />
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
