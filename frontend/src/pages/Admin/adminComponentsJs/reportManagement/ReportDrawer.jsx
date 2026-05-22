import { ReportConfirmStep } from "./ReportConfirmStep";
import { ReportDetailStep } from "./ReportDetailStep";
import { ReportOptionStep } from "./ReportOptionStep";
import { ReportReasonStep } from "./ReportReasonStep";
import { ReportTemporaryStep } from "./ReportTemporaryStep";
import styles from "../../adminComponentsCss/reportManagement/ReportManagementPage.module.css";

/* ==========================================================================
 * 신고 처리 사이드 패널 컴포넌트
 * --------------------------------------------------------------------------
 * 오른쪽에서 열리는 패널 전체를 담당합니다.
 * panelStep 값에 따라 상세/옵션/사유/일시정지/최종확인 화면을 바꿔 보여줍니다.
 * ========================================================================== */
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
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="신고 상세 및 제재 처리 패널"
    >
      <button
        className={styles.dimmedArea}
        type="button"
        aria-label="패널 닫기"
        onClick={onClose}
      />
      <aside className={styles.drawer}>
        {panelStep === "detail" && (
          <ReportDetailStep
            report={report}
            onClose={onClose}
            onProcess={onProcess}
          />
        )}
        {panelStep === "option" && (
          <ReportOptionStep
            selectedAction={selectedAction}
            onBack={onBackToDetail}
            onClose={onClose}
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
            onClose={onClose}
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
            onClose={onClose}
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
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </aside>
    </div>
  );
}
