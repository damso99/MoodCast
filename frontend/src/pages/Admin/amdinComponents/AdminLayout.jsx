import { NavLink } from 'react-router-dom';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Logo } from '../../../components/common/Logo';
import { adminNavItems } from './adminConfig';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * AdminLayout 컴포넌트
 * --------------------------------------------------------------------------
 * 모든 관리자 페이지가 공통으로 사용하는 큰 화면 틀입니다.
 *
 * 담당하는 화면 영역:
 * 1. 왼쪽 사이드바
 *    - MoodCast 로고
 *    - 관리자 메뉴
 *    - 관리자 프로필 영역
 *
 * 2. 오른쪽 본문 영역
 *    - 페이지 제목
 *    - 페이지 설명
 *    - 상단 아이콘 버튼
 *    - 각 페이지의 실제 내용
 *
 * children이란?
 * - React에서 <AdminLayout> ... </AdminLayout> 사이에 들어가는 내용을 뜻합니다.
 * - 예를 들어 대시보드 페이지의 카드와 그래프 영역이 children으로 들어옵니다.
 *
 * 이렇게 레이아웃을 분리하면 각 페이지 파일에서는 "본문 내용"에만 집중할 수 있습니다.
 * ========================================================================== */
export function AdminLayout({ children, title, description }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Logo compact />
          <div>
            <strong>MoodCast</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="관리자 메뉴">
          {adminNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
              <Icon className={styles.navIcon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.adminProfile}>
          <AccountCircleOutlinedIcon />
          <div>
            <strong>관리자</strong>
            <span>admin · super</span>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" aria-label="알림">
              <NotificationsNoneOutlinedIcon />
            </button>
            <button type="button" aria-label="도움말">
              <HelpOutlineOutlinedIcon />
            </button>
            <button type="button" aria-label="관리자 프로필">
              <AccountCircleOutlinedIcon />
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
