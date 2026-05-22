import { useState } from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { AdminLayout } from '../common/AdminLayout';
import { EmptyChart } from '../common/EmptyChart';
import { MetricCard } from '../common/MetricCard';
import { SearchBar } from '../common/SearchBar';
import { SegmentedControl } from '../common/SegmentedControl';
import styles from '../../adminComponentsCss/statisticsDashboard/StatisticsDashboardPage.module.css';

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
  const [period, setPeriod] = useState('일');
  const periodGuide = {
    일: '일별 가입자, DAU, 게시글, 댓글, 공감 수를 확인하는 기준입니다.',
    주: '주간 합계와 주간 활성 흐름을 확인하는 기준입니다.',
    월: '월간 활성 사용자와 월별 콘텐츠 증가량을 확인하는 기준입니다.',
  };

  return (
    <AdminLayout title="통계 대시보드" description="주요 지표를 확인하세요.">
      <section className={styles.toolbar}>
        <SegmentedControl labels={['일', '주', '월']} selectedLabel={period} onSelect={setPeriod} />
        <SearchBar placeholder="조회 기간 또는 지표 검색" />
      </section>

      <section className={styles.infoGrid}>
        <article className={styles.infoBox}>
          <strong>{period} 단위 조회</strong>
          <p>{periodGuide[period]}</p>
        </article>
        <article className={styles.infoBox}>
          <strong>시각화 항목</strong>
          <p>가입자, DAU, MAU, 게시글 수, 댓글 수, 공감 수를 같은 기간 기준으로 비교합니다.</p>
        </article>
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="가입자" icon={<GroupOutlinedIcon />} />
        <MetricCard label="DAU" icon={<BarChartOutlinedIcon />} accent="blue" />
        <MetricCard label="MAU" icon={<DashboardOutlinedIcon />} accent="pink" />
        <MetricCard label="공감 수" icon={<AddOutlinedIcon />} accent="orange" />
      </section>

      <section className={styles.dashboardGrid}>
        <EmptyChart title={`가입자 추이 (${period})`} />
        <EmptyChart title={`DAU 추이 (${period})`} />
        <EmptyChart title={`MAU 추이 (${period})`} />
        <EmptyChart title={`게시글 수 (${period})`} />
        <EmptyChart title={`댓글 수 (${period})`} />
        <EmptyChart title={`공감 수 (${period})`} />
      </section>
    </AdminLayout>
  );
}
