import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { useAuthStore } from '../../stores/useAuthStore';
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
  
  // 메뉴의 영역을 가리키는 참조(Ref) 생성함
  const menuRef = useRef(null);
  
  // 버튼 자체를 클릭했을 때 닫히는 현상을 방지하기 위한 버튼 참조임
  const profileBtnRef = useRef(null);
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || 'http://localhost:8080';

  // 화면의 다른 곳을 눌렀을 때 메뉴를 닫아주는 기능임
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 프로필 메뉴가 열려있고, 클릭한 곳이 메뉴 밖이며, 프로필 버튼도 아닐 때 닫음
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !profileBtnRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    // 마우스 누름 이벤트를 감시하기 시작함
    document.addEventListener('mousedown', handleClickOutside);
    
    // 컴포넌트가 사라질 때 감시를 종료함 (메모리 관리임)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const logout = () => {
    axios
      .post(`${BACKSERVER}/auth/logout`, {}, { withCredentials: true })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        clearAuthData();
        setMenuOpen(false);
        navigate('/auth/login');
      });
  };

  const goLogin = () => {
    setMenuOpen(false);
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
          setMenuOpen(false);
        }}
      >
        <NotificationsNoneOutlinedIcon />
      </button>

      {isLoggedIn ? (
        <>
          <button
            type="button"
            ref={profileBtnRef}
            className={styles.profile}
            aria-label="회원 메뉴"
            onClick={() => {
              setMenuOpen((value) => !value);
            }}
          >
            <img src={member?.profileImageUrl || defaultAvatarSrc} alt="" />
          </button>
          {menuOpen ? (
            <div className={styles.menu} ref={menuRef}>
              <button type="button" onClick={() => {
                setMenuOpen(false);
                navigate(`/app/user/${member.memberId}`);
              }}>
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
