import { Navigate, Route, Routes } from "react-router-dom";
import { useIsDesktop } from "./hooks/useViewportWidth";
import { HomeFeedPage } from "./pages/HomeFeed/HomeFeedPage";
import { MobileFeedPage } from "./pages/MobileFeed/MobileFeedPage";
import { SavedPage } from "./pages/Saved/SavedPage";
import { MoodChatPage } from "./pages/MoodChat/MoodChatPage";
import { ProfileDesktopPage } from "./pages/Profile/ProfileDesktopPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { SearchPage } from "./pages/Search/SearchPage";
import { CreatePostPage } from "./pages/CreatePost/CreatePostPage";
import { ProfileSetupPage } from "./pages/ProfileSetup/ProfileSetupPage";
import { LoginPage } from "./pages/Auth/LoginPage";
import { AdminRoutes } from "./pages/Admin/AdminPages";
import { SignupPage } from "./pages/Auth/SignupPage";
import { useAuthStore } from "./stores/useAuthStore";
import { useEffect } from "react";
import axios from "axios";

function AppRoutes() {
  const desktop = useIsDesktop();
  const { accessToken, setAuthData, clearAuthData } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKSERVER}/auth/me`, {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      })
      .then((res) => {
        setAuthData(accessToken, res.data);
      })
      .catch((err) => {
        console.log("로그인 상태 확인 실패", err);
        clearAuthData();
      });
  }, [accessToken, setAuthData, clearAuthData]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/feed" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/setup" element={<ProfileSetupPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/signup" element={<SignupPage />} />
      <Route path="/app/profile-setup" element={<ProfileSetupPage />} />
      <Route
        path="/app/feed"
        element={desktop ? <HomeFeedPage /> : <MobileFeedPage />}
      />
      <Route path="/app/mobile-feed" element={<MobileFeedPage />} />
      <Route path="/app/saved" element={<SavedPage />} />
      <Route path="/app/mood-chat" element={<MoodChatPage />} />
      <Route path="/app/chat" element={<MoodChatPage />} />
      <Route
        path="/app/profile"
        element={desktop ? <ProfileDesktopPage /> : <ProfilePage />}
      />
      <Route path="/app/profile-mobile" element={<ProfilePage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/search" element={<SearchPage />} />
      <Route path="/app/write" element={<CreatePostPage />} />
      <Route path="/app/create" element={<CreatePostPage />} />
      <Route path="/app/mood" element={<Navigate to="/app/write" replace />} />
      <Route
        path="/app/community"
        element={<Navigate to="/app/feed" replace />}
      />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="*" element={<Navigate to="/app/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
