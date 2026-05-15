import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import styles from '../AdminPages.module.css';

/* ==========================================================================
 * SearchBar 컴포넌트
 * --------------------------------------------------------------------------
 * 사용자 관리, 콘텐츠 관리, 신고 관리처럼 검색 기능이 필요한 화면에서
 * 공통으로 사용하는 검색 입력창입니다.
 *
 * 현재는 프론트 화면만 구현하는 단계라 실제 검색 로직은 없습니다.
 * 나중에 검색 기능을 붙일 때는 input의 value와 onChange를 props로 받아서
 * 부모 페이지에서 검색어 상태를 관리하게 만들면 됩니다.
 * ========================================================================== */
export function SearchBar({ placeholder = '검색어를 입력하세요' }) {
  return (
    <label className={styles.searchBar}>
      <SearchOutlinedIcon />
      <input type="search" placeholder={placeholder} />
    </label>
  );
}
