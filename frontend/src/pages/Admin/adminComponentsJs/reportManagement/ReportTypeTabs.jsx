import { typeMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportTypeTabs.module.css";

export function ReportTypeTabs({ tabs, selectedTab, counts, onSelect }) {
  return (
    <div
      className={styles.typeTabs}
      aria-label="신고 대상 유형 필터"
    >
      {tabs.map((label) => {
        const Icon = typeMeta[label]?.icon;

        return (
          <button
            key={label}
            className={selectedTab === label ? styles.activeTypeTab : ""}
            type="button"
            onClick={() => onSelect(label)}
          >
            {Icon && <Icon />}
            <span>{label}</span>
            <strong>{counts[label] ?? 0}</strong>
          </button>
        );
      })}
    </div>
  );
}
