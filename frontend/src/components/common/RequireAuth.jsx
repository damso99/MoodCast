import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export function RequireAuth({ children }) {
  const { accessToken, isLoggedIn } = useAuthStore();
  const location = useLocation();

  // 로그인 정보가 없으면 로그인 페이지로 보냄
  // state.from은 로그인 후 다시 돌아오기 위해 저장함
  if (!isLoggedIn || !accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
