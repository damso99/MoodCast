import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";

/* ==========================================================================
 * 신고 및 제재 관리 유틸 함수
 * --------------------------------------------------------------------------
 * 화면 여러 곳에서 공통으로 사용하는 작은 계산 함수들을 모아둔 파일입니다.
 * ========================================================================== */
export function getTypeIcon(type) {
  if (type === "유저") return PersonOutlineOutlinedIcon;
  if (type === "댓글") return ChatBubbleOutlineOutlinedIcon;
  return ArticleOutlinedIcon;
}

export function getReleaseDate(days) {
  if (days === "custom") return "직접 입력한 기간 기준으로 계산됩니다.";
  if (!days) return "-";
  const releaseDay = 21 + Number(days);
  return "2026.05." + String(releaseDay).padStart(2, "0") + " 14:30";
}

export function countReportsByStatus(reports, statusTabs) {
  return statusTabs.reduce((counts, tabLabel) => {
    counts[tabLabel] =
      tabLabel === "전체"
        ? reports.length
        : reports.filter((report) => report.status === tabLabel).length;
    return counts;
  }, {});
}

export function countReportsByType(reports, typeTabs) {
  return typeTabs.reduce((counts, tabLabel) => {
    counts[tabLabel] =
      tabLabel === "전체"
        ? reports.length
        : reports.filter((report) => report.type === tabLabel).length;
    return counts;
  }, {});
}
