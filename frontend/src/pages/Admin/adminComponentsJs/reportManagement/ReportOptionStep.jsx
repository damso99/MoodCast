import { sanctionOptions } from "./reportConstants";
import { DrawerHeader } from "./ReportDrawerHeader";
import styles from "../../adminComponentsCss/reportManagement/ReportOptionStep.module.css";

export function ReportOptionStep({
  selectedAction,
  onBack,
  onClose,
  onSelectAction,
  onNext,
}) {
  return (
    <>
      <DrawerHeader title="처리 옵션 선택" onBack={onBack} onClose={onClose} />

      <div className={styles.drawerBody}>
        <p className={styles.guideText}>
          선택한 신고를 어떤 방식으로 처리할지 선택해주세요.
        </p>

        {/* 제재 옵션 선택 ---------------------------------- */}
        <section className={styles.optionList}>
          {sanctionOptions.map((option) => {
            const Icon = option.icon; // 옵션별 아이콘입니다.
            const isSelected = selectedAction === option.id; // 현재 선택된 옵션인지 확인합니다.

            return (
              <button
                key={option.id}
                className={`${styles.optionCard} ${styles[option.tone]} ${isSelected ? styles.selectedOption : ""}`}
                type="button"
                onClick={() => onSelectAction(option.id)}
              >
                <Icon />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                <i aria-hidden="true" />
              </button>
            );
          })}
        </section>

        {/* 제재 전 안내 ---------------------------------- */}
        <section className={styles.noticeBox}>
          <strong>안내</strong>
          <p>제재를 실행하기 전에 신고 내용과 증거를 충분히 검토해주세요.</p>
          <p>잘못된 제재는 사용자 경험에 부정적인 영향을 줄 수 있습니다.</p>
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
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!selectedAction}
          onClick={onNext}
        >
          다음
        </button>
      </footer>
    </>
  );
}
