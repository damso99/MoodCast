import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import styles from "../../adminComponentsCss/common/SearchBar.module.css";

export function SearchBar({
  placeholder = "검색어를 입력하세요.",
  value,
  onChange,
  className = "",
}) {
  return (
    <label className={`${styles.searchBar} ${className}`.trim()}>
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
