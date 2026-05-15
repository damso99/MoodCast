import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from './amdinComponents/AdminDashboardPage';
import { ContentManagementPage } from './amdinComponents/ContentManagementPage';
import { ReportManagementPage } from './amdinComponents/ReportManagementPage';
import { StatisticsDashboardPage } from './amdinComponents/StatisticsDashboardPage';
import { UserManagementPage } from './amdinComponents/UserManagementPage';
import { pageTitles } from './amdinComponents/adminConfig';

/* ==========================================================================
 * 관리자 페이지 라우팅 파일
 * --------------------------------------------------------------------------
 * 이 파일은 "주소(URL)"와 "보여줄 페이지 컴포넌트"를 연결하는 역할만 합니다.
 *
 * 이전에는 이 파일 안에 모든 관리자 화면 코드가 들어 있었지만,
 * 유지보수를 쉽게 하기 위해 실제 화면 코드는 amdinComponents 폴더로 분리했습니다.
 *
 * 예시:
 * - /admin/dashboard 주소로 들어오면 AdminDashboardPage가 렌더링됩니다.
 * - /admin/users 주소로 들어오면 UserManagementPage가 렌더링됩니다.
 *
 * 이렇게 라우팅 파일을 가볍게 유지하면, 나중에 특정 화면을 수정할 때
 * 어느 파일을 열어야 하는지 훨씬 찾기 쉬워집니다.
 * ========================================================================== */
export function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/dashboard" element={<AdminDashboardPage />} />
      <Route path="/users" element={<UserManagementPage />} />
      <Route path="/content" element={<ContentManagementPage />} />
      <Route path="/reports" element={<ReportManagementPage />} />
      <Route path="/statistics" element={<StatisticsDashboardPage />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export { pageTitles };
