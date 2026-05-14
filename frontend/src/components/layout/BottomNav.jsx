import { NavLink } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import styles from './BottomNav.module.css';

const items = [
  { label: '홈', to: '/app/feed', icon: HomeOutlinedIcon },
  { label: '저장된 게시물', to: '/app/saved', icon: BookmarkBorderOutlinedIcon },
  { label: '새 게시물 작성', to: '/app/write', icon: AddCircleOutlineOutlinedIcon, centerAction: true },
  { label: 'Mood Chat', to: '/app/mood-chat', icon: ChatBubbleOutlineOutlinedIcon },
  { label: '프로필', to: '/app/profile', icon: PersonOutlineOutlinedIcon },
];

export function BottomNav() {
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
