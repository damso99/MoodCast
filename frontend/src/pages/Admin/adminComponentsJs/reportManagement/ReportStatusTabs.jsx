import { REPORT_LABELS, statusMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportStatusTabs.module.css";

export function ReportStatusTabs({ tabs, selectedTab, counts, onSelect }) {
  return (
    <div
      className={styles.statusTabs}
      aria-label="신고 처리 상태 필터"
    >
      {tabs.map((label) => (
        <button
          key={label}
          className={selectedTab === label ? styles.activeStatusTab : ""}
          type="button"
          onClick={() => onSelect(label)}
        >
          <span>{label}</span>
          <strong
            className={
              label === REPORT_LABELS.all
                ? styles.totalCount
                : styles[statusMeta[label]?.className || "resolved"]
            }
          >
            {counts[label] ?? 0}
          </strong>
        </button>
      ))}
    </div>
  );
}
