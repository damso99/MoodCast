import { useEffect, useState } from "react";
import axios from "axios";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { MetricCard } from "../common/MetricCard";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

/* ==========================================================================
 * 관리자 대시보드 상단 지표 카드 컴포넌트
 * --------------------------------------------------------------------------
 * 전체 회원 수, 오늘 가입자 수, 게시글 수, 신고 대기 카드를 담당합니다.
 *
 * 초보자 설명:
 * - useEffect 안에서 백엔드 summary API를 호출합니다.
 * - setInterval을 사용해 10초마다 숫자를 다시 가져와 최신 값에 가깝게 보여줍니다.
 * - 컴포넌트가 사라질 때 clearInterval로 반복 작업을 정리합니다.
 * ========================================================================== */
export function DashboardMetricCards() {
  const [dashboardSummary, setDashboardSummary] = useState({
    totalMemberCount: null,
    todayNewMemberCount: null,
    postCount: null,
  }); // 상단 카드에 표시할 숫자 묶음입니다.
  const [hasError, setHasError] = useState(false); // summary API 조회 실패 여부입니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) return;

    const fetchDashboardSummary = () => {
      axios
        .get(`${BACKSERVER}/admin/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setDashboardSummary({
            totalMemberCount:
              typeof res.data?.totalMemberCount === "number"
                ? res.data.totalMemberCount
                : 0,
            todayNewMemberCount:
              typeof res.data?.todayNewMemberCount === "number"
                ? res.data.todayNewMemberCount
                : 0,
            postCount:
              typeof res.data?.postCount === "number" ? res.data.postCount : 0,
          });
          setHasError(false);
        })
        .catch((error) => {
          console.log(error);
          setDashboardSummary({
            totalMemberCount: null,
            todayNewMemberCount: null,
            postCount: null,
          });
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
        label="회원 수"
        value={
          dashboardSummary.totalMemberCount === null
            ? "-"
            : dashboardSummary.totalMemberCount.toLocaleString()
        }
        helperText={hasError ? "조회 실패" : ""}
        icon={<GroupOutlinedIcon />}
      />
      <MetricCard
        label="오늘 가입자"
        value={
          dashboardSummary.todayNewMemberCount === null
            ? "-"
            : dashboardSummary.todayNewMemberCount.toLocaleString()
        }
        helperText={hasError ? "조회 실패" : ""}
        icon={<AddOutlinedIcon />}
        accent="blue"
      />
      <MetricCard
        label="게시글 수"
        value={
          dashboardSummary.postCount === null
            ? "-"
            : dashboardSummary.postCount.toLocaleString()
        }
        helperText={hasError ? "조회 실패" : ""}
        icon={<Inventory2OutlinedIcon />}
        accent="pink"
      />
      <MetricCard
        label="신고 대기"
        value="-"
        helperText="연결 예정"
        icon={<GppMaybeOutlinedIcon />}
        accent="orange"
      />
    </section>
  );
}
