import { SearchBar } from "../common/SearchBar";
import { SegmentedControl } from "../common/SegmentedControl";
import styles from "../../adminComponentsCss/contentManagement/ContentManagementPage.module.css";

/* ==========================================================================
 * 콘텐츠 관리 상단 검색 컴포넌트
 * --------------------------------------------------------------------------
 * 콘텐츠 종류 탭과 제목/작성자 검색창을 담당합니다.
 *
 * 초보자 설명:
 * - value는 현재 선택되거나 입력된 값을 화면에 보여주는 역할입니다.
 * - onChange 안에서 부모가 내려준 함수를 호출하면 부모 state가 바뀝니다.
 * - 이 컴포넌트는 API를 직접 호출하지 않고, 검색 조건 변경만 담당합니다.
 * ========================================================================== */
export function ContentManagementToolbar({
  contentTabs,
  selectedContentType,
  onSelectContentType,
  searchField,
  onSearchFieldChange,
  searchKeyword,
  onSearchKeywordChange,
}) {
  return (
    <section className={styles.topBar}>
      <SegmentedControl
        labels={contentTabs}
        selectedLabel={selectedContentType}
        onSelect={onSelectContentType}
      />

      <div className={styles.searchControls}>
        <select
          value={searchField}
          onChange={(event) => onSearchFieldChange(event.target.value)}
          aria-label="콘텐츠 검색 기준"
        >
          <option value="title">제목</option>
          <option value="author">작성자</option>
        </select>
        <SearchBar
          placeholder={searchField === "title" ? "제목으로 검색" : "작성자로 검색"}
          value={searchKeyword}
          onChange={(event) => onSearchKeywordChange(event.target.value)}
        />
      </div>
    </section>
  );
}
