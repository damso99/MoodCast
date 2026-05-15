import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { AdminLayout } from './AdminLayout';
import { EmptyState } from './EmptyState';
import { EmptyTableRow, TableShell } from './TableShell';
import { MetricCard } from './MetricCard';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * 사용자 관리 페이지
 * --------------------------------------------------------------------------
 * 일반 회원, 정지 회원, 관리자 회원의 계정 권한을 관리하는 화면입니다.
 *
 * 담당 기능:
 * - 회원 상태별 필터 버튼
 * - 이름/아이디 검색창
 * - 회원 상태 요약 카드
 * - 사용자 목록 테이블
 * - 권한 변경 로그 영역
 *
 * 실제 권한 변경 기능은 백엔드 API가 필요하므로 지금은 화면 구조만 준비합니다.
 * ========================================================================== */
export function UserManagementPage() {
  return (
    <AdminLayout title="사용자 관리" description="회원 정보를 확인하고 계정 권한을 관리하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl labels={['전체', '일반 회원', '정지 회원', '관리자 회원']} />
        <SearchBar placeholder="이름, 아이디 검색" />
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="전체 회원" icon={<GroupOutlinedIcon />} />
        <MetricCard label="일반 회원" icon={<AccountCircleOutlinedIcon />} accent="blue" />
        <MetricCard label="정지 회원" icon={<GppMaybeOutlinedIcon />} accent="orange" />
        <MetricCard label="관리자 회원" icon={<DashboardOutlinedIcon />} accent="pink" />
      </section>

      <TableShell title="사용자 목록" columns={['사용자', '상태', '가입일', '권한', '작업']}>
        <EmptyTableRow colSpan={5} label="사용자 데이터 없음" />
      </TableShell>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>권한 변경 로그</h2>
        </div>
        <EmptyState title="변경 내역 없음" description="권한 변경 이력이 생기면 최신순으로 표시됩니다." />
      </section>
    </AdminLayout>
  );
}
