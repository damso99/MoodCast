import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { SearchModal } from '../common/SearchModal';
import { BottomNav } from './BottomNav';
import styles from './MobileShell.module.css';

export function MobileShell({ title, children, hideSearch = false, fixedContent = false, hideBottomNav = false }) {
  const navigate = useNavigate();
  const { isLoggedIn, member } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const goProfile = () => {
    setNotificationOpen(false);

    if (!isLoggedIn) {
      navigate('/auth/login');
      return;
    }

    if (member?.memberId) {
      navigate(`/app/user/${member.memberId}`);
      return;
    }

    navigate('/app/profile');
  };

  // 모바일 전용 레이아웃: 상단 바, 콘텐츠, 하단 탭 네비게이션을 구성합니다.
  return (
    <div className={`${styles.page} ${fixedContent ? styles.fixedPage : ''} ${hideBottomNav ? styles.fullPage : ''}`}>
      <main className={`${styles.frame} ${fixedContent ? styles.fixedFrame : ''} ${hideBottomNav ? styles.fullFrame : ''}`}>
        <header className={styles.topBar}>
          <h1>{title}</h1>
          <div className={styles.actions}>
            {!hideSearch ? (
              <button type="button" className={styles.iconButton} onClick={() => setSearchOpen(true)} aria-label="검색">
                <SearchOutlinedIcon />
              </button>
            ) : null}
            {/* 알림 버튼과 프로필 버튼은 모바일 상단에서 자주 쓰는 유틸리티 기능을 제공합니다. */}
            <button
              type="button"
              className={styles.iconButton}
              aria-label="알림"
              aria-expanded={notificationOpen}
              onClick={() => setNotificationOpen((value) => !value)}
            >
              <NotificationsNoneOutlinedIcon />
            </button>
            <button type="button" className={styles.avatarButton} aria-label="프로필로 이동" onClick={goProfile}>
              <img src={member?.profileImageUrl || '/MoodCast-logo.svg'} alt="" />
            </button>
          </div>
          {notificationOpen ? (
            <div className={styles.notificationCard}>
              <strong>알림</strong>
              <p>새로운 알림이 없습니다.</p>
            </div>
          ) : null}
        </header>
        <div
          className={`${styles.content} ${hideSearch ? styles.compactContent : ''} ${fixedContent ? styles.fixedContent : ''}`}
        >
          {children}
        </div>
        {!hideBottomNav ? <BottomNav /> : null}
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
