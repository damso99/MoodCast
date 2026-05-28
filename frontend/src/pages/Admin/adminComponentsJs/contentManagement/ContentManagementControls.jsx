import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

/* ==========================================================================
 * 콘텐츠 관리 상태/감정 필터 컴포넌트
 * --------------------------------------------------------------------------
 * 공개, 숨김, 삭제 상태 필터와 감정 필터를 담당합니다.
 *
 * 초보자 설명:
 * - 버튼을 누르면 selectedStatus가 바뀌고, 컨테이너 컴포넌트에서 게시글 목록을 다시 필터링합니다.
 * - select에서 감정을 바꾸면 selectedEmotionId가 바뀝니다.
 * - filteredPostCount는 현재 조건에 맞는 게시글 개수입니다.
 * ========================================================================== */
export function ContentManagementControls({
  statusFilters,
  selectedStatus,
  onSelectedStatusChange,
  filteredPostCount,
  emotionFilters,
  selectedEmotionId,
  onSelectedEmotionIdChange,
}) {
  return (
    <section className={styles.statusToolbar}>
      <div className={styles.statusPills}>
        {statusFilters.map((statusFilter) => (
          <button
            key={statusFilter}
            type="button"
            className={selectedStatus === statusFilter ? styles.activeStatus : ""}
            onClick={() => onSelectedStatusChange(statusFilter)}
          >
            {statusFilter}
          </button>
        ))}
      </div>

      <div className={styles.viewTools}>
        <span>{filteredPostCount.toLocaleString()}개 게시글</span>
        <select
          value={selectedEmotionId}
          onChange={(event) => onSelectedEmotionIdChange(event.target.value)}
          aria-label="감정 필터"
        >
          {emotionFilters.map((emotionItem) => (
            <option key={emotionItem.id} value={emotionItem.id}>
              {emotionItem.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
