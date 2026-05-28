import { NavLink } from "react-router-dom";
import { AdminLayout } from "../common/AdminLayout";
import { adminNavItems } from "../common/adminConfig";
import { DashboardEmotionActivityChart } from "./DashboardEmotionActivityChart";
import { DashboardMetricCards } from "./DashboardMetricCards";
import { DashboardRecentActivities } from "./DashboardRecentActivities";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

/* ==========================================================================
 * 관리자 대시보드 페이지
 * --------------------------------------------------------------------------
 * 관리자 페이지 첫 화면에서 운영 현황을 확인하는 화면입니다.
 *
 * 초보자 설명:
 * - 이 파일은 대시보드의 큰 배치만 담당합니다.
 * - 회원 수 카드, 감정별 활동 분포, 최근 활동은 각각 별도 컴포넌트가
 *   API 호출과 상태 관리를 직접 담당합니다.
 * ========================================================================== */
export function AdminDashboardPage() {
  return (
    <AdminLayout
      title="관리자 대시보드"
      description="서비스 운영 현황을 한눈에 확인하세요."
    >
      <DashboardMetricCards />

      <section className={styles.dashboardGrid}>
        <DashboardEmotionActivityChart />
        <DashboardRecentActivities />

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
