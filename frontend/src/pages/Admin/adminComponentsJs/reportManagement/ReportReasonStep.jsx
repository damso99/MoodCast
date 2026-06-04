import { reasonOptions } from "./reportConstants";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportReasonStep.module.css";

export function ReportReasonStep({
  actionMeta,
  selectedReason,
  reasonDetail,
  onBack,
  onClose,
  onChangeReason,
  onChangeDetail,
  onNext,
}) {
  return (
    <>
      <DrawerHeader
        title={`${actionMeta?.label || "제재"} 사유 설정`}
        onBack={onBack}
        onClose={onClose}
      />

      <div className={styles.drawerBody}>
        <p className={styles.guideText}>
          {
            "\uAD00\uB9AC\uC790\uAC00 \uC5B4\uB5A4 \uC774\uC720\uB85C \uCC98\uB9AC\uD588\uB294\uC9C0 \uD655\uC778\uD560 \uC218 \uC788\uB3C4\uB85D \uC0AC\uC720\uB97C \uB0A8\uAE41\uB2C8\uB2E4."
          }
        </p>

        <section className={styles.formSection}>
          <label htmlFor="reason-select">{"\uC81C\uC7AC \uC0AC\uC720 *"}</label>
          <select
            id="reason-select"
            value={selectedReason}
            onChange={(event) => onChangeReason(event.target.value)}
          >
            {reasonOptions.map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </select>
        </section>

        <section className={styles.formSection}>
          <label htmlFor="reason-detail">{"\uC0C1\uC138 \uC124\uBA85"}</label>
          <textarea
            id="reason-detail"
            maxLength={200}
            placeholder="추가 설명을 입력하세요."
            value={reasonDetail}
            onChange={(event) => onChangeDetail(event.target.value)}
          />
          <small>{reasonDetail.length}/200</small>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        <button className={styles.secondaryButton} type="button" onClick={onBack}>
          {"\uC774\uC804"}
        </button>
        <button className={styles.primaryButton} type="button" onClick={onNext}>
          {"\uB2E4\uC74C"}
        </button>
      </footer>
    </>
  );
}
