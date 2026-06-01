import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export function RequireAuth({ children, authChecked }) {
  const { accessToken, isLoggedIn } = useAuthStore();
  const location = useLocation();

  // 새로고침 직후 refresh cookie로 로그인 복구를 먼저 시도하게 기다림
  if (!authChecked) {
    return null;
  }

  // 로그인 정보가 없으면 로그인 페이지로 보냄
  if (!isLoggedIn || !accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
