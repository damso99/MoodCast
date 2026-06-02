import { ReportListItem } from "./ReportListItem";
import styles from "../../adminComponentsCss/reportManagement/ReportList.module.css";

/* ==========================================================================
 * 신고 목록 컴포넌트
 * --------------------------------------------------------------------------
 * 필터링된 신고 배열을 받아서 신고 카드 목록으로 렌더링합니다.
 * ========================================================================== */
export function ReportList({ reports, onOpenReport }) {
  if (reports.length === 0) {
    return (
      <div className={styles.emptyReportList}>
        <strong>신고 데이터 없음</strong>
        <span>백엔드에서 신고 목록을 받아오면 이 영역에 표시됩니다.</span>
      </div>
    );
  }

  return (
    <div className={styles.reportList}>
      {reports.map((report) => (
        <ReportListItem key={report.id} report={report} onOpen={onOpenReport} />
      ))}
    </div>
  );
}
