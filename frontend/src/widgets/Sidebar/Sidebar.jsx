import { NavLink } from 'react-router-dom';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import { Logo } from '../../shared/ui/Logo/Logo';
import styles from './Sidebar.module.css';

const items = [
  { label: '홈', to: '/app/feed', icon: HomeOutlinedIcon },
  { label: '저장된 게시물', to: '/app/saved', icon: BookmarkBorderOutlinedIcon },
  { label: 'Mood Chat', to: '/app/mood-chat', icon: ChatBubbleOutlineOutlinedIcon },
  { label: '프로필', to: '/app/profile', icon: PersonOutlineOutlinedIcon },
  { label: '설정', to: '/app/settings', icon: SettingsOutlinedIcon },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Logo />
      <nav className={styles.nav}>
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}>
            <Icon className={styles.itemIcon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <section className={styles.premiumCard}>
        <div className={styles.premiumBadge}>
          <LocalFireDepartmentOutlinedIcon />
          <strong>MoodCast Premium</strong>
        </div>
        <p>더 많은 기능과 통계를 확인해보세요.</p>
        <button type="button">업그레이드</button>
      </section>
    </aside>
  );
}
