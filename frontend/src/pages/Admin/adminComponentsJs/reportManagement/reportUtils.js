import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import { REPORT_LABELS } from "./reportConstants";

export function getTypeIcon(type) {
  if (type === REPORT_LABELS.comment) return ChatBubbleOutlineOutlinedIcon;
  return ArticleOutlinedIcon;
}

export function getReleaseDate(days) {
  if (days === "custom") {
    return "직접 입력한 기간 기준으로 계산합니다.";
  }

  if (!days) return "-";

  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() + Number(days));

  return releaseDate.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function countReportsByStatus(reports, statusTabs) {
  return statusTabs.reduce((counts, tabLabel) => {
    counts[tabLabel] =
      tabLabel === REPORT_LABELS.all
        ? reports.length
        : reports.filter((report) => report.status === tabLabel).length;
    return counts;
  }, {});
}

export function countReportsByType(reports, typeTabs) {
  return typeTabs.reduce((counts, tabLabel) => {
    counts[tabLabel] =
      tabLabel === REPORT_LABELS.all
        ? reports.length
        : reports.filter((report) => report.type === tabLabel).length;
    return counts;
  }, {});
}
