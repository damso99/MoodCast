import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useState } from 'react';
import { SearchModal } from '../common/SearchModal';
import { BottomNav } from './BottomNav';
import styles from './MobileShell.module.css';

export function MobileShell({ title, children, hideSearch = false }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className={styles.page}>
      <main className={styles.frame}>
        <header className={styles.topBar}>
          <h1>{title}</h1>
          <div className={styles.actions}>
            {!hideSearch ? (
              <button type="button" className={styles.iconButton} onClick={() => setSearchOpen(true)} aria-label="검색">
                <SearchOutlinedIcon />
              </button>
            ) : null}
            <button type="button" className={styles.iconButton} aria-label="알림">
              <NotificationsNoneOutlinedIcon />
              <span />
            </button>
            <button type="button" className={styles.avatarButton} aria-label="프로필">
              <img src="/MoodCast-logo.svg" alt="" />
            </button>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
        <BottomNav />
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
