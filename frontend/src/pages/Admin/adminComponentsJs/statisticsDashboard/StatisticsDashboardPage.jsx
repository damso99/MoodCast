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
  top: 28,
  right: 34,
  bottom: 46,
  left: 46,
};

const periodOptions = [
  { label: "일", value: "day" },
  { label: "주", value: "week" },
  { label: "월", value: "month" },
];

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

function readTrendValue(item) {
  return Number(
    item?.value ??
      item?.count ??
      item?.activityCount ??
      item?.postCount ??
      item?.commentCount ??
      item?.empathyCount ??
      0,
  );
}

function getCurrentPeriodOption(selectedLabel) {
  return periodOptions.find((option) => option.label === selectedLabel) || periodOptions[0];
}

function buildLineChartPoints(items) {
  /*
   * SVG 선 그래프 좌표 계산
   * ------------------------------------------------------------------------
   * 초보자 설명:
   * - SVG는 왼쪽 위가 x=0, y=0입니다.
   * - 값이 클수록 그래프에서는 위로 올라가야 하므로 y 좌표를 반대로 계산합니다.
   * - items 배열의 value를 기준으로 각 점의 x/y 좌표를 만들어 <polyline>에 전달합니다.
   */
  const graphWidth = chartWidth - chartPadding.left - chartPadding.right;
  const graphHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const values = items.map((item) => Number(item.value || item.activeUserCount || 0));
  const rawMaxValue = Math.max(...values, 0);
  const hasData = rawMaxValue > 0;
  const maxValue = hasData ? Math.max(Math.ceil(rawMaxValue / 4) * 4, 4) : 4;
  const ySteps = hasData
    ? [
        maxValue,
        Math.round(maxValue * 0.75),
        Math.round(maxValue * 0.5),
        Math.round(maxValue * 0.25),
        0,
      ]
    : [4, 3, 2, 1, 0];
  const lastIndex = Math.max(items.length - 1, 1);

  const points = items.map((item, index) => {
    const value = Number(item.value || item.activeUserCount || 0);
    const x = chartPadding.left + (graphWidth / lastIndex) * index;
    const y = chartPadding.top + graphHeight - (value / maxValue) * graphHeight;

    return {
      x,
      y,
      label: item.label,
      value,
    };
  });

  return {
    hasData,
    maxValue,
    ySteps,
    points,
    peakPoint: points.reduce(
      (peak, point) => (point.value > peak.value ? point : peak),
      points[0] || { value: 0 },
    ),
  };
}

