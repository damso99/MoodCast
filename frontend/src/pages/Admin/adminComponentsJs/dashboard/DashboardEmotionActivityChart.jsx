import { EmptyState } from "../common/EmptyState";
import { AdminPeriodRangeControl } from "../common/AdminPeriodRangeControl";
import { SegmentedControl } from "../common/SegmentedControl";
import styles from "../../adminComponentsCss/dashboard/DashboardEmotionActivityChart.module.css";

const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

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
 * 데이터 조회는 AdminDashboardPage의 통합 API 호출이 담당합니다.
 * 이 컴포넌트는 기간 선택 UI와 전달받은 감정별 활동 데이터 표시만 담당합니다.
 * ========================================================================== */
export function DashboardEmotionActivityChart({
  activePeriod = "일",
  emotionItems = [],
  isLoading = false,
  hasError = false,
  onPeriodChange = () => {},
  onRangeChange = () => {},
}) {
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
   * 통합 API 재조회 중에도 기존 데이터가 있으면 차트 DOM을 유지합니다.
   * 로딩 안내로 즉시 교체하면 일/주/월 탭 전환 순간에 화면이 깜빡일 수 있습니다.
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
            onSelect={onPeriodChange}
          />
          <AdminPeriodRangeControl
            period={periodApiValue[activePeriod]}
            onRangeChange={onRangeChange}
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
