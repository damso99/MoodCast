import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { EmptyState } from "../common/EmptyState";
import { AdminPeriodRangeControl } from "../common/AdminPeriodRangeControl";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/DashboardActiveUserChart.module.css";

const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

const periodDescription = {
  일: "오늘 00시부터 23시까지 시간대별 활성 사용자 수입니다.",
  주: "선택한 주의 월요일부터 일요일까지 일별 활성 사용자 수입니다.",
  월: "선택한 연도의 1월부터 12월까지 월별 활성 사용자 수입니다.",
};

const DASHBOARD_POLLING_INTERVAL_MS = 10000;

const CHART_WIDTH = 780;
const CHART_HEIGHT = 320;
const CHART_LEFT = 72;
const CHART_RIGHT = 728;
const CHART_TOP = 44;
const CHART_BOTTOM = 260;
const CHART_LABEL_Y = 302;
const TOOLTIP_WIDTH = 170;
const TOOLTIP_HEIGHT = 88;
const CHART_HOURS = [0, 4, 8, 12, 16, 20, 24];
const DAY_END_DISPLAY_HOUR = 24;
const DAY_END_SOURCE_HOUR = 23;
const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const WEEKDAY_TOOLTIP_LABELS = {
  월: "월요일",
  화: "화요일",
  수: "수요일",
  목: "목요일",
  금: "금요일",
  토: "토요일",
  일: "일요일",
};

const formatAverageValue = (value) => {
  const numberValue = Number(value ?? 0);

  if (Number.isInteger(numberValue)) {
    return numberValue.toLocaleString("ko-KR");
  }

  return numberValue.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
};

const formatPercentage = (value, total) => {
  if (!total) {
    return "0.0%";
  }

  return `${((Number(value || 0) / total) * 100).toFixed(1)}%`;
};

const formatHourTooltipLabel = (hour) => {
  return `${String(hour).padStart(2, "0")}:00`;
};

const normalizeTooltipLabel = (label) => {
  const text = String(label ?? "").trim();
  const hourMatch = text.match(/^(\d{1,2})(?:시|:00)?$/);

  if (hourMatch) {
    return formatHourTooltipLabel(Number(hourMatch[1]));
  }

  return text || "-";
};

const normalizePeriodTooltipLabel = (label, period) => {
  if (period === "일") {
    return normalizeTooltipLabel(label);
  }

  if (period === "주") {
    return WEEKDAY_TOOLTIP_LABELS[label] ?? label ?? "-";
  }

  return label || "-";
};

const getHourFromLabel = (label) => {
  const text = String(label ?? "").trim();
  const hourMatch = text.match(/^(\d{1,2})(?:시|:00)?$/);

  if (!hourMatch) {
    return null;
  }

  return Number(hourMatch[1]);
};

const buildFourHourChartItems = (items) => {
  const valueByHour = new Map();

  items.forEach((item) => {
    const hour = getHourFromLabel(item.label);

    if (hour === null) {
      return;
    }

    valueByHour.set(hour, Number(item.activeUserCount ?? 0));
  });

  return CHART_HOURS.map((hour) => ({
    label: `${String(hour).padStart(2, "0")}시`,
    /*
     * 24시는 DB에 실제로 저장되는 시간이 아니라 하루의 끝을 나타내는 화면 표시값입니다.
     * 따라서 라벨은 24시로 유지하되, 값은 해당일 마지막 시간대인 23:00~23:59:59 데이터를 사용합니다.
     */
    activeUserCount:
      hour === DAY_END_DISPLAY_HOUR
        ? valueByHour.get(DAY_END_SOURCE_HOUR) ?? valueByHour.get(20) ?? 0
        : valueByHour.get(hour) ?? 0,
  }));
};

const buildFixedLabelChartItems = (items, labels) => {
  const valueByLabel = new Map();

  items.forEach((item) => {
    const label = String(item.label ?? "").trim();

    if (!label) {
      return;
    }

    valueByLabel.set(label, Number(item.activeUserCount ?? 0));
  });

  return labels.map((label) => ({
    label,
    activeUserCount: valueByLabel.get(label) ?? 0,
  }));
};

const buildChartItems = (items, period) => {
  if (period === "일") {
    return buildFourHourChartItems(items);
  }

  if (period === "주") {
    return buildFixedLabelChartItems(items, WEEKDAY_LABELS);
  }

  return buildFixedLabelChartItems(items, MONTH_LABELS);
};

/*
 * 시간별 활성 사용자 차트
 * 데이터 조회 방식은 기존 /admin/api/dashboard/active-users API를 그대로 사용합니다.
 * 아래 로직은 화면 좌표, hover tooltip, 보라색 라인/면적 디자인만 담당합니다.
 */
