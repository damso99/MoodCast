import { ReportListItem } from './ReportListItem';
import styles from '../../adminComponentsCss/reportManagement/ReportManagementPage.module.css';

/* ==========================================================================
 * 신고 목록 컴포넌트
 * --------------------------------------------------------------------------
 * 필터링된 신고 배열을 받아서 신고 카드 목록으로 렌더링합니다.
 * ========================================================================== */
export function ReportList({ reports, onOpenReport }) {
  return (
    <div className={styles.reportList}>
      {reports.map((report) => (
        <ReportListItem key={report.id} report={report} onOpen={onOpenReport} />
      ))}
    </div>
  );
}