function PreviewLineChart({ items, color, emptyLabel }) {
  const chart = buildLineChartPoints(items);
  const points = chart.points;
  const visibleAxisPoints = points.filter(
    (_, index) => points.length <= 8 || index % 3 === 0 || index === points.length - 1,
  );
  const evenAxisPoints = visibleAxisPoints.map((point, index) => {
    const graphWidth = chartWidth - chartPadding.left - chartPadding.right;
    const lastVisibleIndex = Math.max(visibleAxisPoints.length - 1, 1);

    return {
      ...point,
      x: chartPadding.left + (graphWidth / lastVisibleIndex) * index,
    };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints =
    points.length > 0
      ? `${chartPadding.left},${chartHeight - chartPadding.bottom} ${linePoints} ${
          chartWidth - chartPadding.right
        },${chartHeight - chartPadding.bottom}`
      : "";

  if (items.length === 0) {
    return <div className={styles.emptyChartState}>{emptyLabel}</div>;
  }

  return (
    <div className={styles.lineChartWrap}>
      <svg
        className={styles.previewLineChart}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="통계 선 그래프"
      >
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
                {formatNumber(step)}
              </text>
            </g>
          );
        })}

        <polygon
          className={styles.chartArea}
          points={areaPoints}
          style={{ fill: `${color}18` }}
        />
        <polyline
          className={styles.chartLine}
          points={linePoints}
          style={{ stroke: color || "#3293ff" }}
        />

        {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              {chart.hasData && (
                <g className={styles.chartPointGroup}>
                  <line
                    className={styles.chartHoverLine}
                    x1={point.x}
                    x2={point.x}
                    y1={chartPadding.top}
                    y2={chartHeight - chartPadding.bottom}
                  />
                  <circle
                    className={
                      point === chart.peakPoint ? styles.peakPoint : styles.chartPoint
                    }
                    cx={point.x}
                    cy={point.y}
                    r={point === chart.peakPoint ? 5 : 4}
                  />
                  <rect
                    className={styles.chartHitArea}
                    x={point.x - 24}
                    y={chartPadding.top - 12}
                    width="48"
                    height={chartHeight - chartPadding.top - chartPadding.bottom + 24}
                  />
                  <g className={styles.chartTooltip}>
                    <rect
                      x={Math.min(Math.max(point.x - 30, 8), chartWidth - 68)}
                      y={Math.max(point.y - 31, 10)}
                      width="60"
                      height="20"
                      rx="10"
                    />
                    <text
                      x={Math.min(Math.max(point.x, 38), chartWidth - 38)}
                      y={Math.max(point.y - 17, 24)}
                    >
                      {formatNumber(point.value)}
                    </text>
                  </g>
                </g>
              )}
            </g>
        ))}
        {evenAxisPoints.map((point) => (
          <text
            className={styles.chartAxisLabel}
            key={`label-${point.label}`}
            x={point.x}
            y={chartHeight - 8}
            textAnchor="middle"
          >
            {point.label}
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
 * ========================================================================== */
export function StatisticsDashboardPage() {
  const [periodLabel, setPeriodLabel] = useState("일"); // 화면에서 선택된 기간 라벨입니다. "일", "주", "월" 중 하나입니다.
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" }); // 선택한 일/주/월 기간의 시작일과 종료일입니다.
  const [summary, setSummary] = useState(emptySummary); // 상단 카드와 하단 요약에 표시할 숫자 데이터입니다.
  const [subscriberTrend, setSubscriberTrend] = useState([]); // 가입자 추이 선 그래프 데이터입니다.
  const [activeUserTrend, setActiveUserTrend] = useState([]); // 시간별 활성 사용자 선 그래프 데이터입니다.
  const [contentActivity, setContentActivity] = useState([]); // 게시글/댓글/공감 막대 그래프 데이터입니다.
  const [emotionActivity, setEmotionActivity] = useState([]); // 감정별 활동 막대 그래프 데이터입니다.
  const [loading, setLoading] = useState(false); // 여러 통계 API를 불러오는 중인지 저장합니다.
  const { accessToken } = useAuthStore(); // 관리자 API 호출에 필요한 로그인 토큰입니다.

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";
  const currentPeriod = getCurrentPeriodOption(periodLabel);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    setLoading(true);

    const requestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        period: currentPeriod.value,
        ...dateRange,
      },
    };

    /*
     * 통계 API 병렬 호출
     * ----------------------------------------------------------------------
     * 초보자 설명:
     * - Promise.all은 여러 API 요청을 동시에 실행하고, 모두 끝난 뒤 다음 then을 실행합니다.
     * - 통계 화면은 서로 다른 차트가 같은 기간 데이터를 사용하므로 한 번에 같이 가져오는 편이 빠릅니다.
     */
    Promise.all([
      axios.get(`${BACKSERVER}/admin/api/statistics/summary`, requestConfig),
      axios.get(`${BACKSERVER}/admin/api/statistics/subscribers`, requestConfig),
      axios.get(`${BACKSERVER}/admin/api/dashboard/active-users`, requestConfig),
      axios.get(`${BACKSERVER}/admin/api/statistics/content-activity`, requestConfig),
      axios.get(`${BACKSERVER}/admin/api/dashboard/emotion-activity`, requestConfig),
    ])
      .then(
        ([
          summaryResponse,
          subscriberResponse,
          activeUserResponse,
          contentActivityResponse,
          emotionActivityResponse,
        ]) => {
          setSummary(summaryResponse.data || emptySummary);
          setSubscriberTrend(Array.isArray(subscriberResponse.data?.items) ? subscriberResponse.data.items : []);
          setActiveUserTrend(Array.isArray(activeUserResponse.data?.items) ? activeUserResponse.data.items : []);
          setContentActivity(
            Array.isArray(contentActivityResponse.data?.items) ? contentActivityResponse.data.items : [],
          );
          setEmotionActivity(
            Array.isArray(emotionActivityResponse.data?.items) ? emotionActivityResponse.data.items : [],
          );
        },
      )
      .catch((error) => {
        console.log("[ADMIN_STATISTICS_DASHBOARD_ERROR]", error);
        setSummary(emptySummary);
        setSubscriberTrend([]);
        setActiveUserTrend([]);
        setContentActivity([]);
        setEmotionActivity([]);
      })
      .finally(() => {
        setLoading(false);
      });
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
        helperText: "로그인 기록 기준",
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
      {
        label: "공감 수",
        value: summary.empathyCount,
        helperText: `${periodLabel} 단위 반응`,
        icon: <AddOutlinedIcon />,
        accent: "orange",
      },
    ],
    [periodLabel, summary],
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

      <section className={styles.metricGrid}>
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
          <PreviewLineChart
            items={subscriberTrend}
            color="#3293ff"
            emptyLabel="가입자 추이 데이터가 없습니다."
          />
        </ChartCard>

        <ChartCard
          title={`시간별 활성 사용자 (${periodLabel})`}
          loading={loading}
        >
          <PreviewLineChart
            items={activeUserTrend}
            color="#3293ff"
            emptyLabel="활성 사용자 데이터가 없습니다."
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

      <section className={styles.compactSummaryGrid}>
        <article>
          <ArticleOutlinedIcon />
          <div>
            <span>게시글</span>
            <strong>{loading ? "-" : formatNumber(summary.postCount)}</strong>
          </div>
        </article>
        <article>
          <ChatBubbleOutlineOutlinedIcon />
          <div>
            <span>댓글</span>
            <strong>{loading ? "-" : formatNumber(summary.commentCount)}</strong>
          </div>
        </article>
        <article>
          <AddOutlinedIcon />
          <div>
            <span>공감</span>
            <strong>{loading ? "-" : formatNumber(summary.empathyCount)}</strong>
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}
