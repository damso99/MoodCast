import { Navigate, Route, Routes } from 'react-router-dom';
import { useIsDesktop } from './app/hooks/useViewportWidth';
import { HomeFeedPage } from './pages/HomeFeed/HomeFeedPage';
import { MobileFeedPage } from './pages/MobileFeed/MobileFeedPage';
import { SavedPage } from './pages/Saved/SavedPage';
import { MoodChatPage } from './pages/MoodChat/MoodChatPage';
import { ProfileDesktopPage } from './pages/Profile/ProfileDesktopPage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { SearchPage } from './pages/Search/SearchPage';
import { CreatePostPage } from './pages/CreatePost/CreatePostPage';
import { ProfileSetupPage } from './pages/ProfileSetup/ProfileSetupPage';
import { LoginPage } from './pages/Auth/LoginPage';

function AppRoutes() {
  const desktop = useIsDesktop();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/feed" replace />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/setup" element={<ProfileSetupPage />} />
      <Route path="/app/login" element={<LoginPage />} />
      <Route path="/app/profile-setup" element={<ProfileSetupPage />} />
      <Route path="/app/feed" element={desktop ? <HomeFeedPage /> : <MobileFeedPage />} />
      <Route path="/app/mobile-feed" element={<MobileFeedPage />} />
      <Route path="/app/saved" element={<SavedPage />} />
      <Route path="/app/mood-chat" element={<MoodChatPage />} />
      <Route path="/app/chat" element={<MoodChatPage />} />
      <Route path="/app/profile" element={desktop ? <ProfileDesktopPage /> : <ProfilePage />} />
      <Route path="/app/profile-mobile" element={<ProfilePage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="/app/search" element={<SearchPage />} />
      <Route path="/app/write" element={<CreatePostPage />} />
      <Route path="/app/create" element={<CreatePostPage />} />
      <Route path="/app/mood" element={<Navigate to="/app/write" replace />} />
      <Route path="/app/community" element={<Navigate to="/app/feed" replace />} />
      <Route path="*" element={<Navigate to="/app/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
