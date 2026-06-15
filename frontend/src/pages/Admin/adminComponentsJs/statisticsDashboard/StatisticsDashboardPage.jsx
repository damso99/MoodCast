import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SpaIcon from "@mui/icons-material/Spa";
import MoodBadIcon from "@mui/icons-material/MoodBad";
import CelebrationIcon from "@mui/icons-material/Celebration";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import { AdminLayout } from "../common/AdminLayout";
import { AdminPeriodRangeControl } from "../common/AdminPeriodRangeControl";
import { MetricCard } from "../common/MetricCard";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/statisticsDashboard/StatisticsDashboardPage.module.css";

const chartWidth = 760;
const chartHeight = 260;
const chartPadding = {
  top: 44,
  right: 32,
  bottom: 58,
  left: 62,
};

const chartTooltipWidth = 150;
const chartTooltipHeight = 78;
const chartHours = Array.from({ length: 25 }, (_, hour) => hour);
const visibleHourLabels = new Set([0, 4, 8, 12, 16, 20, 24]);
const weekdayLabels = ["월", "화", "수", "목", "금", "토", "일"];
const monthLabels = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const serviceStartYear = 2026;
const weekdayTooltipLabels = {
  월: "월요일",
  화: "화요일",
  수: "수요일",
  목: "목요일",
  금: "금요일",
  토: "토요일",
  일: "일요일",
};

const periodOptions = [
  { label: "일", value: "day" },
  { label: "주", value: "week" },
  { label: "월", value: "month" },
];
const STATISTICS_POLLING_INTERVAL_MS = 30000;

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

const emptySummary = {
  totalMemberCount: 0,
  newMemberCount: 0,
  activeUserCount: 0,
  postCount: 0,
  commentCount: 0,
  empathyCount: 0,
};

const contentColors = {
  게시글: "#7c4dff",
  댓글: "#9b6dff",
  공감: "#c04dff",
};

const contentIconMap = {
  게시글: ArticleOutlinedIcon,
  댓글: ChatBubbleOutlineOutlinedIcon,
  공감: AddOutlinedIcon,
};

const defaultContentBars = ["게시글", "댓글", "공감"];

