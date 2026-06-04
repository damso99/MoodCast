import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { todayText } from "./reportConstants";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportConfirmStep.module.css";

export function ReportConfirmStep({
  report,
  actionMeta,
  selectedReason,
  reasonDetail,
  selectedPeriod,
  customPeriod,
  releaseDate,
  onBack,
  onClose,
  onConfirm,
}) {
  const periodLabel =
    selectedPeriod === "custom"
      ? `${customPeriod || 0}\uC77C`
      : `${selectedPeriod}\uC77C`;
  const isTemporary = actionMeta?.id === "temporary";
  const isReject = actionMeta?.id === "reject";

  return (
    <>
      <DrawerHeader
        title="처리 내용 확인"
        onBack={onBack}
        onClose={onClose}
      />

      <div className={styles.drawerBody}>
        <p className={styles.guideText}>
          {
            "\uC544\uB798 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uACE0 \uC2E0\uACE0 \uCC98\uB9AC\uB97C \uCD5C\uC885 \uD655\uC815\uD574\uC8FC\uC138\uC694."
          }
        </p>

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
              <dt>{"\uC2E0\uACE0 \uC218"}</dt>
              <dd>{report.reportCount}{"\uAC74"}</dd>
            </div>
            <div>
              <dt>{"\uAC00\uC785\uC77C"}</dt>
              <dd>{report.joinedAt}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.confirmTable}>
          <h3>{"\uCC98\uB9AC \uC0AC\uC720"}</h3>
          <dl>
            <div>
              <dt>
                {isReject
                  ? "\uCC98\uB9AC \uC720\uD615"
                  : "\uC81C\uC7AC \uC0AC\uC720"}
              </dt>
              <dd>{isReject ? "\uBC18\uB824" : selectedReason}</dd>
            </div>
            <div>
              <dt>{"\uC0C1\uC138 \uC124\uBA85"}</dt>
              <dd>
                {isReject
                  ? "\uC2E0\uACE0\uAC00 \uBD80\uC801\uC808\uD558\uB2E4\uACE0 \uD310\uB2E8\uB418\uC5B4 \uBC18\uB824\uD569\uB2C8\uB2E4."
                  : reasonDetail || report.detail}
              </dd>
            </div>
          </dl>
        </section>

        <section className={styles.confirmTable}>
          <h3>{"\uCC98\uB9AC \uB0B4\uC6A9"}</h3>
          <dl>
            <div>
              <dt>
                {isReject
                  ? "\uCC98\uB9AC \uC720\uD615"
                  : "\uC81C\uC7AC \uC720\uD615"}
              </dt>
              <dd>{actionMeta?.label}</dd>
            </div>
            {isTemporary && (
              <>
                <div>
                  <dt>{"\uC815\uC9C0 \uAE30\uAC04"}</dt>
                  <dd>{periodLabel}</dd>
                </div>
                <div>
                  <dt>{"\uC2DC\uC791 \uC2DC\uAC04"}</dt>
                  <dd>{todayText}</dd>
                </div>
                <div>
                  <dt>{"\uC608\uC0C1 \uD574\uC81C \uC2DC\uAC04"}</dt>
                  <dd>{releaseDate}</dd>
                </div>
                <div>
                  <dt>{"\uC801\uC6A9 \uBC94\uC704"}</dt>
                  <dd>{"\uB85C\uADF8\uC778 \uBC0F \uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC81C\uD55C"}</dd>
                </div>
              </>
            )}
            {!isTemporary && (
              <div>
                <dt>{"\uCC98\uB9AC \uB0B4\uC6A9"}</dt>
                <dd>
                  {actionMeta?.id === "warning" &&
                    "\uC0AC\uC6A9\uC790 \uACBD\uACE0 \uD69F\uC218\uB97C \uC99D\uAC00\uC2DC\uD0B5\uB2C8\uB2E4."}
                  {actionMeta?.id === "permanent" &&
                    "\uD574\uB2F9 \uC0AC\uC6A9\uC790\uC758 \uACC4\uC815\uC744 \uC601\uAD6C \uC815\uC9C0\uD569\uB2C8\uB2E4."}
                  {actionMeta?.id === "reject" &&
                    "\uC2E0\uACE0\uAC00 \uBD80\uC801\uC808\uD558\uB2E4\uACE0 \uD310\uB2E8\uD558\uC5EC \uBC18\uB824\uD569\uB2C8\uB2E4."}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className={styles.warningBox}>
          <ErrorOutlineOutlinedIcon />
          <div>
            <strong>{actionMeta?.label}{"\uCC98\uB9AC\uB97C \uC801\uC6A9\uD569\uB2C8\uB2E4."}</strong>
            <p>
              {
                "\uCC98\uB9AC \uD655\uC815 \uD6C4\uC5D0\uB294 \uC774\uB825\uC774 \uB0A8\uC73C\uBBC0\uB85C \uC2E0\uC911\uD558\uAC8C \uACB0\uC815\uD574\uC8FC\uC138\uC694."
              }
            </p>
          </div>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        <button className={styles.secondaryButton} type="button" onClick={onBack}>
          {"\uCDE8\uC18C"}
        </button>
        <button className={styles.primaryButton} type="button" onClick={onConfirm}>
          {"\uCC98\uB9AC \uD655\uC815"}
        </button>
      </footer>
    </>
  );
}
