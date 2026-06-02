import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { EmptyState } from "../common/EmptyState";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/DashboardActiveUserChart.module.css";

// 화면에서 선택한 기간 이름을 백엔드 API가 사용하는 값으로 바꿔주는 표입니다.
// 예: "주"를 누르면 API에는 period=week 값이 전달됩니다.
const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

// 기간별 차트 설명입니다.
// 일/주/월 모두 00시~23시 축을 유지해서 어느 시간대에 사용자가 몰리는지 확인할 수 있게 합니다.
const periodDescription = {
  일: "오늘 00시부터 23시까지 시간대별 활성 사용자 수입니다.",
  주: "최근 7일 동안 같은 시간대별 활성 사용자 수를 평균낸 데이터입니다.",
  월: "최근 4주 동안 같은 시간대별 주 평균 활성 사용자 수를 평균낸 데이터입니다.",
};

// SVG 차트의 기준 크기입니다.
// 실제 화면에서는 CSS로 반응형 크기가 적용되고, SVG 내부 좌표만 이 값을 기준으로 계산합니다.
const CHART_WIDTH = 760;
const CHART_HEIGHT = 260;
const CHART_PADDING = {
  top: 28,
  right: 34,
  bottom: 46,
  left: 46,
};

const formatAverageValue = (value) => {
  const numberValue = Number(value ?? 0);

  if (Number.isInteger(numberValue)) {
    return numberValue.toLocaleString();
  }

  return numberValue.toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

/* ==========================================================================
 * 시간별 활성 사용자 차트
 * --------------------------------------------------------------------------
 * 백엔드에서 기간별로 계산한 시간대별 활성 사용자 데이터를 선형 차트로 보여줍니다.
 *
 * 초보자 설명:
 * - activePeriod는 "일 / 주 / 월" 중 현재 선택된 버튼입니다.
 * - activeUserItems는 백엔드에서 받은 차트 데이터 배열입니다.
 * - useMemo는 차트 좌표 계산처럼 값이 바뀔 때만 다시 계산해도 되는 작업에 사용합니다.
 * - SVG의 polyline은 여러 좌표를 선으로 연결해서 그래프 선을 그리는 태그입니다.
 * ========================================================================== */
export function DashboardActiveUserChart() {
  const [activePeriod, setActivePeriod] = useState("일"); // 현재 선택한 조회 기간입니다.
  const [activeUserItems, setActiveUserItems] = useState([]); // 백엔드에서 받은 시간대별 활성 사용자 데이터입니다.
  const [isLoading, setIsLoading] = useState(false); // API 호출 중인지 표시합니다.
  const [hasError, setHasError] = useState(false); // API 호출 실패 여부를 표시합니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 로그인 토큰입니다.

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    axios
      .get(`${BACKSERVER}/admin/api/dashboard/active-users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          period: periodApiValue[activePeriod], // 선택 기간을 백엔드용 값으로 변환합니다.
        },
      })
      .then((res) => {
        setActiveUserItems(
          Array.isArray(res.data?.items) ? res.data.items : [],
        );
      })
      .catch((error) => {
        console.log(error);
        setActiveUserItems([]);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [BACKSERVER, accessToken, activePeriod]);

  const chartData = useMemo(() => {
    const graphWidth =
      CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const graphHeight =
      CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
    const maxActiveUserCount = Math.max(
      ...activeUserItems.map((item) => Number(item.activeUserCount ?? 0)),
      1,
    );
    const lastIndex = Math.max(activeUserItems.length - 1, 1);

    // 백엔드 데이터를 SVG 좌표로 변환합니다.
    // x는 항목 순서, y는 값의 크기에 따라 계산합니다.
    const points = activeUserItems.map((item, index) => {
      const activeUserCount = Number(item.activeUserCount ?? 0);
      const x = CHART_PADDING.left + (graphWidth / lastIndex) * index;
      const y =
        CHART_PADDING.top +
        graphHeight -
        (activeUserCount / maxActiveUserCount) * graphHeight;

      return {
        label: item.label,
        activeUserCount,
        x,
        y,
      };
    });

    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints =
      points.length > 0
        ? `${CHART_PADDING.left},${CHART_HEIGHT - CHART_PADDING.bottom} ${linePoints} ${
            CHART_WIDTH - CHART_PADDING.right
          },${CHART_HEIGHT - CHART_PADDING.bottom}`
        : "";

    return {
      points,
      linePoints,
      areaPoints,
      maxActiveUserCount,
    };
  }, [activeUserItems]);

  return (
    <section className={`${styles.panel} ${styles.widePanel}`}>
      <div className={styles.panelHead}>
        <h2>시간별 활성 사용자</h2>
        <SegmentedControl
          labels={["일", "주", "월"]}
          selectedLabel={activePeriod}
          onSelect={setActivePeriod}
        />
      </div>

      {isLoading ? (
        <EmptyState
          title="조회 중"
          description="시간대별 활성 사용자 데이터를 불러오고 있습니다."
        />
      ) : hasError ? (
        <EmptyState
          title="조회 실패"
          description="시간대별 활성 사용자 데이터를 불러오지 못했습니다."
        />
      ) : activeUserItems.length === 0 ? (
        <EmptyState
          title="데이터 없음"
          description="선택한 기간에 집계된 활성 사용자 데이터가 없습니다."
        />
      ) : (
        <div className={styles.activeUserChartBox}>
          <p className={styles.activeUserChartDescription}>
            {periodDescription[activePeriod]}
          </p>

          <svg
            className={styles.activeUserChart}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            role="img"
            aria-label={`${activePeriod} 단위 시간대별 활성 사용자 차트`}
          >
            {/* 차트 값을 비교하기 쉽도록 옅은 가로 기준선을 그립니다. */}
            {[0, 1, 2, 3].map((gridIndex) => {
              const y =
                CHART_PADDING.top +
                ((CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) /
                  3) *
                  gridIndex;

              return (
                <line
                  key={gridIndex}
                  className={styles.activeUserGridLine}
                  x1={CHART_PADDING.left}
                  x2={CHART_WIDTH - CHART_PADDING.right}
                  y1={y}
                  y2={y}
                />
              );
            })}

            {/* 선 아래 영역을 옅게 채워서 변화 흐름을 더 잘 보이게 합니다. */}
            <polygon
              className={styles.activeUserArea}
              points={chartData.areaPoints}
            />

            {/* 실제 시간대별 활성 사용자 흐름을 나타내는 선입니다. */}
            <polyline
              className={styles.activeUserLine}
              points={chartData.linePoints}
            />

            {/* 각 지점의 점, 값, 하단 시간 라벨을 표시합니다. */}
            {chartData.points.map((point) => (
              <g key={point.label}>
                <circle
                  className={styles.activeUserPoint}
                  cx={point.x}
                  cy={point.y}
                  r="3.6"
                />
                <text
                  className={styles.activeUserPointValue}
                  x={point.x}
                  y={Math.max(16, point.y - 12)}
                  textAnchor="middle"
                >
                  {formatAverageValue(point.activeUserCount)}
                </text>
                <text
                  className={styles.activeUserAxisLabel}
                  x={point.x}
                  y={CHART_HEIGHT - 18}
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>

          <p className={styles.activeUserChartSummary}>
            최고 시간대 활성 사용자{" "}
            <strong>{formatAverageValue(chartData.maxActiveUserCount)}</strong>
            명
          </p>
        </div>
      )}
    </section>
  );
}
