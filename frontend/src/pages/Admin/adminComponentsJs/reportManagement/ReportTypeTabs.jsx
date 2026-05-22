import { typeMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

/* ==========================================================================
 * 신고 대상 유형 탭 컴포넌트
 * --------------------------------------------------------------------------
 * 전체/유저/게시글/댓글 필터와 현재 개수를 보여줍니다.
 * ========================================================================== */
export function ReportTypeTabs({ tabs, selectedTab, counts, onSelect }) {
  return (
    <div className={styles.typeTabs} aria-label="신고 대상 유형 필터">
      {tabs.map((label) => {
        const Icon = typeMeta[label].icon;
        return (
          <button
            key={label}
            className={selectedTab === label ? styles.activeTypeTab : ""}
            type="button"
            onClick={() => onSelect(label)}
          >
            <Icon />
            <span>{label}</span>
            <strong>{counts[label]}</strong>
          </button>
        );
      })}
    </div>
  );
}
