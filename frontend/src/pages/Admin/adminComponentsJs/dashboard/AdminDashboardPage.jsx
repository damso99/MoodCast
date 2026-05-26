import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { AdminLayout } from "../common/AdminLayout";
import { EmptyState } from "../common/EmptyState";
import { MetricCard } from "../common/MetricCard";
import { SegmentedControl } from "../common/SegmentedControl";
import { adminNavItems } from "../common/adminConfig";
import { useAuthStore } from "../../../../hooks/useAuthStore";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

/* ==========================================================================
 * 관리자 대시보드 페이지
 * --------------------------------------------------------------------------
 * 관리자 페이지에 처음 들어왔을 때 보여줄 메인 화면입니다.
 *
 * 담당 기능:
 * - 회원수, 신규 가입자, 게시글 수, 신고 대기 요약 카드
 * - 신규 가입자 추이 그래프 자리
 * - 감정별 활동 분포 필터 자리
 * - 최근 활동과 자주 확인하는 메뉴
 *
 * totalMemberCount 상태 설명:
 * - members 테이블의 전체 회원 수를 저장합니다.
 *
 * dashboardSummary 상태 설명:
 * - 관리자 대시보드 상단 카드에 필요한 숫자를 한 번에 저장합니다.
 * - 현재는 회원수, 오늘 신규 가입자 수, 게시글 수를 담습니다.
 *
 * Polling 설명:
 * - 지금은 WebSocket으로 서버가 값을 밀어주는 구조가 아닙니다.
 * - 대신 10초마다 summary API를 다시 호출해서 DB 변경 내용을 화면에 반영합니다.
 * ========================================================================== */
export function AdminDashboardPage() {
  const [signupPeriod, setSignupPeriod] = useState("일");
  const [dashboardSummary, setDashboardSummary] = useState({
    totalMemberCount: null,
    todayNewMemberCount: null,
    postCount: null,
  });
  const [dashboardSummaryError, setDashboardSummaryError] = useState(false);
  const { accessToken } = useAuthStore();

  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  const signupDescription = {
    일: "일 단위 신규 가입자 데이터가 연결되면 그래프가 표시됩니다.",
    주: "주 단위 신규 가입자 데이터가 연결되면 그래프가 표시됩니다.",
    월: "월 단위 신규 가입자 데이터가 연결되면 그래프가 표시됩니다.",
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const fetchDashboardSummary = () => {
      /* ======================================================================
       * 대시보드 요약 조회
       * ----------------------------------------------------------------------
       * 대시보드 카드에 들어갈 숫자를 한 번에 가져옵니다.
       *
       * 이 함수를 setInterval로 반복 실행하기 때문에,
       * 회원가입이나 게시글 작성으로 DB 값이 바뀌면 새로고침 없이도
       * 최대 10초 안에 화면 숫자가 다시 갱신됩니다.
       * ====================================================================== */
      axios
        .get(`${BACKSERVER}/admin/api/dashboard/summary`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setDashboardSummary({
            totalMemberCount:
              typeof res.data?.totalMemberCount === "number"
                ? res.data.totalMemberCount
                : 0,
            todayNewMemberCount:
              typeof res.data?.todayNewMemberCount === "number"
                ? res.data.todayNewMemberCount
                : 0,
            postCount:
              typeof res.data?.postCount === "number" ? res.data.postCount : 0,
          });
          setDashboardSummaryError(false);
        })
        .catch((error) => {
          console.log(error);
          setDashboardSummary({
            totalMemberCount: null,
            todayNewMemberCount: null,
            postCount: null,
          });
          setDashboardSummaryError(true);
        });
    };

    fetchDashboardSummary();

    const pollingId = window.setInterval(fetchDashboardSummary, 10000);

    return () => {
      window.clearInterval(pollingId);
    };
  }, [BACKSERVER, accessToken]);

  return (
    <AdminLayout
      title="관리자 대시보드"
      description="서비스 운영 현황을 한눈에 확인하세요."
    >
      <section className={styles.metricGrid}>
        <MetricCard
          label="회원수"
          value={
            dashboardSummary.totalMemberCount === null
              ? "-"
              : dashboardSummary.totalMemberCount.toLocaleString()
          }
          helperText={dashboardSummaryError ? "조회 실패" : ""}
          icon={<GroupOutlinedIcon />}
        />
        <MetricCard
          label="신규 가입자"
          value={
            dashboardSummary.todayNewMemberCount === null
              ? "-"
              : dashboardSummary.todayNewMemberCount.toLocaleString()
          }
          helperText={dashboardSummaryError ? "조회 실패" : ""}
          icon={<AddOutlinedIcon />}
          accent="blue"
        />
        <MetricCard
          label="게시글 수"
          value={
            dashboardSummary.postCount === null
              ? "-"
              : dashboardSummary.postCount.toLocaleString()
          }
          helperText={dashboardSummaryError ? "조회 실패" : ""}
          icon={<Inventory2OutlinedIcon />}
          accent="pink"
        />
        <MetricCard
          label="신고 대기"
          icon={<GppMaybeOutlinedIcon />}
          accent="orange"
        />
      </section>

      <section className={styles.dashboardGrid}>
        <section className={`${styles.panel} ${styles.widePanel}`}>
          <div className={styles.panelHead}>
            <h2>신규 가입자 추이</h2>
            <SegmentedControl
              labels={["일", "주", "월"]}
              selectedLabel={signupPeriod}
              onSelect={setSignupPeriod}
            />
          </div>
          <div className={`${styles.chartBox} ${styles.line}`}>
            <div className={styles.chartGrid} />
            <EmptyState
              title={`${signupPeriod} 단위 가입자 데이터가 없습니다`}
              description={signupDescription[signupPeriod]}
            />
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>감정별 활동 분포</h2>
          </div>
          <div className={styles.moodFilters}>
            {["기쁨", "자연", "설렘", "우울", "불안"].map((mood) => (
              <button key={mood} type="button">
                {mood}
              </button>
            ))}
          </div>
          <EmptyState
            title="활동 요약 없음"
            description="감정별 활동 데이터가 아직 없습니다."
          />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>최근 활동</h2>
          </div>
          <EmptyState
            title="최근 활동 없음"
            description="사용자 활동이 수집되면 이 영역에 표시됩니다."
          />
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>자주 확인하는 메뉴</h2>
          </div>
          <div className={styles.quickLinks}>
            {adminNavItems.slice(1, 4).map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>
      </section>
    </AdminLayout>
  );
}
