import { AdminLayout } from "../common/AdminLayout";
import { DashboardActiveUserChart } from "./DashboardActiveUserChart";
import { DashboardEmotionActivityChart } from "./DashboardEmotionActivityChart";
import { DashboardMetricCards } from "./DashboardMetricCards";
import { DashboardNoticeModal } from "./DashboardNoticeModal";
import { DashboardRecentActivities } from "./DashboardRecentActivities";
import styles from "../../adminComponentsCss/dashboard/AdminDashboardPage.module.css";

export function AdminDashboardPage() {
  return (
    <AdminLayout
      title={"관리자 대시보드"}
      description={"회원, 게시글, 활동 현황을 한눈에 확인하세요."}
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
        </div>
      </section>
    </AdminLayout>
  );
}
