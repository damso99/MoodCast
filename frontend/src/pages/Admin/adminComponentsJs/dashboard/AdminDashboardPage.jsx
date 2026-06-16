import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AdminLayout } from "../common/AdminLayout";
import { DashboardActiveUserChart } from "./DashboardActiveUserChart";
import { DashboardEmotionActivityChart } from "./DashboardEmotionActivityChart";
import { DashboardMetricCards } from "./DashboardMetricCards";
import { DashboardNoticeModal } from "./DashboardNoticeModal";
import { DashboardRecentActivities } from "./DashboardRecentActivities";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

const DEFAULT_SUMMARY = {
  totalMemberCount: null,
  todayNewMemberCount: null,
  postCount: null,
  pendingReportCount: null,
};

const DASHBOARD_POLLING_INTERVAL_MS = 30000;

function isDateRangeReadyForPeriod(period, range) {
  const { startDate, endDate } = range;

  if (!startDate || !endDate) {
    return true;
  }

  if (period === "day") {
    return startDate === endDate;
  }

  return startDate <= endDate;
}

function isCanceledRequest(error) {
  return axios.isCancel?.(error) || error?.code === "ERR_CANCELED";
}

export function AdminDashboardPage() {
  const [emotionPeriod, setEmotionPeriod] = useState("일");
  const [emotionDateRange, setEmotionDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [activeUserPeriod, setActiveUserPeriod] = useState("일");
  const [activeUserDateRange, setActiveUserDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [dashboardData, setDashboardData] = useState({
    summary: DEFAULT_SUMMARY,
    emotionActivity: [],
    activeUsers: [],
    recentActivities: [],
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [hasDashboardError, setHasDashboardError] = useState(false);
  const [hasDashboardLoaded, setHasDashboardLoaded] = useState(false);
  const hasDashboardLoadedRef = useRef(false);
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");
  const emotionPeriodValue = periodApiValue[emotionPeriod];
  const activeUserPeriodValue = periodApiValue[activeUserPeriod];

  const dashboardParams = useMemo(
    () => ({
      emotionPeriod: emotionPeriodValue,
      emotionStartDate: emotionDateRange.startDate,
      emotionEndDate: emotionDateRange.endDate,
      activeUserPeriod: activeUserPeriodValue,
      activeUserStartDate: activeUserDateRange.startDate,
      activeUserEndDate: activeUserDateRange.endDate,
    }),
    [
      activeUserDateRange.endDate,
      activeUserDateRange.startDate,
      activeUserPeriodValue,
      emotionDateRange.endDate,
      emotionDateRange.startDate,
      emotionPeriodValue,
    ],
  );

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isCurrentRequestGroup = true;
    const controllers = new Set();

    /*
     * 관리자 메인 대시보드 통합 조회
     * ----------------------------------------------------------------------
     * 기존에는 요약 카드, 감정 차트, 활성 사용자 차트, 최근 활동 컴포넌트가
     * 각각 10초마다 API를 호출했습니다.
     *
     * 현재는 AdminDashboardPage가 /admin/api/dashboard 통합 API 1개만 호출하고,
     * 하위 컴포넌트는 props로 받은 데이터를 렌더링합니다.
     * 폴링 주기는 30초로 낮추고, 브라우저 탭이 비활성 상태이면 폴링을 건너뜁니다.
     *
     * 탭 변경/폴링 중에는 기존 차트와 최근 활동을 유지합니다.
     * 첫 조회처럼 아직 표시할 데이터가 없을 때만 로딩 상태를 하위 컴포넌트에 전달해
     * 일/주/월 탭 전환 시 하단 영역 전체가 EmptyState로 교체되는 깜빡임을 막습니다.
     */
    const fetchDashboard = ({ showLoading = false } = {}) => {
      if (
        !isDateRangeReadyForPeriod(emotionPeriodValue, emotionDateRange) ||
        !isDateRangeReadyForPeriod(activeUserPeriodValue, activeUserDateRange)
      ) {
        if (showLoading) {
          setIsDashboardLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      controllers.add(controller);

      if (showLoading) {
        setIsDashboardLoading(true);
      }
      setHasDashboardError(false);

      axios
        .get(`${BACKSERVER}/admin/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: dashboardParams,
          signal: controller.signal,
        })
        .then((res) => {
          if (!isCurrentRequestGroup) {
            return;
          }

          const data = res.data || {};

          setDashboardData({
            summary: data.summary || DEFAULT_SUMMARY,
            emotionActivity: Array.isArray(data.emotionActivity)
              ? data.emotionActivity
              : [],
            activeUsers: Array.isArray(data.activeUsers)
              ? data.activeUsers
              : [],
            recentActivities: Array.isArray(data.recentActivities)
              ? data.recentActivities
              : [],
          });
          hasDashboardLoadedRef.current = true;
          setHasDashboardLoaded(true);
        })
        .catch((error) => {
          if (!isCurrentRequestGroup || isCanceledRequest(error)) {
            return;
          }

          if (showLoading && !hasDashboardLoadedRef.current) {
            setDashboardData({
              summary: DEFAULT_SUMMARY,
              emotionActivity: [],
              activeUsers: [],
              recentActivities: [],
            });
            setHasDashboardError(true);
          }
        })
        .finally(() => {
          controllers.delete(controller);

          if (showLoading && isCurrentRequestGroup) {
            setIsDashboardLoading(false);
          }
        });
    };

    fetchDashboard({ showLoading: true });

    const pollingId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      fetchDashboard({ showLoading: false });
    }, DASHBOARD_POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard({ showLoading: false });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCurrentRequestGroup = false;
      window.clearInterval(pollingId);
      controllers.forEach((controller) => controller.abort());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    BACKSERVER,
    accessToken,
    activeUserDateRange,
    activeUserPeriodValue,
    dashboardParams,
    emotionDateRange,
    emotionPeriodValue,
  ]);

  const isInitialDashboardLoading =
    isDashboardLoading && !hasDashboardLoaded;

  return (
    <AdminLayout
      title={"관리자 대시보드"}
      description={"회원, 게시글, 활동 현황을 한눈에 확인하세요."}
    >
      <DashboardNoticeModal />
      <DashboardMetricCards
        dashboardSummary={dashboardData.summary}
        hasError={hasDashboardError}
      />

      <section className={styles.dashboardGrid}>
        <div className={styles.dashboardMainColumn}>
          <DashboardEmotionActivityChart
            activePeriod={emotionPeriod}
            emotionItems={dashboardData.emotionActivity}
            isLoading={isInitialDashboardLoading}
            hasError={hasDashboardError}
            onPeriodChange={setEmotionPeriod}
            onRangeChange={setEmotionDateRange}
          />
          <DashboardActiveUserChart
            activePeriod={activeUserPeriod}
            activeUserItems={dashboardData.activeUsers}
            isLoading={isInitialDashboardLoading}
            hasError={hasDashboardError}
            onPeriodChange={setActiveUserPeriod}
            onRangeChange={setActiveUserDateRange}
          />
        </div>

        <div className={styles.dashboardSideColumn}>
          <DashboardRecentActivities
            recentActivities={dashboardData.recentActivities}
            isLoading={isInitialDashboardLoading}
            hasError={hasDashboardError}
          />
        </div>
      </section>
    </AdminLayout>
  );
}
