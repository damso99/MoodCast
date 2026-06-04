import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { reasonOptions, suspensionPeriods } from "./reportConstants";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportTemporaryStep.module.css";

export function ReportTemporaryStep({
  report,
  selectedReason,
  reasonDetail,
  selectedPeriod,
  customPeriod,
  releaseDate,
  onBack,
  onClose,
  onChangeReason,
  onChangeDetail,
  onChangePeriod,
  onChangeCustomPeriod,
  onNext,
}) {
  return (
    <>
      <DrawerHeader
        title="일시정지 옵션 설정"
        onBack={onBack}
        onClose={onClose}
      />

      <div className={styles.drawerBody}>
        <section className={styles.noticeBox}>
          <strong>{"\uC548\uB0B4"}</strong>
          <p>
            {
              "\uC77C\uC2DC\uC815\uC9C0 \uAE30\uAC04 \uB3D9\uC548 \uB85C\uADF8\uC778 \uBC0F \uC11C\uBE44\uC2A4 \uC774\uC6A9\uC744 \uC81C\uD55C\uD569\uB2C8\uB2E4."
            }
          </p>
        </section>

        <section className={styles.targetMiniCard}>
          <div className={styles.profileThumb}>
            <PersonOutlineOutlinedIcon />
          </div>
          <div>
            <strong>{report.targetName}</strong>
            <span>{report.targetHandle}</span>
          </div>
          <dl>
            <div>
              <dt>{"\uC2E0\uACE0 \uC218"}</dt>
              <dd>{report.reportCount}{"\uAC74"}</dd>
            </div>
            <div>
              <dt>{"\uAC00\uC785\uC77C"}</dt>
              <dd>{report.joinedAt}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.formSection}>
          <label htmlFor="temporary-reason">{"\uC81C\uC7AC \uC0AC\uC720 *"}</label>
          <select
            id="temporary-reason"
            value={selectedReason}
            onChange={(event) => onChangeReason(event.target.value)}
          >
            {reasonOptions.map((reason) => (
              <option key={reason}>{reason}</option>
            ))}
          </select>
        </section>

        <section className={styles.formSection}>
          <label htmlFor="temporary-detail">
            {"\uC120\uD0DD\uD55C \uC0AC\uC720\uC5D0 \uB300\uD55C \uCD94\uAC00 \uC124\uBA85"}
          </label>
          <textarea
            id="temporary-detail"
            maxLength={200}
            placeholder="추가 설명을 입력하세요."
            value={reasonDetail}
            onChange={(event) => onChangeDetail(event.target.value)}
          />
          <small>{reasonDetail.length}/200</small>
        </section>

        <section className={styles.periodSection}>
          <h3>{"\uC77C\uC2DC\uC815\uC9C0 \uAE30\uAC04 \uC120\uD0DD"}</h3>
          {suspensionPeriods.map((period) => (
            <label
              key={period.label}
              className={
                selectedPeriod === period.value ? styles.selectedPeriod : ""
              }
            >
              <input
                type="radio"
                name="period"
                checked={selectedPeriod === period.value}
                onChange={() => onChangePeriod(period.value)}
              />
              <span>
                <strong>{period.label}</strong>
                <small>{period.description}</small>
              </span>
            </label>
          ))}
          {selectedPeriod === "custom" && (
            <input
              className={styles.customPeriodInput}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="기간 입력"
              value={customPeriod}
              onChange={(event) =>
                onChangeCustomPeriod(event.target.value.replace(/[^0-9]/g, ""))
              }
            />
          )}
        </section>

        <section className={styles.releaseBox}>
          <span>{"\uC608\uC0C1 \uD574\uC81C \uC77C\uC2DC"}</span>
          <strong>{releaseDate}</strong>
          <p>
            {
              "* \uD604\uC7AC \uC2DC\uAC04 \uAE30\uC900\uC73C\uB85C \uACC4\uC0B0\uD55C \uC608\uC0C1 \uD574\uC81C \uC77C\uC2DC\uC785\uB2C8\uB2E4."
            }
          </p>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        <button className={styles.secondaryButton} type="button" onClick={onBack}>
          {"\uCDE8\uC18C"}
        </button>
        <button className={styles.primaryButton} type="button" onClick={onNext}>
          {"\uB2E4\uC74C"}
        </button>
      </footer>
    </>
  );
}
