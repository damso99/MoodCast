import { useEffect, useState } from "react";
import axios from "axios";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import { EmptyState } from "../common/EmptyState";
import { useAuthStore } from "../../../../stores/useAuthStore";
import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

const ACTIVITY_PAGE_SIZE = 10;

const getActivityLabel = (activityType) => {
  if (activityType === "JOINED") return "가입";
  if (activityType === "DELETED") return "탈퇴";
  if (activityType === "SUSPENDED") return "정지";
  if (activityType === "RESTORED") return "해제";
  return activityType || "활동";
};

const getActivityMessage = (activity) => {
  const memberName =
    activity.memberName ||
    (activity.memberNickname ? `@${activity.memberNickname}` : "회원");

  if (activity.activityType === "JOINED") {
    return `${memberName}님이 가입했습니다.`;
  }

  if (activity.activityType === "DELETED") {
    return `${memberName}님이 탈퇴했습니다.`;
  }

  if (activity.activityType === "SUSPENDED") {
    return `${memberName}님이 정지되었습니다.`;
  }

  if (activity.activityType === "RESTORED") {
    return `${memberName}님의 정지가 해제되었습니다.`;
  }

  return `${memberName}님의 활동 기록입니다.`;
};

/* ==========================================================================
 * 관리자 대시보드 최근 활동 컴포넌트
 * --------------------------------------------------------------------------
 * 최근 활동 10개와 전체 활동 보기 팝업을 담당합니다.
 *
 * 초보자 설명:
 * - 최근 활동은 화면이 열릴 때 바로 조회합니다.
 * - 전체 활동은 "전체 보기" 버튼을 눌렀을 때만 조회해서 불필요한 API 호출을 줄입니다.
 * - 전체 보기 팝업은 한 페이지에 10개씩 보여줍니다.
 * ========================================================================== */
export function DashboardRecentActivities() {
  const [recentActivities, setRecentActivities] = useState([]); // 대시보드에 바로 보여줄 최근 활동 10개입니다.
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false);
  const [recentActivitiesError, setRecentActivitiesError] = useState(false);
  const [allActivities, setAllActivities] = useState([]); // 전체 보기 팝업에서 사용할 활동 목록입니다.
  const [allActivitiesLoading, setAllActivitiesLoading] = useState(false);
  const [allActivitiesOpen, setAllActivitiesOpen] = useState(false);
  const [allActivitiesPage, setAllActivitiesPage] = useState(1);
  const { accessToken } = useAuthStore();

  const BACKSERVER = (
    import.meta.env.VITE_BACKSERVER || "http://localhost:8080"
  ).replace(/\/$/, "");

  useEffect(() => {
    if (!accessToken) return;

    setRecentActivitiesLoading(true);
    setRecentActivitiesError(false);

    axios
      .get(`${BACKSERVER}/admin/api/dashboard/recent-activities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        const nextActivities = Array.isArray(res.data?.activities)
          ? res.data.activities
          : [];

        setRecentActivities(nextActivities);
      })
      .catch((error) => {
        console.log(error);
        setRecentActivities([]);
        setRecentActivitiesError(true);
      })
      .finally(() => {
        setRecentActivitiesLoading(false);
      });
  }, [BACKSERVER, accessToken]);

  const openAllActivities = () => {
    if (!accessToken) return;

    setAllActivitiesOpen(true);
    setAllActivitiesPage(1);
    setAllActivitiesLoading(true);

    axios
      .get(`${BACKSERVER}/admin/api/dashboard/activities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        const nextActivities = Array.isArray(res.data?.activities)
          ? res.data.activities
          : [];

        setAllActivities(nextActivities);
      })
      .catch((error) => {
        console.log(error);
        setAllActivities([]);
      })
      .finally(() => {
        setAllActivitiesLoading(false);
      });
  };

  const allActivityPageCount = Math.max(
    1,
    Math.ceil(allActivities.length / ACTIVITY_PAGE_SIZE),
  );
  const allActivityStartIndex = (allActivitiesPage - 1) * ACTIVITY_PAGE_SIZE;
  const paginatedAllActivities = allActivities.slice(
    allActivityStartIndex,
    allActivityStartIndex + ACTIVITY_PAGE_SIZE,
  );

  const renderActivityList = (activities, keyPrefix) => (
    <ul className={styles.activityList}>
      {activities.map((activity, index) => (
        <li
          className={styles.activityItem}
          key={`${keyPrefix}-${activity.activityType}-${activity.memberId}-${activity.createdAt}-${index}`}
        >
          <span className={styles.activityBadge}>
            {getActivityLabel(activity.activityType)}
          </span>
          <div className={styles.activityBody}>
            <strong>{getActivityMessage(activity)}</strong>
            <small>
              {formatKoreanDate(activity.createdAt)}
              {activity.adminName ? ` · 처리 관리자 ${activity.adminName}` : ""}
            </small>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>최근 활동</h2>
          <button
            type="button"
            className={styles.textButton}
            onClick={openAllActivities}
          >
            전체 보기
          </button>
        </div>

        {recentActivitiesLoading ? (
          <EmptyState
            title="최근 활동을 불러오는 중입니다"
            description="가입, 탈퇴, 정지, 해제 기록을 확인하고 있습니다."
          />
        ) : recentActivitiesError ? (
          <EmptyState
            title="최근 활동 조회 실패"
            description="백엔드 API 응답을 확인해주세요."
          />
        ) : recentActivities.length === 0 ? (
          <EmptyState
            title="최근 활동 없음"
            description="사용자 활동이 생기면 이 영역에 표시됩니다."
          />
        ) : (
          renderActivityList(recentActivities, "recent")
        )}
      </section>

      {allActivitiesOpen && (
        <section className={styles.activityModalLayer}>
          <button
            type="button"
            className={styles.activityModalDim}
            aria-label="전체 활동 보기 닫기"
            onClick={() => setAllActivitiesOpen(false)}
          />
          <article className={styles.activityModalPanel}>
            <header className={styles.activityModalHead}>
              <h2>전체 활동</h2>
              <button
                type="button"
                className={styles.activityModalClose}
                aria-label="전체 활동 보기 닫기"
                onClick={() => setAllActivitiesOpen(false)}
              >
                <CloseOutlinedIcon fontSize="small" />
              </button>
            </header>

            {allActivitiesLoading ? (
              <EmptyState
                title="전체 활동을 불러오는 중입니다"
                description="잠시만 기다려주세요."
              />
            ) : paginatedAllActivities.length === 0 ? (
              <EmptyState
                title="전체 활동 없음"
                description="표시할 활동 기록이 없습니다."
              />
            ) : (
              renderActivityList(paginatedAllActivities, "all")
            )}

            <nav className={styles.modalPagination} aria-label="전체 활동 페이지">
              <button
                type="button"
                disabled={allActivitiesPage === 1}
                onClick={() =>
                  setAllActivitiesPage(Math.max(1, allActivitiesPage - 1))
                }
              >
                이전
              </button>
              <span>
                {allActivitiesPage} / {allActivityPageCount}
              </span>
              <button
                type="button"
                disabled={allActivitiesPage === allActivityPageCount}
                onClick={() =>
                  setAllActivitiesPage(
                    Math.min(allActivityPageCount, allActivitiesPage + 1),
                  )
                }
              >
                다음
              </button>
            </nav>
          </article>
        </section>
      )}
    </>
  );
}
