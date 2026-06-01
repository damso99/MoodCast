import { NavLink } from "react-router-dom";
import { AdminLayout } from "../common/AdminLayout";
import { adminNavItems } from "../common/adminConfig";
import { DashboardActiveUserChart } from "./DashboardActiveUserChart";
import { DashboardEmotionActivityChart } from "./DashboardEmotionActivityChart";
import { DashboardMetricCards } from "./DashboardMetricCards";
import { DashboardNoticeModal } from "./DashboardNoticeModal";
import { DashboardRecentActivities } from "./DashboardRecentActivities";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

export function AdminDashboardPage() {
  return (
    <AdminLayout
      title="관리자 대시보드"
      description="회원, 게시글, 활동 현황을 한눈에 확인하세요."
    >
      <DashboardNoticeModal />
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
              <NavLink to="/app/feed">피드로 이동</NavLink>
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
