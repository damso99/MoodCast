import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

/* ==========================================================================
 * 콘텐츠 관리 선택 작업 컴포넌트
 * --------------------------------------------------------------------------
 * 현재 페이지 전체 선택과 선택한 게시글의 숨김/삭제/복구 버튼을 담당합니다.
 *
 * 초보자 설명:
 * - checked는 체크박스가 체크되어 있는지 보여주는 값입니다.
 * - disabled가 true면 버튼을 누를 수 없습니다.
 * - 실제 API 호출은 컨테이너 컴포넌트의 onBulkAction 함수가 처리합니다.
 * ========================================================================== */
export function ContentBulkActions({
  isCurrentPageAllSelected,
  onToggleCurrentPageSelection,
  selectedCount,
  bulkActionLoading,
  onBulkAction,
}) {
  const isButtonDisabled = selectedCount === 0 || bulkActionLoading;

  return (
    <section className={styles.bulkActionBar}>
      <label className={styles.selectAllLabel}>
        <input
          type="checkbox"
          checked={isCurrentPageAllSelected}
          onChange={onToggleCurrentPageSelection}
        />
        현재 페이지 전체 선택
      </label>
      <div className={styles.bulkActions}>
        <span>선택 {selectedCount.toLocaleString()}개</span>
        <button
          type="button"
          disabled={isButtonDisabled}
          onClick={() => onBulkAction("hide")}
        >
          숨김
        </button>
        <button
          type="button"
          disabled={isButtonDisabled}
          onClick={() => onBulkAction("softDelete")}
        >
          삭제
        </button>
        <button
          type="button"
          disabled={isButtonDisabled}
          onClick={() => onBulkAction("restore")}
        >
          복구
        </button>
      </div>
    </section>
  );
}
