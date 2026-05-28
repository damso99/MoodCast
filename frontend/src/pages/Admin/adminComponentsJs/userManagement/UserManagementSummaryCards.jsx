import { formatKoreanDate } from "../../../../shared/lib/dateTime";
import styles from "../../adminComponentsCss/userManagement/UserManagementPage.module.css";

/* ==========================================================================
 * 사용자 관리 하단 요약 카드 컴포넌트
 * --------------------------------------------------------------------------
 * UserManagementPage.jsx의 하단에 표시되는 두 개의 박스를 담당합니다.
 *
 * 담당 UI:
 * 1. 전체 회원 비율
 *    - 일반 회원 / 관리자 회원 / 정지 회원 수를 원형 그래프로 보여줍니다.
 * 2. 회원 관리 정보
 *    - 가장 최근 가입한 회원 1명
 *    - 가장 최근 제재당한 회원 1명
 *
 * 초보자 설명:
 * - 부모 컴포넌트(UserManagementPage)는 API 호출과 큰 페이지 구성을 담당합니다.
 * - 이 컴포넌트는 "받은 데이터를 어떻게 화면에 보여줄지"만 담당합니다.
 * - 이렇게 나누면 UserManagementPage.jsx가 너무 길어지는 것을 막을 수 있고,
 *   나중에 원형 그래프나 최근 회원 UI만 수정할 때 이 파일만 보면 됩니다.
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
  /* ------------------------------------------------------------------------
   * 비율 계산 함수
   * ------------------------------------------------------------------------
   * count는 일반 회원 수, 관리자 회원 수처럼 특정 그룹의 숫자입니다.
   * totalMemberCount가 0이면 0으로 나누는 문제가 생기므로 바로 0%를 반환합니다.
   * ------------------------------------------------------------------------ */
  const getPercent = (count) => {
    if (!totalMemberCount) {
      return 0;
    }

    return Math.round((count / totalMemberCount) * 100);
  };

  /* ------------------------------------------------------------------------
   * 원형 그래프에 표시할 항목 목록
   * ------------------------------------------------------------------------
   * 배열로 만들어두면 JSX에서 map으로 반복 출력할 수 있습니다.
   * color 값은 원형 그래프 조각 색과 범례 점 색에 같이 사용됩니다.
   * ------------------------------------------------------------------------ */
  const memberRatioItems = [
    {
      label: "일반 회원",
      count: normalMemberCount,
      color: "#7c4dff",
      percent: getPercent(normalMemberCount),
    },
    {
      label: "관리자 회원",
      count: adminMemberCount,
      color: "#12b76a",
      percent: getPercent(adminMemberCount),
    },
    {
      label: "정지 회원",
      count: suspendedMemberCount,
      color: "#f04438",
      percent: getPercent(suspendedMemberCount),
    },
  ];

  /* ------------------------------------------------------------------------
   * conic-gradient 구간 계산
   * ------------------------------------------------------------------------
   * CSS conic-gradient는 0~100% 구간을 여러 색으로 나눠 원형 그래프를 만듭니다.
   *
   * 예:
   * - 일반 회원 60%
   * - 관리자 회원 30%
   * - 정지 회원 10%
   *
   * 그러면 첫 번째 색은 0~60, 두 번째 색은 60~90, 세 번째 색은 90~100 구간입니다.
   * ------------------------------------------------------------------------ */
  const firstRatioEnd = memberRatioItems[0].percent;
  const secondRatioEnd = firstRatioEnd + memberRatioItems[1].percent;
  const thirdRatioEnd = Math.min(
    100,
    secondRatioEnd + memberRatioItems[2].percent,
  );
  const ratioChartStyle = {
    background: `conic-gradient(
      ${memberRatioItems[0].color} 0% ${firstRatioEnd}%,
      ${memberRatioItems[1].color} ${firstRatioEnd}% ${secondRatioEnd}%,
      ${memberRatioItems[2].color} ${secondRatioEnd}% ${thirdRatioEnd}%,
      #eef2f6 ${thirdRatioEnd}% 100%
    )`,
  };

  /* ------------------------------------------------------------------------
   * 회원 이름 표시 함수
   * ------------------------------------------------------------------------
   * API에서 name이 오면 실명을 보여주고, name이 없지만 nickname이 있으면 닉네임을 보여줍니다.
   * 둘 다 없으면 화면이 비어 보이지 않도록 안내 문구를 반환합니다.
   * ------------------------------------------------------------------------ */
  const getMemberDisplayName = (memberItem, fallbackId) => {
    if (!memberItem) {
      return fallbackId ? `삭제된 회원 #${fallbackId}` : "회원 정보 없음";
    }

    if (memberItem.name) {
      return memberItem.name;
    }

    if (memberItem.nickname) {
      return `@${memberItem.nickname}`;
    }

    return memberItem.memberId
      ? `삭제된 회원 #${memberItem.memberId}`
      : "회원 정보 없음";
  };

  return (
    <section className={styles.infoGrid}>
      <article className={styles.infoBox}>
        <strong>전체 회원 비율</strong>

        {/* 로딩 중이어도 회원 목록 fallback 숫자가 있으면 그래프를 바로 보여줍니다. */}
        {isLoading && totalMemberCount === 0 ? (
          <p>회원 비율을 불러오는 중입니다.</p>
        ) : (
          <>
            {/* 요약 API가 실패해도 회원 목록으로 계산한 숫자를 보여주기 위한 안내입니다. */}
            {hasError && (
              <p className={styles.summaryNotice}>
                요약 API 조회 실패로 현재 회원 목록 기준 비율을 표시합니다.
              </p>
            )}

            <div className={styles.ratioContent}>
              {/* 원형 그래프 영역입니다. style에는 위에서 만든 conic-gradient가 들어갑니다. */}
              <div className={styles.ratioChart} style={ratioChartStyle}>
                <div className={styles.ratioChartCenter}>
                  <span>전체</span>
                  <strong>{totalMemberCount.toLocaleString()}</strong>
                </div>
              </div>

              {/* 그래프 색상별 의미와 실제 수치를 오른쪽 범례로 보여줍니다. */}
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

        {/* 최근 회원 정보는 management-summary API 데이터가 있어야 정확합니다. */}
        {isLoading ? (
          <p>회원 관리 정보를 불러오는 중입니다.</p>
        ) : (
          <>
            {hasError && (
              <p className={styles.summaryNotice}>
                요약 API 조회 실패로 최근 가입 회원은 현재 목록 기준으로 표시합니다.
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
