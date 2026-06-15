import { useEffect, useState } from "react";
import axios from "axios";
import { EmptyState } from "../common/EmptyState";
import { AdminPeriodRangeControl } from "../common/AdminPeriodRangeControl";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/DashboardEmotionActivityChart.module.css";

const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

const DASHBOARD_POLLING_INTERVAL_MS = 10000;

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

const emotionMeta = {
  1: { label: "행복", color: "#FFD700" },
  2: { label: "슬픔", color: "#4A90E2" },
  3: { label: "차분함", color: "#F4A460" },
  4: { label: "화남", color: "#E74C3C" },
  5: { label: "신남", color: "#FF69B4" },
  6: { label: "무감정", color: "#95A5A6" },
};

/* ==========================================================================
 * 감정별 활동 분포 그래프
 * --------------------------------------------------------------------------
 * 게시글 작성 시 선택된 감정 값을 기준으로 일/주/월 단위 활동량을 막대 그래프로
 * 보여주는 컴포넌트입니다.
 *
 * 초보자 설명:
 * - activePeriod는 현재 선택된 기간 탭입니다.
 * - emotionItems는 백엔드에서 받은 감정별 게시글 수 목록입니다.
 * - 막대 길이는 가장 큰 값(maxActivityCount)을 기준으로 비율을 계산합니다.
 * ========================================================================== */
export function DashboardEmotionActivityChart() {
  const [activePeriod, setActivePeriod] = useState("일"); // 일/주/월 중 선택된 탭입니다.
  const [emotionItems, setEmotionItems] = useState([]); // 백엔드에서 받은 감정별 활동 목록입니다.
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" }); // 기간 지정 조회에 사용할 시작일/종료일입니다.
  const [isLoading, setIsLoading] = useState(false); // API 호출 중인지 표시합니다.
  const [hasError, setHasError] = useState(false); // API 호출 실패 여부입니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 로그인 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isCurrentRequestGroup = true;
    const controllers = new Set();

    /*
     * 감정별 활동 분포 조회 및 폴링
     * ----------------------------------------------------------------------
     * 기간 탭을 바꾸면 activePeriod가 먼저 바뀌고, AdminPeriodRangeControl이 새 탭에 맞는 dateRange를
     * 이어서 전달합니다. 이 짧은 사이에 period=day + 월/주 범위 같은 잘못된 조합으로 요청하면
     * 백엔드의 일 단위 검증에 걸려 실패 상태가 화면을 덮어쓸 수 있습니다.
     *
     * 그래서 현재 period와 dateRange가 맞지 않으면 요청을 건너뛰고,
     * 탭 전환 전 요청은 AbortController와 isCurrentRequestGroup으로 무효화합니다.
     */
    const fetchEmotionActivity = ({ showLoading = false } = {}) => {
      const selectedPeriod = periodApiValue[activePeriod];

      if (!isDateRangeReadyForPeriod(selectedPeriod, dateRange)) {
        if (showLoading) {
          setIsLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      controllers.add(controller);

      if (showLoading) {
        setIsLoading(true);
      }
      setHasError(false);

      axios
        .get(`${BACKSERVER}/admin/api/dashboard/emotion-activity`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            period: selectedPeriod,
            ...dateRange,
          },
          signal: controller.signal,
        })
        .then((res) => {
          if (!isCurrentRequestGroup) {
            return;
          }

          setEmotionItems(Array.isArray(res.data?.items) ? res.data.items : []);
        })
        .catch((error) => {
          if (!isCurrentRequestGroup || isCanceledRequest(error)) {
            return;
          }

          if (showLoading) {
            setEmotionItems([]);
            setHasError(true);
          }
        })
        .finally(() => {
          controllers.delete(controller);

          if (showLoading && isCurrentRequestGroup) {
            setIsLoading(false);
          }
        });
    };

    fetchEmotionActivity({ showLoading: true });

    const pollingId = window.setInterval(
      fetchEmotionActivity,
      DASHBOARD_POLLING_INTERVAL_MS,
    );

    return () => {
      isCurrentRequestGroup = false;
      window.clearInterval(pollingId);
      controllers.forEach((controller) => controller.abort());
    };
  }, [BACKSERVER, accessToken, activePeriod, dateRange]);

  const maxActivityCount = Math.max(
    ...emotionItems.map((item) => Number(item.activityCount ?? 0)),
    1,
  );
  const emotionCountMap = emotionItems.reduce((countMap, item) => {
    countMap[String(item.emotionId)] = Number(item.activityCount ?? 0);
    return countMap;
  }, {});
  const displayEmotionItems = Object.entries(emotionMeta).map(
    ([emotionId, meta]) => ({
      emotionId,
      activityCount: emotionCountMap[emotionId] ?? 0,
      ...meta,
    }),
  );
  /*
   * 탭 변경마다 isLoading이 true가 되지만, 기존 데이터가 있는 상태에서 로딩 EmptyState로
   * 차트 DOM을 교체하면 화면이 순간적으로 깜빡입니다.
   * 그래서 첫 조회처럼 표시할 데이터가 없을 때만 로딩 안내를 보여주고,
   * 이후 재조회 중에는 기존 차트를 유지합니다.
   */
  const shouldShowInitialLoading = isLoading && emotionItems.length === 0;

  return (
    <section className={`${styles.panel} ${styles.widePanel}`}>
      <div className={styles.panelHead}>
        <h2>감정별 활동 분포</h2>
        <div className={styles.panelControls}>
          <SegmentedControl
            labels={["일", "주", "월"]}
            selectedLabel={activePeriod}
            onSelect={setActivePeriod}
          />
          <AdminPeriodRangeControl
            period={periodApiValue[activePeriod]}
            onRangeChange={setDateRange}
          />
        </div>
      </div>

      {shouldShowInitialLoading ? (
        <div className={styles.emptyChartState}>
          <EmptyState title="조회 중" description="감정별 활동을 불러오고 있습니다." />
        </div>
      ) : hasError ? (
        <div className={styles.emptyChartState}>
          <EmptyState
            title="조회 실패"
            description="감정별 활동 데이터를 불러오지 못했습니다."
          />
        </div>
      ) : (
        <div className={styles.barChart}>
          {displayEmotionItems.map((item) => {
            const activityCount = Number(item.activityCount ?? 0);
            const widthPercent =
              activityCount === 0
                ? 0
                : Math.max(
                    4,
                    Math.round((activityCount / maxActivityCount) * 100),
                  );

            return (
              <div className={styles.barRow} key={item.emotionId}>
                <span className={styles.barLabel}>{item.label}</span>
                <span className={styles.barTrack}>
                  <span
                    className={styles.barFill}
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </span>
                <strong className={styles.barValue}>
                  {activityCount.toLocaleString()}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
