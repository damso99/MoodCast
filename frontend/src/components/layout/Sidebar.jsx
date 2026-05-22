import { NavLink } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Logo } from '../common/Logo';
import { useAuthStore } from '../../hooks/useAuthStore'; // Auth 정보 가져오기
import { useUnreadChatCount } from '../../hooks/useUnreadChatCount';
import styles from './Sidebar.module.css';

// 로고 감싸는 상단 부분임
function SidebarTop() {
  return (
    <div className={styles.top}>
      <Logo />
    </div>
  );
}

export function SidebarContent() {
  const { isLoggedIn, member } = useAuthStore();
  const unreadChatCount = useUnreadChatCount(isLoggedIn ? member?.memberId : null);

  const items = [
    { label: '홈', to: '/app/feed', icon: HomeOutlinedIcon },
    { label: '저장한 게시물', to: '/app/saved', icon: BookmarkBorderOutlinedIcon },
    { label: 'Mood Chat', to: '/app/mood-chat', icon: ChatBubbleOutlineOutlinedIcon, badgeCount: unreadChatCount },
    isLoggedIn
      ? { label: '프로필', to: `/app/user/${member?.memberId}`, icon: PersonOutlineOutlinedIcon }
      : { label: '로그인', to: '/auth/login', icon: PersonOutlineOutlinedIcon },
    { label: '설정', to: '/app/settings', icon: SettingsOutlinedIcon },
  ];

  return (
    <div className={styles.content}>
      <nav className={styles.nav}>
        {items.map(({ label, to, icon: Icon, badgeCount }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.iconWrap}>
              <Icon className={styles.itemIcon} />
              {badgeCount > 0 ? <b className={styles.badge}>{badgeCount > 99 ? '99+' : badgeCount}</b> : null}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <SidebarTop />
      <SidebarContent />
    </aside>
  );
}