export function DashboardActiveUserChart() {
  const [activePeriod, setActivePeriod] = useState("일");
  const [activeUserItems, setActiveUserItems] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const fetchActiveUsers = ({ showLoading = false } = {}) => {
      if (showLoading) {
        setIsLoading(true);
      }

      setHasError(false);

      axios
        .get(`${BACKSERVER}/admin/api/dashboard/active-users`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            period: periodApiValue[activePeriod],
            ...dateRange,
          },
        })
        .then((res) => {
          setActiveUserItems(
            Array.isArray(res.data?.items) ? res.data.items : [],
          );
        })
        .catch(() => {
          if (showLoading) {
            setActiveUserItems([]);
            setHasError(true);
          }
        })
        .finally(() => {
          if (showLoading) {
            setIsLoading(false);
          }
        });
    };

    fetchActiveUsers({ showLoading: true });

    const pollingId = window.setInterval(
      fetchActiveUsers,
      DASHBOARD_POLLING_INTERVAL_MS,
    );

    return () => {
      window.clearInterval(pollingId);
    };
  }, [BACKSERVER, accessToken, activePeriod, dateRange]);

  const chartData = useMemo(() => {
    const chartWidth = CHART_RIGHT - CHART_LEFT;
    const chartHeight = CHART_BOTTOM - CHART_TOP;
    const chartItems = buildChartItems(activeUserItems, activePeriod);
    const values = chartItems.map((item) =>
      Number(item.activeUserCount ?? 0),
    );
    const rawMaxValue = Math.max(
      ...activeUserItems.map((item) => Number(item.activeUserCount ?? 0)),
      0,
    );
    const displayMaxValue = Math.max(...values, 0);
    const hasData = displayMaxValue > 0;
    const maxValue = hasData ? Math.max(Math.ceil(displayMaxValue / 5) * 5 + 5, 5) : 5;
    const ySteps = hasData
      ? [maxValue, maxValue * 0.8, maxValue * 0.6, maxValue * 0.4, maxValue * 0.2, 0]
      : [5, 4, 3, 2, 1, 0];
    const lastIndex = Math.max(chartItems.length - 1, 1);
    const totalValue = values.reduce((sum, value) => sum + value, 0);

    const points = chartItems.map((item, index) => {
      const value = Number(item.activeUserCount ?? 0);
      const x =
        chartItems.length === 1
          ? (CHART_LEFT + CHART_RIGHT) / 2
          : CHART_LEFT + (index / lastIndex) * chartWidth;
      const y = hasData
        ? CHART_BOTTOM - (value / maxValue) * chartHeight
        : CHART_BOTTOM;

      return {
        index,
        label: item.label,
        tooltipLabel: normalizePeriodTooltipLabel(item.label, activePeriod),
        value,
        x,
        y,
        percentage: formatPercentage(value, totalValue),
      };
    });

    const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
    const areaPoints =
      points.length > 0
        ? `${CHART_LEFT},${CHART_BOTTOM} ${linePoints} ${CHART_RIGHT},${CHART_BOTTOM}`
        : "";

    return {
      points,
      linePoints,
      areaPoints,
      hasData,
      maxValue,
      ySteps,
      totalValue,
      maxDisplayValue: rawMaxValue,
    };
  }, [activePeriod, activeUserItems]);

  const activePoint = hoveredPoint;
  const getYByValue = (value) =>
    chartData.hasData
      ? CHART_BOTTOM - (Number(value || 0) / chartData.maxValue) * (CHART_BOTTOM - CHART_TOP)
      : CHART_BOTTOM;
  const tooltipX = activePoint
    ? Math.min(Math.max(activePoint.x - TOOLTIP_WIDTH / 2, 8), CHART_WIDTH - TOOLTIP_WIDTH - 8)
    : 0;
  const tooltipY = activePoint
    ? Math.max(activePoint.y - TOOLTIP_HEIGHT - 38, 8)
    : 0;
  const updateLineHover = (event) => {
    if (chartData.points.length === 0) {
      return;
    }

    const svgRect = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    const viewBoxX = ((event.clientX - svgRect.left) / svgRect.width) * CHART_WIDTH;
    const boundedX = Math.min(Math.max(viewBoxX, CHART_LEFT), CHART_RIGHT);
    const pointCount = chartData.points.length;
    const rawIndex =
      ((boundedX - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * (pointCount - 1);
    const beforeIndex = Math.max(0, Math.floor(rawIndex));
    const afterIndex = Math.min(pointCount - 1, Math.ceil(rawIndex));
    const beforePoint = chartData.points[beforeIndex];
    const afterPoint = chartData.points[afterIndex];
    const ratio = afterIndex === beforeIndex ? 0 : rawIndex - beforeIndex;
    const interpolatedValue =
      beforePoint.value + (afterPoint.value - beforePoint.value) * ratio;
    const nearestIndex = Math.min(
      pointCount - 1,
      Math.max(0, Math.round(rawIndex)),
    );
    const nearestPoint = chartData.points[nearestIndex];
    const tooltipLabel =
      activePeriod === "일"
        ? formatHourTooltipLabel(
            Math.round(
              CHART_HOURS[0] +
                ((boundedX - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * 24,
            ),
          )
        : nearestPoint.tooltipLabel;

    setHoveredPoint({
      label: tooltipLabel,
      tooltipLabel,
      value: interpolatedValue,
      x: boundedX,
      y: getYByValue(interpolatedValue),
      percentage: formatPercentage(interpolatedValue, chartData.totalValue),
    });
  };

  return (
    <section className={`${styles.panel} ${styles.widePanel}`}>
      <div className={styles.panelHead}>
        <h2>시간별 활성 사용자</h2>
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
            aria-label={`${activePeriod} 단위 시간별 활성 사용자 차트`}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="dashboardActiveUserGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#7c4dff" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#7c4dff" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {chartData.ySteps.map((step, gridIndex) => {
              const y =
                CHART_TOP +
                ((CHART_BOTTOM - CHART_TOP) / (chartData.ySteps.length - 1)) *
                  gridIndex;

              return (
                <g key={`${step}-${gridIndex}`}>
                  <line
                    className={styles.activeUserGridLine}
                    x1={CHART_LEFT}
                    x2={CHART_RIGHT}
                    y1={y}
                    y2={y}
                  />
                  <text className={styles.activeUserYAxisLabel} x="22" y={y + 5}>
                    {formatAverageValue(Math.round(step))}
                  </text>
                </g>
              );
            })}

            {chartData.areaPoints ? (
              <polygon
                className={styles.activeUserArea}
                points={chartData.areaPoints}
                fill="url(#dashboardActiveUserGradient)"
              />
            ) : null}

            <polyline
              className={styles.activeUserLine}
              points={chartData.linePoints}
            />

            {chartData.points.map((point) => (
              <g
                className={styles.activeUserPointGroup}
                key={`${point.label}-${point.index}`}
              >
                <line
                  className={styles.activeUserHoverLine}
                  x1={point.x}
                  x2={point.x}
                  y1={CHART_TOP}
                  y2={CHART_BOTTOM}
                />
                <circle
                  className={styles.activeUserPoint}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                />
                <text className={styles.activeUserValueLabel} x={point.x} y={Math.max(point.y - 14, 18)}>
                  {formatAverageValue(point.value)}
                </text>
                <rect
                  className={styles.activeUserHitArea}
                  x={point.x - 24}
                  y={CHART_TOP - 12}
                  width="48"
                  height={CHART_BOTTOM - CHART_TOP + 24}
                />
              </g>
            ))}

            <rect
              className={styles.activeUserMoveArea}
              x={CHART_LEFT}
              y={CHART_TOP - 14}
              width={CHART_RIGHT - CHART_LEFT}
              height={CHART_BOTTOM - CHART_TOP + 28}
              onMouseMove={updateLineHover}
            />

            {activePoint ? (
              <g className={styles.activeUserOverlay}>
                <line
                  className={styles.activeUserActiveHoverLine}
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={CHART_TOP}
                  y2={CHART_BOTTOM}
                />
                <circle
                  className={styles.activeUserActivePoint}
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="6"
                />
                <g
                  className={styles.activeUserTooltip}
                  style={{ opacity: 1 }}
                  transform={`translate(${tooltipX} ${tooltipY})`}
                >
                  <rect width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx="14" />
                  <text x={TOOLTIP_WIDTH / 2} y="26">{activePoint.tooltipLabel}</text>
                  <text className={styles.activeUserTooltipValue} x={TOOLTIP_WIDTH / 2} y="53">
                    {formatAverageValue(activePoint.value)}명
                  </text>
                  <text className={styles.activeUserTooltipSubtext} x={TOOLTIP_WIDTH / 2} y="73">
                    전체 대비 {activePoint.percentage}
                  </text>
                </g>
              </g>
            ) : null}

            {chartData.points.map((point) => (
                <text
                  className={styles.activeUserAxisLabel}
                  key={`label-${point.label}-${point.index}`}
                  x={point.x}
                  y={CHART_LABEL_Y}
                >
                  {point.label}
                </text>
              ))}
          </svg>

          <p className={styles.activeUserChartSummary}>
            최고 구간 활성 사용자{" "}
            <strong>{formatAverageValue(chartData.maxDisplayValue)}</strong>
            명
          </p>
        </div>
      )}
    </section>
  );
}