const emotionMetaMap = {
  1: { label: "행복", color: "#FFD700", icon: EmojiEmotionsIcon },
  2: { label: "슬픔", color: "#4A90E2", icon: SentimentDissatisfiedIcon },
  3: { label: "차분함", color: "#F4A460", icon: SpaIcon },
  4: { label: "화남", color: "#E74C3C", icon: MoodBadIcon },
  5: { label: "신남", color: "#FF69B4", icon: CelebrationIcon },
  6: { label: "무감정", color: "#95A5A6", icon: SentimentNeutralIcon },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatChartValue(value) {
  return formatNumber(Math.round(Number(value || 0)));
}

function readTrendValue(item) {
  return Number(
    item?.value ??
      item?.count ??
      item?.activityCount ??
      item?.activeUserCount ??
      item?.postCount ??
      item?.commentCount ??
      item?.empathyCount ??
      0,
  );
}

function getCurrentPeriodOption(selectedLabel) {
  return periodOptions.find((option) => option.label === selectedLabel) || periodOptions[0];
}

function formatPercentage(value, total) {
  if (!total) {
    return "0.0%";
  }

  return `${((Number(value || 0) / total) * 100).toFixed(1)}%`;
}

function formatHourTooltipLabel(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function getHourFromLabel(label) {
  const text = String(label ?? "").trim();
  const hourMatch = text.match(/^(\d{1,2})(?:시|:00)?$/);

  if (!hourMatch) {
    return null;
  }

  return Number(hourMatch[1]);
}

function buildHourlyTrendItems(items) {
  const valueByHour = new Map();

  items.forEach((item) => {
    const hour = getHourFromLabel(item.label);

    if (hour === null) {
      return;
    }

    valueByHour.set(hour, readTrendValue(item));
  });

  return chartHours.map((hour) => ({
    label: `${String(hour).padStart(2, "0")}시`,
    value: hour === 24 ? 0 : valueByHour.get(hour) ?? 0,
  }));
}

function buildFixedLabelTrendItems(items, labels) {
  const valueByLabel = new Map();

  items.forEach((item) => {
    const label = String(item.label ?? "").trim();

    if (!label) {
      return;
    }

    valueByLabel.set(label, readTrendValue(item));
  });

  return labels.map((label) => ({
    label,
    value: valueByLabel.get(label) ?? 0,
  }));
}

function buildPeriodTrendItems(items, periodLabel) {
  if (periodLabel === "주") {
    return buildFixedLabelTrendItems(items, weekdayLabels);
  }

  if (periodLabel === "월") {
    return buildFixedLabelTrendItems(items, monthLabels);
  }

  return buildHourlyTrendItems(items);
}

function formatPeriodTooltipLabel(label, periodLabel) {
  if (periodLabel === "주") {
    return weekdayTooltipLabels[label] ?? label ?? "-";
  }

  if (periodLabel === "월") {
    return label || "-";
  }

  const hour = getHourFromLabel(label);

  return hour === null ? label || "-" : formatHourTooltipLabel(hour);
}

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildPreviousYearRange(range) {
  if (!range.startDate || !range.endDate) {
    return null;
  }

  const currentStart = new Date(`${range.startDate}T00:00:00`);

  if (Number.isNaN(currentStart.getTime())) {
    return null;
  }

  const previousYear = currentStart.getFullYear() - 1;

  if (previousYear < serviceStartYear) {
    return null;
  }

  const previousYearStart = new Date(previousYear, 0, 1);
  const previousYearEnd = new Date(previousYear, 11, 31);

  return {
    startDate: formatDateInputValue(previousYearStart),
    endDate: formatDateInputValue(previousYearEnd),
  };
}

function calculateGrowthRate(currentValue, previousValue) {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatGrowthRate(value) {
  if (value === null || value === undefined) {
    return "전년 데이터 없음";
  }

  if (value > 0) {
    return `전년 대비 +${value}%`;
  }

  if (value < 0) {
    return `전년 대비 ${value}%`;
  }

  return "전년 대비 0%";
}

function buildBarChartItems(items, periodLabel) {
  const graphWidth = chartWidth - chartPadding.left - chartPadding.right;
  const graphHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartItems = buildPeriodTrendItems(items, periodLabel);
  const values = chartItems.map((item) => Number(item.value || 0));
  const rawMaxValue = Math.max(...values, 0);
  const hasData = rawMaxValue > 0;
  const maxValue = hasData ? Math.max(Math.ceil(rawMaxValue / 5) * 5 + 5, 5) : 5;
  const ySteps = hasData
    ? [
        maxValue,
        maxValue * 0.8,
        maxValue * 0.6,
        maxValue * 0.4,
        maxValue * 0.2,
        0,
      ]
    : [5, 4, 3, 2, 1, 0];
  const slotWidth = chartItems.length ? graphWidth / chartItems.length : graphWidth;
  const barWidth = Math.max(8, Math.min(26, slotWidth * 0.56));
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  const bars = chartItems.map((item, index) => {
    const value = Number(item.value || 0);
    const x = chartPadding.left + slotWidth * index + slotWidth / 2;
    const y = hasData
      ? chartPadding.top + graphHeight - (value / maxValue) * graphHeight
      : chartPadding.top + graphHeight;
    const height = chartHeight - chartPadding.bottom - y;
    const hour = getHourFromLabel(item.label);
    const showAxisLabel =
      periodLabel !== "일" || (hour !== null && visibleHourLabels.has(hour));

    return {
      index,
      x,
      y,
      height,
      barX: x - barWidth / 2,
      barWidth,
      hitX: chartPadding.left + slotWidth * index,
      hitWidth: slotWidth,
      label: item.label,
      axisLabel: showAxisLabel ? item.label : "",
      tooltipLabel: formatPeriodTooltipLabel(item.label, periodLabel),
      value,
      percentage: formatPercentage(value, totalValue),
    };
  });

  return {
    hasData,
    maxValue,
    ySteps,
    totalValue,
    bars,
  };
}

function PreviewTimeBarChart({ items, color = "#7c4dff", emptyLabel, periodLabel = "일", unit = "" }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chart = buildBarChartItems(items, periodLabel);
  const bars = chart.bars;
  const activePoint = hoveredPoint;
  const tooltipX = activePoint
    ? Math.min(
        Math.max(activePoint.x - chartTooltipWidth / 2, 8),
        chartWidth - chartTooltipWidth - 8,
      )
    : 0;
  const tooltipY = activePoint
    ? Math.max(activePoint.y - chartTooltipHeight - 34, 8)
    : 0;

  if (bars.length === 0) {
    return <div className={styles.emptyChartState}>{emptyLabel}</div>;
  }

  return (
    <div className={styles.lineChartWrap}>
      <svg
        className={styles.previewLineChart}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="통계 막대 그래프"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="statisticsLineChartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {chart.ySteps.map((step, gridIndex) => {
          const y =
            chartPadding.top +
            ((chartHeight - chartPadding.top - chartPadding.bottom) /
              (chart.ySteps.length - 1)) *
            gridIndex;

          return (
            <g key={`${step}-${gridIndex}`}>
              <line
                className={styles.chartGridLine}
                x1={chartPadding.left}
                x2={chartWidth - chartPadding.right}
                y1={y}
                y2={y}
              />
              <text className={styles.chartYAxisLabel} x="14" y={y + 5}>
                {formatNumber(Math.round(step))}
              </text>
            </g>
          );
        })}

        {bars.map((point, index) => (
            <g key={`${point.label}-${index}`}>
                <g className={styles.chartPointGroup} onMouseEnter={() => setHoveredPoint(point)}>
                  <rect
                    className={styles.chartBar}
                    x={point.barX}
                    y={point.height > 0 ? point.y : chartHeight - chartPadding.bottom - 2}
                    width={point.barWidth}
                    height={Math.max(point.height, 2)}
                    rx="6"
                    style={{ fill: color }}
                  />
                  {point.value > 0 ? (
                  <text
                    className={styles.chartValueLabel}
                    x={point.x}
                    y={Math.max(point.y - 14, 18)}
                  >
                    {formatChartValue(point.value)}
                  </text>
                  ) : null}
                  <rect
                    className={styles.chartHitArea}
                    x={point.hitX}
                    y={chartPadding.top - 12}
                    width={point.hitWidth}
                    height={chartHeight - chartPadding.top - chartPadding.bottom + 24}
                  />
                </g>
            </g>
        ))}

        {activePoint ? (
          <g className={styles.chartOverlay}>
            <line
              className={styles.chartActiveHoverLine}
              x1={activePoint.x}
              x2={activePoint.x}
              y1={chartPadding.top}
              y2={chartHeight - chartPadding.bottom}
            />
            <rect
              className={styles.chartActiveBar}
              x={activePoint.barX}
              y={activePoint.height > 0 ? activePoint.y : chartHeight - chartPadding.bottom - 2}
              width={activePoint.barWidth}
              height={Math.max(activePoint.height, 2)}
              rx="6"
            />
            <g
              className={styles.chartTooltip}
              style={{ opacity: 1 }}
              transform={`translate(${tooltipX} ${tooltipY})`}
            >
              <rect width={chartTooltipWidth} height={chartTooltipHeight} rx="14" />
              <text x={chartTooltipWidth / 2} y="24">{activePoint.tooltipLabel}</text>
              <text className={styles.chartTooltipValue} x={chartTooltipWidth / 2} y="48">
                {formatChartValue(activePoint.value)}
                {unit}
              </text>
              <text className={styles.chartTooltipSubtext} x={chartTooltipWidth / 2} y="66">
                전체 대비 {activePoint.percentage}
              </text>
            </g>
          </g>
        ) : null}

        {bars.map((point) => (
          <text
            className={styles.chartAxisLabel}
            key={`label-${point.label}-${point.index}`}
            x={point.x}
            y={chartHeight - 16}
            textAnchor="middle"
          >
            {point.axisLabel}
          </text>
        ))}
      </svg>

    </div>
  );
}
function PreviewBarChart({ items, maxRows }) {
  const displayItems = items
    .filter((item) => String(item.label || "").trim())
    .slice(0, maxRows || items.length);
  const maxValue = Math.max(
    ...displayItems.map((item) => Number(item.value || 0)),
    1,
  );

  return (
    <div className={styles.previewBarChart}>
      {displayItems.map((item) => {
        const rawValue = Number(item.value || 0);
        const widthPercent =
          rawValue === 0
            ? 1
            : Math.max(6, Math.round((rawValue / maxValue) * 100));
        const Icon = item.icon;

        return (
          <div className={styles.previewBarRow} key={item.label}>
            <span>
              {Icon && <Icon className={styles.barLabelIcon} />}
              {item.label}
            </span>
            <div className={styles.previewBarTrack}>
              <div
                className={styles.previewBarFill}
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <strong>{formatNumber(item.value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function ChartCard({ title, description, loading, children }) {
  return (
    <article className={styles.chartCard}>
      <div className={styles.chartCardHead}>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {loading ? <div className={styles.emptyChartState}>통계 데이터를 불러오는 중입니다.</div> : children}
    </article>
  );
}

/* ==========================================================================
 * 통계 대시보드 페이지
 * --------------------------------------------------------------------------
 * 가입자, 활성 사용자, 게시글, 댓글, 공감 데이터를 차트 중심으로 정리해서 보여줍니다.
 *
 * 큰 흐름:
 * 1. 관리자가 일/주/월 기간을 선택합니다.
 * 2. 선택한 기간 값을 백엔드 통계 API에 전달합니다.
 * 3. API 응답을 카드, 선 그래프, 막대 그래프에 맞는 배열로 변환합니다.
 * 4. 데이터가 없거나 조회 중이어도 화면이 비어 보이지 않도록 안내 문구를 표시합니다.
 *
 * 관리자 기능 담당 작업(문건우) TODO:
 * 현재 화면은 주요 지표를 조회하고 시각화하는 "통계 대시보드"입니다.
 * PDF/Excel 다운로드, 서비스 리포트 생성, 상세 분석 리포트가 필요하면
 * 별도 리포트 API와 파일 생성 방식을 정한 뒤 후순위 기능으로 추가합니다.
 * ========================================================================== */
export function StatisticsDashboardPage() {
  const [periodLabel, setPeriodLabel] = useState("일"); // 화면에서 선택된 기간 라벨입니다. "일", "주", "월" 중 하나입니다.
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" }); // 선택한 일/주/월 기간의 시작일과 종료일입니다.
  const [summary, setSummary] = useState(emptySummary); // 상단 카드와 하단 요약에 표시할 숫자 데이터입니다.
  const [subscriberTrend, setSubscriberTrend] = useState([]); // 가입자 추이 막대 그래프 데이터입니다.
  const [activeUserTrend, setActiveUserTrend] = useState([]); // 시간별 활성 사용자 막대 그래프 데이터입니다.
  const [contentActivity, setContentActivity] = useState([]); // 게시글/댓글/공감 막대 그래프 데이터입니다.
  const [emotionActivity, setEmotionActivity] = useState([]); // 감정별 활동 막대 그래프 데이터입니다.
  const [activeUserGrowthRate, setActiveUserGrowthRate] = useState(null); // 선택 연도 활성 사용자 전년 대비 성장률입니다.
  const [loading, setLoading] = useState(false); // 여러 통계 API를 불러오는 중인지 저장합니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 로그인 토큰입니다.

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
  const currentPeriod = getCurrentPeriodOption(periodLabel);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    const controllers = new Set();
    let previousYearSummaryData = null;

    const fetchAllStatistics = async ({ showLoading = false } = {}) => {
      if (!isMounted) {
        return;
      }

      if (!isDateRangeReadyForPeriod(currentPeriod.value, dateRange)) {
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      controllers.add(controller);

      if (showLoading) {
        setLoading(true);
      }

      const requestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          period: currentPeriod.value,
          ...dateRange,
        },
        signal: controller.signal,
      };
      const previousYearRange =
        currentPeriod.value === "month" ? buildPreviousYearRange(dateRange) : null;

      /*
       * 월 탭의 전년 대비 값은 선택 연도와 비교 대상 연도가 바뀔 때만 다시 조회합니다.
       * 30초 폴링마다 전년 데이터까지 반복 조회하면 실제 화면 변화 가능성보다 요청 비용이 커집니다.
       * 탭 전환으로 현재 요청 묶음이 무효화되면 취소 응답이 최신 화면 상태를 변경하지 않도록 아래 catch에서 빠져나갑니다.
       */
      if (showLoading && previousYearRange) {
        try {
          const previousYearSummaryResponse = await axios.get(
            `${BACKSERVER}/admin/api/statistics/summary`,
            {
              headers: requestConfig.headers,
              params: {
                period: currentPeriod.value,
                ...previousYearRange,
              },
              signal: controller.signal,
            },
          );
          previousYearSummaryData = previousYearSummaryResponse.data || null;
        } catch (error) {
          if (!isMounted || isCanceledRequest(error)) {
            controllers.delete(controller);

            if (showLoading && isMounted) {
              setLoading(false);
            }

            return;
          }

          previousYearSummaryData = null;
        }
      }

      /*
       * 통계 대시보드 통합 API 조회
       * ----------------------------------------------------------------------
       * 기존 구조:
       * - 프론트가 요약/가입자 추이/활성 사용자/콘텐츠 활동/감정 활동 API를 각각 호출했습니다.
       * - 이 호출 묶음이 폴링마다 반복되어 브라우저 요청 수와 서버 진입 요청 수가 함께 늘었습니다.
       *
       * 변경 구조:
       * - 프론트는 /admin/api/statistics/dashboard 통합 API 1개만 호출합니다.
       * - 서버가 기존 통계 조회 로직을 내부에서 실행한 뒤 하나의 응답 객체로 묶어 반환합니다.
       * - 서버 통합 API에는 Redis TTL 캐시가 적용되어 같은 기간 조건의 반복 폴링이 DB 집계를 매번 실행하지 않습니다.
       *
       * 참고:
       * - 월 탭의 전년 대비 계산에 필요한 이전 연도 summary만 초기 로딩 시 별도로 조회합니다.
       * - 해당 조회는 폴링 대상이 아니므로 30초마다 반복 호출되지 않습니다.
       * - period와 dateRange가 맞지 않는 전환 중 요청은 실행하지 않습니다.
       * - 이전 요청은 AbortController로 취소해 늦은 실패 응답이 최신 성공 데이터를 덮어쓰지 못하게 합니다.
       */
      try {
        const response = await axios.get(
          `${BACKSERVER}/admin/api/statistics/dashboard`,
          requestConfig,
        );

        if (!isMounted) {
          return;
        }

        const data = response.data || {};
        const nextSummary = data.summary || emptySummary;

        setSummary(nextSummary);
        setSubscriberTrend(
          Array.isArray(data.subscriberTrend) ? data.subscriberTrend : [],
        );
        setActiveUserTrend(
          Array.isArray(data.activeUserTrend) ? data.activeUserTrend : [],
        );
        setContentActivity(
          Array.isArray(data.contentActivity) ? data.contentActivity : [],
        );
        setEmotionActivity(
          Array.isArray(data.emotionActivity) ? data.emotionActivity : [],
        );

        if (currentPeriod.value !== "month") {
          setActiveUserGrowthRate(null);
        } else if (previousYearSummaryData) {
          setActiveUserGrowthRate(
            calculateGrowthRate(
              nextSummary.activeUserCount,
              previousYearSummaryData.activeUserCount,
            ),
          );
        } else if (showLoading) {
          setActiveUserGrowthRate(null);
        }
      } catch (error) {
        if (!isMounted || isCanceledRequest(error)) {
          return;
        }

        if (showLoading && isMounted) {
          setSummary(emptySummary);
          setSubscriberTrend([]);
          setActiveUserTrend([]);
          setContentActivity([]);
          setEmotionActivity([]);
          setActiveUserGrowthRate(null);
        }
      } finally {
        controllers.delete(controller);

        if (showLoading && isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllStatistics({ showLoading: true });

    /*
     * 통계 대시보드 폴링
     * ----------------------------------------------------------------------
     * 30초마다 통합 API 1개만 재조회합니다.
     * 브라우저 탭이 비활성 상태이면 폴링을 건너뛰고, 다시 활성화될 때 한 번 즉시 조회해 화면을 갱신합니다.
     */
    const pollingId = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }

      fetchAllStatistics({ showLoading: false });
    }, STATISTICS_POLLING_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAllStatistics({ showLoading: false });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(pollingId);
      controllers.forEach((controller) => controller.abort());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [BACKSERVER, accessToken, currentPeriod.value, dateRange]);

  const metricCards = useMemo(
    () => [
      {
        label: "신규 가입자",
        value: summary.newMemberCount,
        helperText: `${periodLabel} 단위 가입`,
        icon: <GroupOutlinedIcon />,
      },
      {
        label: "활성 사용자",
        value: summary.activeUserCount,
        helperText:
          currentPeriod.value === "month"
            ? formatGrowthRate(activeUserGrowthRate)
            : "로그인 기록 기준",
        icon: <BarChartOutlinedIcon />,
        accent: "blue",
      },
      {
        label: "전체 회원",
        value: summary.totalMemberCount,
        helperText: "현재 누적 회원",
        icon: <DashboardOutlinedIcon />,
        accent: "pink",
      },
    ],
    [activeUserGrowthRate, currentPeriod.value, periodLabel, summary],
  );

  const contentBars = useMemo(() => {
    const valueMap = contentActivity.reduce((map, item) => {
      map[item.label] = readTrendValue(item);
      return map;
    }, {});

    return defaultContentBars.map((label, index) => ({
      label,
      value: valueMap[label] ?? readTrendValue(contentActivity[index]),
      color: contentColors[label] || "#7c4dff",
      icon: contentIconMap[label],
    }));
  }, [contentActivity]);

  const emotionBars = useMemo(() => {
    const valueMap = emotionActivity.reduce((map, item) => {
      map[String(item.emotionId)] = Number(item.activityCount || 0);
      return map;
    }, {});

    return Object.entries(emotionMetaMap).map(([emotionId, emotionMeta]) => ({
      label: emotionMeta.label,
      value: valueMap[emotionId] ?? 0,
      color: emotionMeta.color,
      icon: emotionMeta.icon,
    }));
  }, [emotionActivity]);

  return (
    <AdminLayout title="통계 대시보드" description="주요 지표를 기간별 차트로 확인하세요.">
      <section className={styles.toolbar}>
        <div className={styles.toolbarPeriod}>
          <SegmentedControl
            labels={periodOptions.map((option) => option.label)}
            selectedLabel={periodLabel}
            onSelect={setPeriodLabel}
          />
          <AdminPeriodRangeControl
            period={currentPeriod.value}
            onRangeChange={setDateRange}
          />
        </div>
      </section>

      <section
        className={styles.metricGrid}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
      >
        {metricCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={loading ? "-" : formatNumber(card.value)}
            helperText={card.helperText}
            icon={card.icon}
            accent={card.accent}
          />
        ))}
      </section>

      <section className={styles.dashboardGrid}>
        <ChartCard
          title={`가입자 추이 (${periodLabel})`}
          loading={loading}
        >
          <PreviewTimeBarChart
            items={subscriberTrend}
            color="#7c4dff"
            emptyLabel="가입자 추이 데이터가 없습니다."
            periodLabel={periodLabel}
            unit="명"
          />
        </ChartCard>

        <ChartCard
          title={`시간별 활성 사용자 (${periodLabel})`}
          loading={loading}
        >
          <PreviewTimeBarChart
            items={activeUserTrend}
            color="#7c4dff"
            emptyLabel="활성 사용자 데이터가 없습니다."
            periodLabel={periodLabel}
            unit="명"
          />
        </ChartCard>

        <ChartCard
          title={`콘텐츠 활동 (${periodLabel})`}
          loading={loading}
        >
          <PreviewBarChart items={contentBars} maxRows={3} />
        </ChartCard>

        <ChartCard
          title={`감정별 활동 구성 (${periodLabel})`}
          loading={loading}
        >
          <PreviewBarChart items={emotionBars} />
        </ChartCard>
      </section>

    </AdminLayout>
  );
}
