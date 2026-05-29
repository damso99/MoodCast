import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export function RequireAuth({ children }) {
  const { accessToken, isLoggedIn } = useAuthStore();
  const location = useLocation();

  if (!isLoggedIn || !accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
