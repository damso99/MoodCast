import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import styles from "../../adminComponentsCss/reportManagement/ReportDrawerHeader.module.css";

export function DrawerHeader({ title, onBack, onClose }) {
  return (
    <header className={styles.drawerHeader}>
      {onBack ? (
        <button
          className={styles.iconButton}
          type="button"
          aria-label="이전 단계"
          onClick={onBack}
        >
          <ArrowBackOutlinedIcon />
        </button>
      ) : (
        <span className={styles.headerSpacer} />
      )}
      <h2>{title}</h2>
      <button
        className={styles.iconButton}
        type="button"
        aria-label="패널 닫기"
        onClick={onClose}
      >
        <CloseOutlinedIcon />
      </button>
    </header>
  );
}
