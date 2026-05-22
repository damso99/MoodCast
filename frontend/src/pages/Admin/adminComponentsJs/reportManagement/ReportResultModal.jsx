import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { statusMeta } from "./reportConstants";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

export function ReportResultModal({ report, onClose }) {
  const result = report.sanctionResult; // 처리 완료/반려 시 저장된 처리 결과 정보입니다.

  return (
    <div
      className={styles.resultOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="신고 처리 결과 조회"
    >
      {/* 처리 결과 팝업 배경 ---------------------------------- */}
      <button
        className={styles.resultDimmedArea}
        type="button"
        aria-label="처리 결과 팝업 닫기"
        onClick={onClose}
      />

      <section className={styles.resultModal}>
        {/* 처리 결과 팝업 상단 ---------------------------------- */}
        <header className={styles.resultHeader}>
          <div>
            <span
              className={`${styles.statusBadge} ${styles[statusMeta[report.status]?.className || "rejected"]}`}
            >
              {report.status}
            </span>
            <h2>신고 처리 결과</h2>
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

        {/* 신고 대상 요약 ---------------------------------- */}
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
              <dt>신고 번호</dt>
              <dd>#{report.id}</dd>
            </div>
            <div>
              <dt>신고 수</dt>
              <dd>{report.reportCount}건</dd>
            </div>
          </dl>
        </section>

        {/* 처리 결과 상세 ---------------------------------- */}
        <section className={styles.confirmTable}>
          <h3>처리 내용</h3>
          <dl>
            <div>
              <dt>처리 유형</dt>
              <dd>{result?.actionLabel || report.status}</dd>
            </div>
            <div>
              <dt>처리 사유</dt>
              <dd>{result?.reason || report.reason}</dd>
            </div>
            <div>
              <dt>상세 설명</dt>
              <dd>{result?.detail || report.detail}</dd>
            </div>
            {result?.periodLabel && (
              <>
                <div>
                  <dt>정지 기간</dt>
                  <dd>{result.periodLabel}</dd>
                </div>
                <div>
                  <dt>시작 시간</dt>
                  <dd>{result.startAt}</dd>
                </div>
                <div>
                  <dt>예상 해제 시간</dt>
                  <dd>{result.releaseDate}</dd>
                </div>
              </>
            )}
            <div>
              <dt>처리 관리자</dt>
              <dd>{result?.adminName || "관리자"}</dd>
            </div>
            <div>
              <dt>처리 시간</dt>
              <dd>{result?.handledAt || "-"}</dd>
            </div>
          </dl>
        </section>

        <footer className={styles.resultFooter}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={onClose}
          >
            확인
          </button>
        </footer>
      </section>
    </div>
  );
}
