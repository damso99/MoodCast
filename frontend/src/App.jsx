import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useIsDesktop } from './hooks/useViewportWidth';
import { HomeFeedPage } from './pages/HomeFeed/HomeFeedPage';
import { MobileFeedPage } from './pages/MobileFeed/MobileFeedPage';
import { SavedPage } from './pages/Saved/SavedPage';
import { MoodChatPage } from './pages/MoodChat/MoodChatPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { ProfileEditPage } from './pages/Profile/ProfileEditPage';
import { EditPostPage } from './pages/PostEdit/EditPostPage';
import { FollowersPage } from './pages/Follow/FollowersPage';
import { FollowingPage } from './pages/Follow/FollowingPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SearchPage } from './pages/Search/SearchPage';
import { CreatePostPage } from './pages/CreatePost/CreatePostPage';
import { PostDetailPage } from './pages/PostDetail/PostDetailPage';
import { ProfileSetupPage } from './pages/ProfileSetup/ProfileSetupPage';
import { LoginPage } from './pages/Auth/LoginPage';
import { AdminRoutes } from './pages/Admin/AdminPages';
import { SignupPage } from './pages/Auth/SignupPage';
import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from './stores/useAuthStore';
import { RequireAuth } from './components/common/RequireAuth';

function AppRoutes() {
  const desktop = useIsDesktop();
  const navigate = useNavigate();
  const { accessToken, setAuthData, clearAuthData } = useAuthStore();
  const BACKSERVER = import.meta.env.VITE_BACKSERVER || "http://localhost:8080";

  /*
    새로고침 후 sessionStorage에 남아있는 accessToken이
    서버 기준으로도 유효한지 확인한다.
  */
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    axios
      .get(`${BACKSERVER}/auth/me`, {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      })
      .then((res) => {
        const loginMember = res.data.member || res.data;
        setAuthData(accessToken, loginMember);
      })
      .catch((err) => {
        console.log("로그인 상태 확인 실패", err);
        clearAuthData();
        navigate('/auth/login', { replace: true });
      });
  }, [accessToken, setAuthData, clearAuthData, navigate]);

  const authRoute = (element) => <RequireAuth>{element}</RequireAuth>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/feed" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/setup" element={<ProfileSetupPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/signup" element={<SignupPage />} />
      <Route path="/app/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/app/feed" element={authRoute(desktop ? <HomeFeedPage /> : <MobileFeedPage />)} />
      <Route path="/app/mobile-feed" element={authRoute(<MobileFeedPage />)} />
      <Route path="/app/saved" element={authRoute(<SavedPage />)} />
      <Route path="/app/mood-chat" element={authRoute(<MoodChatPage />)} />
      <Route path="/app/chat" element={authRoute(<MoodChatPage />)} />
      <Route path="/app/group-chat" element={<Navigate to="/app/mood-chat" replace />} />
      {/* 마이페이지와 유저페이지를 ProfilePage 하나로 통합함 */}
      <Route path="/app/profile" element={authRoute(<ProfilePage />)} />
      <Route path="/app/profile-mobile" element={authRoute(<ProfilePage />)} />
      <Route path="/app/profile/edit" element={authRoute(<ProfileEditPage />)} />
      <Route path="/app/post/edit/:postId" element={authRoute(<EditPostPage />)} />
      <Route path="/app/followers" element={authRoute(<FollowersPage />)} />
      <Route path="/app/followers/:memberId" element={authRoute(<FollowersPage />)} />
      <Route path="/app/following" element={authRoute(<FollowingPage />)} />
      <Route path="/app/following/:memberId" element={authRoute(<FollowingPage />)} />
      <Route path="/app/user/:handle" element={authRoute(<ProfilePage />)} />
      <Route path="/app/settings" element={authRoute(<SettingsPage />)} />
      <Route path="/app/search" element={authRoute(<SearchPage />)} />
      <Route path="/app/write" element={authRoute(<CreatePostPage />)} />
      <Route path="/app/create" element={authRoute(<CreatePostPage />)} />
      <Route path="/app/post/:postId" element={authRoute(<PostDetailPage />)} />
      <Route path="/app/mood" element={authRoute(<Navigate to="/app/write" replace />)} />
      <Route path="/app/community" element={authRoute(<Navigate to="/app/feed" replace />)} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/app/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
