import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import styles from "../../adminComponentsCss/common/SearchBar.module.css";

/* ==========================================================================
 * SearchBar 컴포넌트
 * --------------------------------------------------------------------------
 * 사용자 관리, 콘텐츠 관리, 신고 관리처럼 검색 기능이 필요한 화면에서
 * 공통으로 사용하는 검색 입력창입니다.
 *
 * props 설명:
 * - placeholder: 입력창에 아무 값이 없을 때 보여주는 안내 문구입니다.
 * - value: 부모 컴포넌트가 관리하는 검색어 값입니다.
 * - onChange: 사용자가 검색어를 입력할 때 실행되는 함수입니다.
 *
 * value와 onChange를 넘기지 않으면 기존처럼 단순한 검색창으로도 사용할 수 있습니다.
 * ========================================================================== */
export function SearchBar({
  placeholder = "검색어를 입력하세요",
  value,
  onChange,
}) {
  return (
    <label className={styles.searchBar}>
      <SearchOutlinedIcon />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}
