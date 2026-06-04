import { useEffect, useState } from "react";
import { ReportConfirmStep } from "./ReportConfirmStep";
import { ReportDetailStep } from "./ReportDetailStep";
import { ReportOptionStep } from "./ReportOptionStep";
import { ReportReasonStep } from "./ReportReasonStep";
import { ReportTemporaryStep } from "./ReportTemporaryStep";
import styles from "../../adminComponentsCss/reportManagement/ReportDrawer.module.css";

/* 신고 상세와 제재 처리 단계를 오른쪽 패널 안에서 전환합니다. */
export function ReportDrawer({
  report,
  panelStep,
  selectedAction,
  selectedActionMeta,
  selectedReason,
  reasonDetail,
  selectedPeriod,
  customPeriod,
  releaseDate,
  onClose,
  onProcess,
  onBackToDetail,
  onBackToOption,
  onSelectAction,
  onNextFromOption,
  onChangeReason,
  onChangeDetail,
  onChangePeriod,
  onChangeCustomPeriod,
  onGoConfirm,
  onBackFromConfirm,
  onConfirm,
}) {
  const [isClosing, setIsClosing] = useState(false);

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

  const handleClose = () => {
    if (isClosing) return;

    setIsClosing(true);
    window.setTimeout(() => {
      onClose();
    }, 220);
  };

  return (
    <div
      className={`${styles.overlay} ${isClosing ? styles.overlayClosing : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="신고 상세 및 제재 처리 패널"
    >
      <button
        className={`${styles.dimmedArea} ${
          isClosing ? styles.dimmedAreaClosing : ""
        }`}
        type="button"
        aria-label="신고 처리 패널 닫기"
        onClick={handleClose}
      />
      <aside
        className={`${styles.drawer} ${isClosing ? styles.drawerClosing : ""}`}
      >
        {panelStep === "detail" && (
          <ReportDetailStep
            report={report}
            onClose={handleClose}
            onProcess={onProcess}
          />
        )}
        {panelStep === "option" && (
          <ReportOptionStep
            selectedAction={selectedAction}
            onBack={onBackToDetail}
            onClose={handleClose}
            onSelectAction={onSelectAction}
            onNext={onNextFromOption}
          />
        )}
        {panelStep === "reason" && (
          <ReportReasonStep
            actionMeta={selectedActionMeta}
            selectedReason={selectedReason}
            reasonDetail={reasonDetail}
            onBack={onBackToOption}
            onClose={handleClose}
            onChangeReason={onChangeReason}
            onChangeDetail={onChangeDetail}
            onNext={onGoConfirm}
          />
        )}
        {panelStep === "temporary" && (
          <ReportTemporaryStep
            report={report}
            selectedReason={selectedReason}
            reasonDetail={reasonDetail}
            selectedPeriod={selectedPeriod}
            customPeriod={customPeriod}
            releaseDate={releaseDate}
            onBack={onBackToOption}
            onClose={handleClose}
            onChangeReason={onChangeReason}
            onChangeDetail={onChangeDetail}
            onChangePeriod={onChangePeriod}
            onChangeCustomPeriod={onChangeCustomPeriod}
            onNext={onGoConfirm}
          />
        )}
        {panelStep === "confirm" && (
          <ReportConfirmStep
            report={report}
            actionMeta={selectedActionMeta}
            selectedReason={selectedReason}
            reasonDetail={reasonDetail}
            selectedPeriod={selectedPeriod}
            customPeriod={customPeriod}
            releaseDate={releaseDate}
            onBack={onBackFromConfirm}
            onClose={handleClose}
            onConfirm={onConfirm}
          />
        )}
      </aside>
    </div>
  );
}
