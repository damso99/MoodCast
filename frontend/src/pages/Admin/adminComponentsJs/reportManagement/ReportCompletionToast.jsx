import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import styles from "../../adminComponentsCss/reportManagement/ReportCompletionToast.module.css";

export function ReportCompletionToast({ message, onClose }) {
  return (
    <section
      className={styles.completionToast}
      role="status"
      aria-live="polite"
    >
      <DoneOutlinedIcon />
      <p>{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="처리 완료 안내 닫기"
      >
        <CloseOutlinedIcon />
      </button>
    </section>
  );
}
