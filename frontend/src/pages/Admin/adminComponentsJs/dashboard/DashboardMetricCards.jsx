import { useEffect, useState } from "react";
import axios from "axios";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { MetricCard } from "../common/MetricCard";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/DashboardMetricCards.module.css";

const DEFAULT_SUMMARY = {
  totalMemberCount: null,
  todayNewMemberCount: null,
  postCount: null,
  pendingReportCount: null,
};

export function DashboardMetricCards() {
  const [dashboardSummary, setDashboardSummary] = useState(DEFAULT_SUMMARY);
  const [hasError, setHasError] = useState(false);
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const fetchDashboardSummary = () => {
      axios
        .get(`${BACKSERVER}/admin/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setDashboardSummary({
            totalMemberCount: normalizeCount(res.data?.totalMemberCount),
            todayNewMemberCount: normalizeCount(res.data?.todayNewMemberCount),
            postCount: normalizeCount(res.data?.postCount),
            pendingReportCount: normalizeCount(res.data?.pendingReportCount),
          });
          setHasError(false);
        })
        .catch((error) => {
          console.error("[ADMIN_DASHBOARD_SUMMARY_ERROR]", error);
          setDashboardSummary(DEFAULT_SUMMARY);
          setHasError(true);
        });
    };

    fetchDashboardSummary();

    const pollingId = window.setInterval(fetchDashboardSummary, 10000);

    return () => {
      window.clearInterval(pollingId);
    };
  }, [BACKSERVER, accessToken]);

  return (
    <section className={styles.metricGrid}>
      <MetricCard
        label={"\uD68C\uC6D0 \uC218"}
        value={formatCount(dashboardSummary.totalMemberCount)}
        helperText={hasError ? "\uC870\uD68C \uC2E4\uD328" : ""}
        icon={<GroupOutlinedIcon />}
      />
      <MetricCard
        label={"\uC624\uB298 \uAC00\uC785\uC790"}
        value={formatCount(dashboardSummary.todayNewMemberCount)}
        helperText={hasError ? "\uC870\uD68C \uC2E4\uD328" : ""}
        icon={<AddOutlinedIcon />}
        accent="blue"
      />
      <MetricCard
        label={"\uAC8C\uC2DC\uAE00 \uC218"}
        value={formatCount(dashboardSummary.postCount)}
        helperText={hasError ? "\uC870\uD68C \uC2E4\uD328" : ""}
        icon={<Inventory2OutlinedIcon />}
        accent="pink"
      />
      <MetricCard
        label={"\uC2E0\uACE0 \uCC98\uB9AC \uB300\uAE30"}
        value={formatCount(dashboardSummary.pendingReportCount)}
        helperText={hasError ? "\uC870\uD68C \uC2E4\uD328" : ""}
        icon={<GppMaybeOutlinedIcon />}
        accent="orange"
      />
    </section>
  );
}

function normalizeCount(value) {
  return typeof value === "number" ? value : 0;
}

function formatCount(value) {
  return value === null ? "-" : value.toLocaleString();
}
