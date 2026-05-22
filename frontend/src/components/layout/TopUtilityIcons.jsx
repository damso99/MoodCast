import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { useAuthStore } from '../../hooks/useAuthStore';
import styles from './TopUtilityIcons.module.css';

const defaultAvatarSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff7a8f"/>
          <stop offset="55%" stop-color="#b59cff"/>
          <stop offset="100%" stop-color="#5ac8ff"/>
        </linearGradient>
      </defs>
      <rect width="80" height="80" rx="40" fill="url(#g)"/>
      <circle cx="40" cy="31" r="12" fill="#fff" opacity=".9"/>
      <path d="M22 63c4-11 12-16 18-16s14 5 18 16" fill="#fff" opacity=".9"/>
    </svg>
  `);

export function TopUtilityIcons({ onSearch }) {
  const navigate = useNavigate();
  const { isLoggedIn, member, clearAuthData } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notifications = [];
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';
  const hasUnreadNotifications = notifications.length > 0;

  const logout = () => {
    axios
      .post(`${BACKSERVER}/auth/logout`, {}, { withCredentials: true })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        clearAuthData();
        setMenuOpen(false);
        setNotificationOpen(false);
        navigate('/auth/login');
      });
  };

  const goLogin = () => {
    setMenuOpen(false);
    setNotificationOpen(false);
    navigate('/auth/login');
  };

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.search} onClick={onSearch} aria-label="검색">
        <SearchOutlinedIcon />
      </button>
      <button
        type="button"
        className={styles.bell}
        aria-label="알림"
        onClick={() => {
          setNotificationOpen((value) => !value);
          setMenuOpen(false);
        }}
      >
        <NotificationsNoneOutlinedIcon />
        {hasUnreadNotifications ? <span /> : null}
      </button>
      {notificationOpen ? (
        <div className={styles.notificationCard}>
          <strong>알림</strong>
          <p>알림이 없습니다.</p>
        </div>
      ) : null}

      {isLoggedIn ? (
        <>
          <button
            type="button"
            className={styles.profile}
            aria-label="회원 메뉴"
            onClick={() => {
              setMenuOpen((value) => !value);
              setNotificationOpen(false);
            }}
          >
            <img src={member?.profileImageUrl || defaultAvatarSrc} alt="" />
          </button>
          {menuOpen ? (
            <div className={styles.menu}>
              <button type="button" onClick={() => navigate('/app/profile')}>
                <AccountCircleOutlinedIcon />
                프로필 보기
              </button>
              <button type="button" onClick={logout}>
                <LogoutOutlinedIcon />
                로그아웃
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <button type="button" className={styles.loginButton} onClick={goLogin} aria-label="로그인">
          <LoginOutlinedIcon />
        </button>
      )}
    </div>
  );
}
