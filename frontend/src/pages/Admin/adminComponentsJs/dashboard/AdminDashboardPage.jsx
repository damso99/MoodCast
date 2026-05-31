import { NavLink } from "react-router-dom";
import { AdminLayout } from "../common/AdminLayout";
import { adminNavItems } from "../common/adminConfig";
import { DashboardActiveUserChart } from "./DashboardActiveUserChart";
import { DashboardEmotionActivityChart } from "./DashboardEmotionActivityChart";
import { DashboardMetricCards } from "./DashboardMetricCards";
import { DashboardRecentActivities } from "./DashboardRecentActivities";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

/* ==========================================================================
 * 관리자 대시보드 페이지
 * --------------------------------------------------------------------------
 * 관리자 페이지의 첫 화면입니다.
 *
 * 초보자 설명:
 * - 이 파일은 대시보드 전체 배치만 담당합니다.
 * - 실제 API 호출과 그래프 계산은 각각 분리된 컴포넌트가 담당합니다.
 * - 이렇게 분리하면 한 기능을 수정할 때 한 파일만 집중해서 보면 됩니다.
 * ========================================================================== */
export function AdminDashboardPage() {
  return (
    <AdminLayout
      title="관리자 대시보드"
      description="회원, 게시글, 활동 현황을 한눈에 확인하세요."
    >
      <DashboardMetricCards />

      <section className={styles.dashboardGrid}>
        <div className={styles.dashboardMainColumn}>
          <DashboardEmotionActivityChart />
          <DashboardActiveUserChart />
        </div>

        <div className={styles.dashboardSideColumn}>
          <DashboardRecentActivities />

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>빠른 이동</h2>
            </div>

            <nav className={styles.quickLinks} aria-label="관리자 빠른 이동">
              {adminNavItems.slice(1, 5).map((item) => (
                <NavLink key={item.to} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </section>
        </div>
      </section>
    </AdminLayout>
  );
}
