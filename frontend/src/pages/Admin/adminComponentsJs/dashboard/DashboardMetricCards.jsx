import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { MetricCard } from "../common/MetricCard";
import styles from "../../adminComponentsCss/dashboard/DashboardMetricCards.module.css";

const DEFAULT_SUMMARY = {
  totalMemberCount: null,
  todayNewMemberCount: null,
  postCount: null,
  pendingReportCount: null,
};

export function DashboardMetricCards({
  dashboardSummary = DEFAULT_SUMMARY,
  hasError = false,
}) {
  const normalizedSummary = {
    totalMemberCount: normalizeCount(dashboardSummary.totalMemberCount),
    todayNewMemberCount: normalizeCount(dashboardSummary.todayNewMemberCount),
    postCount: normalizeCount(dashboardSummary.postCount),
    pendingReportCount: normalizeCount(dashboardSummary.pendingReportCount),
  };

  return (
    <section className={styles.metricGrid}>
      <MetricCard
        label={"회원 수"}
        value={formatCount(normalizedSummary.totalMemberCount)}
        helperText={hasError ? "조회 실패" : ""}
        icon={<GroupOutlinedIcon />}
      />
      <MetricCard
        label={"오늘 가입자"}
        value={formatCount(normalizedSummary.todayNewMemberCount)}
        helperText={hasError ? "조회 실패" : ""}
        icon={<AddOutlinedIcon />}
        accent="blue"
      />
      <MetricCard
        label={"게시글 수"}
        value={formatCount(normalizedSummary.postCount)}
        helperText={hasError ? "조회 실패" : ""}
        icon={<Inventory2OutlinedIcon />}
        accent="pink"
      />
      <MetricCard
        label={"신고 처리 대기"}
        value={formatCount(normalizedSummary.pendingReportCount)}
        helperText={hasError ? "조회 실패" : ""}
        icon={<GppMaybeOutlinedIcon />}
        accent="orange"
      />
    </section>
  );
}

function normalizeCount(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "number" ? value : 0;
}

function formatCount(value) {
  return value === null ? "-" : value.toLocaleString();
}
