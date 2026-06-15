import { REPORT_LABELS, statusMeta } from "./reportConstants";
import { getTypeIcon } from "./reportUtils";
import {
  extractImageUrls,
  normalizeBackendUrl,
  stripHtml,
} from "../../../../shared/lib/postHelpers";
import styles from "../../adminComponentsCss/reportManagement/ReportListItem.module.css";

export function ReportListItem({ report, onOpen }) {
  const Icon = getTypeIcon(report.type);
  const isResolved = report.status === REPORT_LABELS.done;
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
  const summaryText = stripHtml(report.detail || report.targetContent || "");
  const firstImageSrc = getFirstReportImageSrc(report, BACKSERVER);

  return (
    <article className={styles.reportItem}>
      <div className={styles.reportThumb + " " + styles["type" + report.type]}>
        {firstImageSrc ? (
          <img src={firstImageSrc} alt={`${report.title} 썸네일`} loading="lazy" />
        ) : (
          <Icon />
        )}
        <span>{report.type}</span>
      </div>
      <div className={styles.reportSummary}>
        <h3>{report.title}</h3>
        <p>
          {"신고 대상"} <strong>{report.targetName}</strong>
          <span>{"·"}</span>
          {report.reportedAgo}
        </p>
        <p>
          {"신고 사유"} <strong>{report.reason}</strong>
        </p>
        <p className={styles.ellipsis}>{summaryText || "-"}</p>
      </div>
      <div className={styles.reportMeta}>
        <span
          className={
            styles.statusBadge +
            " " +
            styles[statusMeta[report.status]?.className || "resolved"]
          }
        >
          {report.status}
        </span>
        <strong>
          {"신고"} <b>{report.reportCount}{"건"}</b>
        </strong>
      </div>
      <div className={styles.reportAction}>
        <strong>#{report.id}</strong>
        <button type="button" onClick={() => onOpen(report)}>
          {isResolved
            ? "처리 결과"
            : "검토하기"}
        </button>
      </div>
    </article>
  );
}

function getFirstReportImageSrc(report, backserver) {
  const imageCandidates = [
    ...extractImageUrls(report?.detail || ""),
    ...extractImageUrls(report?.targetContent || ""),
  ];

  const firstImage = imageCandidates.find(Boolean);
  return firstImage ? normalizeBackendUrl(firstImage, backserver, "post-images") : "";
}
