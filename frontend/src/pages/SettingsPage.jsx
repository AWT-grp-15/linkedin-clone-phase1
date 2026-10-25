import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("linkedin_theme") === "dark";
  });

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  // Danger zone
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("linkedin_theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("linkedin_theme", "light");
    }
  }, [darkMode]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });

    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordStatus({ type: "success", message: "Password updated successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordStatus({ type: "error", message: data.message || "Failed to update password." });
      }
    } catch (err) {
      setPasswordStatus({ type: "error", message: "Could not change password." });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("WARNING: This will permanently delete your account, posts, connections, and messages. This action cannot be undone. Are you sure?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        if (logout) logout();
        navigate("/signup");
      } else {
        alert("Could not delete account. Please try again.");
      }
    } catch (err) {
      alert("Account deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="settings-page-container">
      <div className="settings-layout">
        <main className="settings-main-card card">
          <div className="settings-header">
            <h2>Account Settings</h2>
            <p className="settings-subtitle">Manage your account preferences, security, and appearance.</p>
          </div>

          <hr className="settings-divider" />

          {/* Appearance Section */}
          <section className="settings-section">
            <h3>Appearance</h3>
            <div className="setting-row">
              <div>
                <strong>Dark Mode</strong>
                <p className="setting-desc">Adjust the interface to reduce glare and improve contrast.</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          <hr className="settings-divider" />

          {/* Account Profile Summary */}
          <section className="settings-section">
            <h3>Account Info</h3>
            <div className="account-info-box">
              <div className="info-item">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email || "Signed in"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Headline:</span>
                <span className="info-value">{user?.headline || "None"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">{user?.location || "Not set"}</span>
              </div>
            </div>
          </section>

          <hr className="settings-divider" />

          {/* Change Password Section */}
          <section className="settings-section">
            <h3>Sign in & Security</h3>
            <form onSubmit={handleChangePassword} className="password-change-form">
              {passwordStatus.message && (
                <div className={`status-banner ${passwordStatus.type}`}>
                  {passwordStatus.message}
                </div>
              )}

              <div className="form-group">
                <label>Current password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-update-password"
                disabled={changingPassword || !currentPassword || !newPassword}
              >
                {changingPassword ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>

          <hr className="settings-divider" />

          {/* Danger Zone */}
          <section className="settings-section danger-zone-section">
            <h3 className="danger-heading">Danger Zone</h3>
            <div className="danger-row">
              <div>
                <strong>Close Account</strong>
                <p className="setting-desc">Permanently remove your profile and all associated data.</p>
              </div>
              <button
                type="button"
                className="btn-delete-account"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default SettingsPage;