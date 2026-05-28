import { useEffect, useState } from "react";
import axios from "axios";
import { EmptyState } from "../common/EmptyState";
import { SegmentedControl } from "../common/SegmentedControl";
import { useAuthStore } from "../../../../stores/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

const periodApiValue = {
  일: "day",
  주: "week",
  월: "month",
};

const emotionMetaItems = [
  { emotionId: 1, label: "행복", color: "#ffcc4d" },
  { emotionId: 2, label: "슬픔", color: "#5b8def" },
  { emotionId: 3, label: "차분함", color: "#36b37e" },
  { emotionId: 4, label: "화남", color: "#ff5630" },
  { emotionId: 5, label: "신나감", color: "#9b5cff" },
  { emotionId: 6, label: "무감정", color: "#8a94a6" },
];

/* ==========================================================================
 * 관리자 대시보드 감정별 활동 분포 컴포넌트
 * --------------------------------------------------------------------------
 * 일/주/월 단위로 감정별 게시글 활동 수를 막대 그래프로 보여줍니다.
 *
 * 초보자 설명:
 * - activityPeriod는 "일", "주", "월" 중 현재 선택된 값입니다.
 * - API에는 한글이 아니라 day/week/month 값을 보내야 하므로 periodApiValue로 변환합니다.
 * - 가장 큰 count를 기준으로 각 막대의 너비를 비율로 계산합니다.
 * ========================================================================== */
export function DashboardEmotionActivityChart() {
  const [activityPeriod, setActivityPeriod] = useState("일"); // 현재 선택한 조회 기간입니다.
  const [emotionActivityItems, setEmotionActivityItems] = useState([]); // API에서 받은 감정별 활동 수입니다.
  const [isLoading, setIsLoading] = useState(false); // API 호출 중인지 표시합니다.
  const [hasError, setHasError] = useState(false); // API 조회 실패 여부입니다.
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setHasError(false);

    axios
      .get(`${BACKSERVER}/admin/api/dashboard/emotion-activity`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          period: periodApiValue[activityPeriod],
        },
      })
      .then((res) => {
        const nextItems = Array.isArray(res.data?.items) ? res.data.items : [];

        setEmotionActivityItems(nextItems);
      })
      .catch((error) => {
        console.log(error);
        setEmotionActivityItems([]);
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [BACKSERVER, accessToken, activityPeriod]);

  const emotionBars = emotionMetaItems.map((emotionMeta) => {
    const matchedItem = emotionActivityItems.find(
      (item) => Number(item.emotionId) === emotionMeta.emotionId,
    );

    return {
      ...emotionMeta,
      count: Number(matchedItem?.activityCount ?? 0),
    };
  });
  const maxEmotionCount = Math.max(...emotionBars.map((item) => item.count), 1);

  return (
    <section className={`${styles.panel} ${styles.widePanel}`}>
      <div className={styles.panelHead}>
        <h2>감정별 활동 분포</h2>
        <SegmentedControl
          labels={["일", "주", "월"]}
          selectedLabel={activityPeriod}
          onSelect={setActivityPeriod}
        />
      </div>

      {isLoading ? (
        <EmptyState
          title="감정별 활동을 불러오는 중입니다"
          description="선택한 기간의 게시글 활동을 집계하고 있습니다."
        />
      ) : hasError ? (
        <EmptyState
          title="감정별 활동 조회 실패"
          description="백엔드 API 응답을 확인해주세요."
        />
      ) : (
        <div className={styles.barChart}>
          {emotionBars.map((emotionItem) => (
            <div className={styles.barRow} key={emotionItem.emotionId}>
              <span className={styles.barLabel}>{emotionItem.label}</span>
              <div className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{
                    width: `${(emotionItem.count / maxEmotionCount) * 100}%`,
                    backgroundColor: emotionItem.color,
                  }}
                />
              </div>
              <strong className={styles.barValue}>
                {emotionItem.count.toLocaleString()}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
