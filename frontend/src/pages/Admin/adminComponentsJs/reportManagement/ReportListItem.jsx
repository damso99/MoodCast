import { statusMeta } from "./reportConstants";
import { getTypeIcon } from "./reportUtils";
import styles from "../../adminComponentsCss/reportManagement/ReportListItem.module.css";

/* ==========================================================================
 * 신고 목록 항목 컴포넌트
 * --------------------------------------------------------------------------
 * 신고 1건의 요약 정보, 상태, 신고 수, 검토/결과 조회 버튼을 보여줍니다.
 * ========================================================================== */
export function ReportListItem({ report, onOpen }) {
  const Icon = getTypeIcon(report.type); // 신고 유형에 맞는 썸네일 아이콘입니다.
  const isResolved = report.status === "처리 완료"; // 제재 조치가 완료된 신고인지 판단합니다.
  const isRejected = report.status === "반려"; // 반려 처리된 신고인지 판단합니다.

  return (
    <article className={styles.reportItem}>
      <div className={styles.reportThumb + " " + styles["type" + report.type]}>
        <Icon />
        <span>{report.type}</span>
      </div>
      <div className={styles.reportSummary}>
        <h3>{report.title}</h3>
        <p>
          신고자 <strong>{report.reporter}</strong>
          <span>·</span>
          {report.reportedAgo}
        </p>
        <p>
          신고 사유 <strong>{report.reason}</strong>
        </p>
        <p className={styles.ellipsis}>{report.detail}</p>
      </div>
      <div className={styles.reportMeta}>
        <span
          className={
            styles.statusBadge +
            " " +
            styles[statusMeta[report.status]?.className || "rejected"]
          }
        >
          {report.status}
        </span>
        <strong>
          신고 수<b>{report.reportCount}건</b>
        </strong>
      </div>
      <div className={styles.reportAction}>
        <strong>#{report.id}</strong>
        <button type="button" onClick={() => onOpen(report)}>
          {isResolved && "처리 완료"}
          {isRejected && "반려"}
          {!isResolved && !isRejected && "검토하기"}
        </button>
      </div>
    </article>
  );
}
