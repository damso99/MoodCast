import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

/* ==========================================================================
 * 콘텐츠 관리 오른쪽 사이드 패널 컴포넌트
 * --------------------------------------------------------------------------
 * 게시글 관리 안내와 감정/기간 필터를 담당합니다.
 *
 * 초보자 설명:
 * - 오른쪽 사이드바에 있던 복수 관리 카드는 제거했습니다.
 * - 필터 초기화 버튼을 누르면 컨테이너 컴포넌트의 resetFilters 함수가 실행됩니다.
 * ========================================================================== */
export function ContentSidePanel({
  selectedContentType,
  contentDescriptions,
  emotionFilters,
  selectedEmotionId,
  onSelectedEmotionIdChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
}) {
  return (
    <aside className={styles.sideRail}>
      <section className={styles.summaryPanel}>
        <h2>{selectedContentType} 관리 안내</h2>
        <p>{contentDescriptions[selectedContentType]}</p>
      </section>

      <section className={styles.filterPanel}>
        <div className={styles.panelTitleRow}>
          <h2>필터</h2>
          <span>감정 / 기간</span>
        </div>
        <label>
          감정
          <select
            value={selectedEmotionId}
            onChange={(event) => onSelectedEmotionIdChange(event.target.value)}
          >
            {emotionFilters.map((emotionItem) => (
              <option key={emotionItem.id} value={emotionItem.id}>
                {emotionItem.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          작성일
          <select
            value={dateRange}
            onChange={(event) => onDateRangeChange(event.target.value)}
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">최근 7일</option>
          </select>
        </label>
        <button type="button" onClick={onResetFilters}>
          필터 초기화
        </button>
      </section>
    </aside>
  );
}
