import { useState } from 'react';
import styles from './DesktopShell.module.css';
import { Sidebar } from '../../widgets/Sidebar/Sidebar';
import { TopUtilityIcons } from '../../widgets/TopUtilityIcons/TopUtilityIcons';
import { RightRail } from '../../widgets/RightRail/RightRail';
import { SearchModal } from '../../features/SearchModal/SearchModal';
import { moodStats, trendingTags } from '../../app/data/moodcastData';

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
