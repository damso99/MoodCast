import { statusMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

/* ==========================================================================
 * 신고 처리 상태 탭 컴포넌트
 * --------------------------------------------------------------------------
 * 전체/처리 대기/검토 중/처리 완료/반려 필터와 현재 개수를 보여줍니다.
 * ========================================================================== */
export function ReportStatusTabs({ tabs, selectedTab, counts, onSelect }) {
  return (
    <div className={styles.statusTabs} aria-label="신고 처리 상태 필터">
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
              label === "전체"
                ? styles.totalCount
                : styles[statusMeta[label].className]
            }
          >
            {counts[label]}
          </strong>
        </button>
      ))}
    </div>
  );
}
