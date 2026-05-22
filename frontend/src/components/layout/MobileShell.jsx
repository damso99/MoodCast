import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchModal } from '../common/SearchModal';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import styles from './MobileShell.module.css';

export function MobileShell({ title, children, hideSearch = false }) {
  const navigate = useNavigate();
  const { isLoggedIn, member } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const bellBtnRef = useRef(null);
  const { notifications, unreadCount, removeNotification, clearNotifications } = useRealtimeNotifications(
    isLoggedIn ? member?.memberId : null,
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        !bellBtnRef.current?.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  const openChatFromNotification = (notification) => {
    if (!notification?.senderId) {
      return;
    }

    const searchParams = new URLSearchParams({
      partnerId: String(notification.senderId),
      partnerName: notification.senderNickname || notification.senderName || `회원 ${notification.senderId}`,
    });

    removeNotification(notification.id);
    setNotificationOpen(false);
    navigate(`/app/chat?${searchParams.toString()}`);
  };

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
            <button
              type="button"
              ref={bellBtnRef}
              className={styles.iconButton}
              aria-label="알림"
              onClick={() => setNotificationOpen((value) => !value)}
            >
              <NotificationsNoneOutlinedIcon />
              {unreadCount > 0 ? <span /> : null}
            </button>
            <button type="button" className={styles.avatarButton} aria-label="프로필">
              <img src="/MoodCast-logo.svg" alt="" />
            </button>
          </div>
          {notificationOpen ? (
            <div className={styles.notificationCard} ref={notificationRef}>
              <strong>알림</strong>
              {notifications.length > 0 ? (
                <>
                  <div className={styles.notificationList}>
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={styles.notificationItem}
                        onClick={() => openChatFromNotification(notification)}
                      >
                        <span className={styles.notificationTitle}>
                          {notification.senderNickname || notification.senderName || `회원 ${notification.senderId}`}
                        </span>
                        <span className={styles.notificationPreview}>{notification.content}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.notificationClear}
                    onClick={clearNotifications}
                  >
                    모두 지우기
                  </button>
                </>
              ) : (
                <p>알림이 없습니다.</p>
              )}
            </div>
          ) : null}
        </header>
        <div className={styles.content}>{children}</div>
        <BottomNav />
      </main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
