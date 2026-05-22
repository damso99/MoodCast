import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

/* ==========================================================================
 * 신고 처리 완료 메시지 컴포넌트
 * --------------------------------------------------------------------------
 * 관리자가 제재 확정 또는 반려 처리를 완료했을 때 상단에 보여주는 짧은 안내 메시지입니다.
 * ========================================================================== */
export function ReportCompletionToast({ message, onClose }) {
  return (
    <section
      className={styles.completionToast}
      role="status"
      aria-live="polite"
    >
      <DoneOutlinedIcon />
      <p>{message}</p>
      <button type="button" onClick={onClose} aria-label="제재 완료 안내 닫기">
        <CloseOutlinedIcon />
      </button>
    </section>
  );
}
