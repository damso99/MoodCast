import { useEffect } from "react";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { statusMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportResultModal.module.css";

export function ReportResultModal({ report, onClose }) {
  const result = report.sanctionResult;

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  return (
    <div
      className={styles.resultOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="신고 처리 결과 조회"
    >
      <button
        className={styles.resultDimmedArea}
        type="button"
        aria-label="처리 결과 팝업 닫기"
        onClick={onClose}
      />

      <section className={styles.resultModal}>
        <header className={styles.resultHeader}>
          <div>
            <span
              className={`${styles.statusBadge} ${styles[statusMeta[report.status]?.className || "resolved"]}`}
            >
              {report.status}
            </span>
            <h2>{"신고 처리 결과"}</h2>
          </div>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="처리 결과 팝업 닫기"
            onClick={onClose}
          >
            <CloseOutlinedIcon />
          </button>
        </header>

        <section className={styles.confirmTarget}>
          <div className={styles.profileThumb}>
            <PersonOutlineOutlinedIcon />
          </div>
          <div>
            <strong>{report.targetName}</strong>
            <span>{report.targetHandle}</span>
          </div>
          <dl>
            <div>
              <dt>{"신고 번호"}</dt>
              <dd>#{report.id}</dd>
            </div>
            <div>
              <dt>{"신고 수"}</dt>
              <dd>{report.reportCount}{"건"}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.confirmTable}>
          <h3>{"처리 내용"}</h3>
          <dl>
            <div>
              <dt>{"처리 유형"}</dt>
              <dd>{result?.actionLabel || report.status}</dd>
            </div>
            <div>
              <dt>{"처리 사유"}</dt>
              <dd>{result?.reason || report.reason}</dd>
            </div>
            <div>
              <dt>{"상세 설명"}</dt>
              <dd>{result?.detail || report.detail}</dd>
            </div>
            <div>
              <dt>{"처리 관리자"}</dt>
              <dd>{result?.adminName || "관리자"}</dd>
            </div>
            <div>
              <dt>{"처리 시간"}</dt>
              <dd>{result?.handledAt || "-"}</dd>
            </div>
          </dl>
        </section>

        <footer className={styles.resultFooter}>
          <button className={styles.primaryButton} type="button" onClick={onClose}>
            {"확인"}
          </button>
        </footer>
      </section>
    </div>
  );
}
