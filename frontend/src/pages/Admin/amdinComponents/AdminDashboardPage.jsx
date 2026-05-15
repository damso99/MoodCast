import { NavLink } from 'react-router-dom';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { AdminLayout } from './AdminLayout';
import { EmptyState } from './EmptyState';
import { MetricCard } from './MetricCard';
import { SegmentedControl } from './SegmentedControl';
import { adminNavItems } from './adminConfig';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * 관리자 대시보드 페이지
 * --------------------------------------------------------------------------
 * 관리자 페이지에 처음 들어왔을 때 보여줄 메인 화면입니다.
 *
 * 담당 기능:
 * - 회원수, 신규 가입자, 게시글 수, 신고 대기 요약 카드
 * - 신규 가입자 추이 그래프 자리
 * - 감정별 활동 분포 필터 자리
 * - 최근 활동과 자주 확인하는 메뉴
 *
 * 현재는 백엔드를 붙이지 않았으므로 모든 데이터 영역은 EmptyState로 표시합니다.
 * ========================================================================== */
export function AdminDashboardPage() {
  return (
    <AdminLayout title="관리자 대시보드" description="서비스 운영 현황을 한눈에 확인하세요.">
      <section className={styles.metricGrid}>
        <MetricCard label="회원수" icon={<GroupOutlinedIcon />} />
        <MetricCard label="신규 가입자" icon={<AddOutlinedIcon />} accent="blue" />
        <MetricCard label="게시글 수" icon={<Inventory2OutlinedIcon />} accent="pink" />
        <MetricCard label="신고 대기" icon={<GppMaybeOutlinedIcon />} accent="orange" />
      </section>

      <section className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.panelHead}>
            <h2>신규 가입자 추이</h2>
            <SegmentedControl labels={['일', '주', '월']} />
          </div>
          <div className={`${styles.chartBox} ${styles.line}`}>
            <div className={styles.chartGrid} />
            <EmptyState title="가입자 데이터가 없습니다" description="일/주/월 단위 데이터가 연결되면 그래프가 표시됩니다." />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>감정별 활동 분포</h2>
          </div>
          <div className={styles.moodFilters}>
            {['기쁨', '자연', '설렘', '우울', '불안'].map((mood) => (
              <button key={mood} type="button">
                {mood}
              </button>
            ))}
          </div>
          <EmptyState title="활동 요약 없음" description="감정별 활동 데이터가 아직 없습니다." />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>최근 활동</h2>
          </div>
          <EmptyState title="최근 활동 없음" description="사용자 활동이 수집되면 이 영역에 표시됩니다." />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>자주 확인하는 메뉴</h2>
          </div>
          <div className={styles.quickLinks}>
            {adminNavItems.slice(1, 4).map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}
