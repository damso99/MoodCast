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
        title="일시 정지 옵션 설정"
        onBack={onBack}
        onClose={onClose}
      />

      <div className={styles.drawerBody}>
        <section className={styles.noticeBox}>
          <strong>안내</strong>
          <p>일시 정지 중에는 로그인 및 서비스 이용이 제한됩니다.</p>
        </section>

        {/* 신고 대상 요약 ---------------------------------- */}
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
              <dt>신고 수</dt>
              <dd>{report.reportCount}건</dd>
            </div>
            <div>
              <dt>가입일</dt>
              <dd>{report.joinedAt}</dd>
            </div>
          </dl>
        </section>

        {/* 일시 정지 사유 입력 ---------------------------------- */}
        <section className={styles.formSection}>
          <label htmlFor="temporary-reason">제재 사유 *</label>
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
          <label htmlFor="temporary-detail">선택한 사유에 대한 추가 설명</label>
          <textarea
            id="temporary-detail"
            maxLength={200}
            placeholder="추가 설명을 입력하세요."
            value={reasonDetail}
            onChange={(event) => onChangeDetail(event.target.value)}
          />
          <small>{reasonDetail.length}/200</small>
        </section>

        {/* 일시 정지 기간 선택 ---------------------------------- */}
        <section className={styles.periodSection}>
          <h3>일시 정지 기간 선택</h3>
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

        {/* 예상 해제 일시 ---------------------------------- */}
        <section className={styles.releaseBox}>
          <span>예상 해제 일시</span>
          <strong>{releaseDate}</strong>
          <p>* 현재 시간 기준으로 계산된 예상 해제 일시입니다.</p>
        </section>
      </div>

      <footer className={styles.drawerFooter}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={onBack}
        >
          취소
        </button>
        <button className={styles.primaryButton} type="button" onClick={onNext}>
          다음
        </button>
      </footer>
    </>
  );
}
