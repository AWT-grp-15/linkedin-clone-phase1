import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import HomePage from "./pages/HomePage";
import NetworkPage from "./pages/NetworkPage";
import JobsPage from "./pages/JobsPage";
import MessagingPage from "./pages/MessagingPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages that use the main application layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Authentication pages don't use the main navbar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;