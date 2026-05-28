import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/userManagement/UserManagementPage.module.css";

/* ==========================================================================
 * 사용자 관리 하단 요약 카드 컴포넌트
 * --------------------------------------------------------------------------
 * 사용자 관리 페이지 아래쪽의 "전체 회원 비율"과 "회원 관리 정보" 영역입니다.
 *
 * 담당 기능:
 * - 일반 회원 / 관리자 회원 / 정지 회원 수를 원형 그래프로 표시
 * - 최근 가입 회원 1명 표시
 * - 최근 제재 회원 1명 표시
 *
 * 초보자 설명:
 * - 부모 컴포넌트(UserManagementPage.jsx)가 API를 호출해서 숫자와 회원 정보를 넘겨줍니다.
 * - 이 컴포넌트는 받은 데이터를 화면에 보기 좋게 그리는 일만 담당합니다.
 * - 정지 회원은 role과 별개로 status가 SUSPENDED인 회원이라 일반/관리자 수와 겹칠 수 있습니다.
 *   그래서 그래프는 세 항목을 같은 원 안에서 비교할 수 있도록 "그래프 항목 합계"를 기준으로 다시 계산합니다.
 * ========================================================================== */
export function UserManagementSummaryCards({
  isLoading,
  hasError,
  totalMemberCount,
  normalMemberCount,
  adminMemberCount,
  suspendedMemberCount,
  latestJoinedMember,
  latestSanctionedMember,
}) {
  /*
   * 원형 그래프 계산 기준
   * ------------------------------------------------------------------------
   * 초보자 설명:
   * - totalMemberCount는 실제 전체 회원 수입니다.
   * - 하지만 정지 회원은 role이 USER이면서 status만 SUSPENDED일 수도 있어 일반 회원 수와 겹칠 수 있습니다.
   * - 원형 그래프에서는 겹친 값을 그대로 전체 회원 수로 나누면 마지막 조각이 잘 안 보일 수 있습니다.
   * - 그래서 그래프 조각은 normal/admin/suspended 세 항목 합계를 기준으로 다시 계산합니다.
   */
  const chartTotal =
    normalMemberCount + adminMemberCount + suspendedMemberCount;

  const getChartPercent = (count) => {
    if (!chartTotal) {
      return 0;
    }

    return Math.round((count / chartTotal) * 100);
  };

  const memberRatioItems = [
    {
      label: "일반 회원",
      count: normalMemberCount,
      color: "#7c4dff",
      percent: getChartPercent(normalMemberCount),
    },
    {
      label: "관리자 회원",
      count: adminMemberCount,
      color: "#12b76a",
      percent: getChartPercent(adminMemberCount),
    },
    {
      label: "정지 회원",
      count: suspendedMemberCount,
      color: "#f04438",
      percent: getChartPercent(suspendedMemberCount),
    },
  ];

  /*
   * conic-gradient 구간 계산
   * ------------------------------------------------------------------------
   * CSS conic-gradient는 0%부터 100%까지 색을 이어 붙여 원형 그래프를 만듭니다.
   * 각 조각의 시작점과 끝점을 누적해서 계산해야 항목이 서로 겹치지 않습니다.
   */
  const firstRatioEnd = memberRatioItems[0].percent;
  const secondRatioEnd = firstRatioEnd + memberRatioItems[1].percent;
  const thirdRatioEnd = Math.min(
    100,
    secondRatioEnd + memberRatioItems[2].percent,
  );
  const ratioChartStyle = {
    background:
      chartTotal > 0
        ? `conic-gradient(
            ${memberRatioItems[0].color} 0% ${firstRatioEnd}%,
            ${memberRatioItems[1].color} ${firstRatioEnd}% ${secondRatioEnd}%,
            ${memberRatioItems[2].color} ${secondRatioEnd}% ${thirdRatioEnd}%,
            #eef2f6 ${thirdRatioEnd}% 100%
          )`
        : "#eef2f6",
  };

  const getMemberDisplayName = (memberItem, fallbackId) => {
    if (!memberItem) {
      return fallbackId ? `회원 #${fallbackId}` : "회원 정보 없음";
    }

    if (memberItem.name) {
      return memberItem.name;
    }

    if (memberItem.nickname) {
      return `@${memberItem.nickname}`;
    }

    return memberItem.memberId
      ? `회원 #${memberItem.memberId}`
      : "회원 정보 없음";
  };

  return (
    <section className={styles.infoGrid}>
      <article className={styles.infoBox}>
        <strong>전체 회원 비율</strong>

        {isLoading && totalMemberCount === 0 ? (
          <p>회원 비율을 불러오는 중입니다.</p>
        ) : (
          <>
            {hasError && (
              <p className={styles.summaryNotice}>
                요약 API 조회 실패로 현재 회원 목록 기준 비율을 표시합니다.
              </p>
            )}

            <div className={styles.ratioContent}>
              <div className={styles.ratioChart} style={ratioChartStyle}>
                <div className={styles.ratioChartCenter}>
                  <span>전체</span>
                  <strong>{totalMemberCount.toLocaleString()}</strong>
                </div>
              </div>

              <ul className={styles.ratioLegend}>
                {memberRatioItems.map((ratioItem) => (
                  <li key={ratioItem.label}>
                    <span
                      className={styles.ratioDot}
                      style={{ backgroundColor: ratioItem.color }}
                    />
                    <span>{ratioItem.label}</span>
                    <strong>
                      {ratioItem.count.toLocaleString()}명 · {ratioItem.percent}%
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </article>

      <article className={styles.infoBox}>
        <strong>회원 관리 정보</strong>

        {isLoading ? (
          <p>회원 관리 정보를 불러오는 중입니다.</p>
        ) : (
          <>
            {hasError && (
              <p className={styles.summaryNotice}>
                요약 API 조회 실패로 일부 정보가 목록 기준으로 표시됩니다.
              </p>
            )}

            <div className={styles.memberInfoList}>
              <div className={styles.memberInfoItem}>
                <span>최근 가입 회원</span>
                <strong>{getMemberDisplayName(latestJoinedMember)}</strong>
                <small>
                  {latestJoinedMember?.createdAt
                    ? formatKoreanDate(latestJoinedMember.createdAt)
                    : "가입 정보 없음"}
                </small>
              </div>

              <div className={styles.memberInfoItem}>
                <span>최근 제재 회원</span>
                <strong>
                  {getMemberDisplayName(
                    latestSanctionedMember,
                    latestSanctionedMember?.memberId,
                  )}
                </strong>
                <small>
                  {latestSanctionedMember?.createdAt
                    ? `${formatKoreanDate(latestSanctionedMember.createdAt)} · ${
                        latestSanctionedMember.actionDetail || "제재 기록"
                      }`
                    : "제재 기록 없음"}
                </small>
              </div>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
