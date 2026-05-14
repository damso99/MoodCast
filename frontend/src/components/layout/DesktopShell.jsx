import { useState } from 'react';
import styles from './DesktopShell.module.css';
import { Sidebar } from './Sidebar';
import { TopUtilityIcons } from './TopUtilityIcons';
import { RightRail } from './RightRail';
import { SearchModal } from '../common/SearchModal';
import { moodStats, trendingTags } from '../../data/moodcastData';

export function DesktopShell({ children }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <main className={styles.layout}>
      <Sidebar />
      <section className={styles.center}>
        {children}
      </section>
      <aside className={styles.right}>
        <TopUtilityIcons onSearch={() => setSearchOpen(true)} />
        <RightRail moodStats={moodStats} trendingTags={trendingTags} />
      </aside>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </main>
  );
}
