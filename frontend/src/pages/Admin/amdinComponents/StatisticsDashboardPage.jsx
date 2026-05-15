import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { AdminLayout } from './AdminLayout';
import { EmptyChart } from './EmptyChart';
import { MetricCard } from './MetricCard';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * 통계 대시보드 페이지
 * --------------------------------------------------------------------------
 * 가입자, 일간 활성 사용자, 월간 활성 사용자, 게시글 수, 댓글 수,
 * 공감 수를 시각화할 화면입니다.
 *
 * 담당 기능:
 * - 일/주/월 기간 선택 영역
 * - 조회 기간 또는 지표 검색 영역
 * - 가입자, DAU, MAU, 공감 수 요약 카드
 * - 가입자/DAU/MAU/게시글/댓글/공감 그래프 자리
 *
 * DAU / MAU 뜻:
 * - DAU: Daily Active Users, 하루 활성 사용자 수
 * - MAU: Monthly Active Users, 한 달 활성 사용자 수
 *
 * 지금은 더미데이터 없이 화면만 보여주는 단계라 EmptyChart만 배치했습니다.
 * ========================================================================== */
export function StatisticsDashboardPage() {
  return (
    <AdminLayout title="통계 대시보드" description="주요 지표를 확인하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl labels={['일', '주', '월']} />
        <SearchBar placeholder="조회 기간 또는 지표 검색" />
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="가입자" icon={<GroupOutlinedIcon />} />
        <MetricCard label="DAU" icon={<BarChartOutlinedIcon />} accent="blue" />
        <MetricCard label="MAU" icon={<DashboardOutlinedIcon />} accent="pink" />
        <MetricCard label="공감 수" icon={<AddOutlinedIcon />} accent="orange" />
      </section>

      <section className={styles.dashboardGrid}>
        <EmptyChart title="가입자 추이" />
        <EmptyChart title="DAU 추이" />
        <EmptyChart title="MAU 추이" />
        <EmptyChart title="게시글 수" />
        <EmptyChart title="댓글 수" />
        <EmptyChart title="공감 수" />
      </section>
    </AdminLayout>
  );
}
