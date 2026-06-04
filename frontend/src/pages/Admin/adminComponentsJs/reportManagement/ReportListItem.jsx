import { REPORT_LABELS, statusMeta } from "./reportConstants";
import { getTypeIcon } from "./reportUtils";
import styles from "../../adminComponentsCss/reportManagement/ReportListItem.module.css";

export function ReportListItem({ report, onOpen }) {
  const Icon = getTypeIcon(report.type);
  const isResolved = report.status === REPORT_LABELS.done;

  return (
    <article className={styles.reportItem}>
      <div className={styles.reportThumb + " " + styles["type" + report.type]}>
        <Icon />
        <span>{report.type}</span>
      </div>
      <div className={styles.reportSummary}>
        <h3>{report.title}</h3>
        <p>
          {"\uC2E0\uACE0 \uB300\uC0C1"} <strong>{report.targetName}</strong>
          <span>{"\u00B7"}</span>
          {report.reportedAgo}
        </p>
        <p>
          {"\uC2E0\uACE0 \uC0AC\uC720"} <strong>{report.reason}</strong>
        </p>
        <p className={styles.ellipsis}>{report.detail}</p>
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
          {"\uC2E0\uACE0"} <b>{report.reportCount}{"\uAC74"}</b>
        </strong>
      </div>
      <div className={styles.reportAction}>
        <strong>#{report.id}</strong>
        <button type="button" onClick={() => onOpen(report)}>
          {isResolved
            ? "\uCC98\uB9AC \uACB0\uACFC"
            : "\uAC80\uD1A0\uD558\uAE30"}
        </button>
      </div>
    </article>
  );
}
