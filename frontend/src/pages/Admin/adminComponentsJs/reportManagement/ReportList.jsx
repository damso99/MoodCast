import { ReportListItem } from "./ReportListItem";
import styles from "../../adminComponentsCss/reportManagement/ReportList.module.css";

export function ReportList({ reports, onOpenReport }) {
  if (reports.length === 0) {
    return (
      <div className={styles.emptyReportList}>
        <strong>{"신고 데이터 없음"}</strong>
        <span>
          {
            "조건에 맞는 신고 목록이 없습니다."
          }
        </span>
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
