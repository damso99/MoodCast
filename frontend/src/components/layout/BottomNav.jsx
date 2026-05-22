import { NavLink } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { useAuthStore } from '../../hooks/useAuthStore';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const { isLoggedIn, member } = useAuthStore();

  const items = [
    { label: '홈', to: '/app/feed', icon: HomeOutlinedIcon },
    { label: '저장됨', to: '/app/saved', icon: BookmarkBorderOutlinedIcon },
    { label: '작성', to: '/app/write', icon: AddCircleOutlineOutlinedIcon, centerAction: true },
    { label: '채팅', to: '/app/mood-chat', icon: ChatBubbleOutlineOutlinedIcon },
    isLoggedIn
      ? { label: '프로필', to: `/app/user/${member?.memberId}`, icon: PersonOutlineOutlinedIcon }
      : { label: '로그인', to: '/auth/login', icon: LoginOutlinedIcon },
  ];

  return (
    <nav className={styles.nav} aria-label="모바일 하단 네비게이션">
      {items.map(({ label, to, icon: Icon, centerAction }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''} ${centerAction ? styles.centerAction : ''}`}>
          <span className={styles.iconWrap}>
            <Icon className={centerAction ? styles.centerIcon : ''} />
          </span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
