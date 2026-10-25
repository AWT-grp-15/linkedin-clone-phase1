import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProfileSidebar() {
  const { user } = useAuth();

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Welcome, Guest!";
  const displayHeadline = user?.headline || "Software Engineer & Builder";

  return (
    <aside className="left-sidebar">
      <div className="card profile-card">
        <div className="profile-cover"></div>
        <div className="profile-content">
          <div className="profile-avatar-large">
            {getInitials(user)}
          </div>
          <h2 className="profile-name">
            <Link to="/profile">{displayName}</Link>
          </h2>
          <p className="profile-headline">{displayHeadline}</p>
          {user?.location && (
            <p className="profile-location">{user.location}</p>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat-row">
            <span className="stat-label">Profile viewers</span>
            <span className="stat-value">28</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Post impressions</span>
            <span className="stat-value">142</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Connections</span>
            <span className="stat-value">{user?.connections || 12}</span>
          </div>
        </div>

        <div className="profile-quicklinks">
          <Link to="/network" className="quicklink-item">
            <span>👥 Grow your network</span>
          </Link>
          <Link to="/profile" className="quicklink-item">
            <span>🔖 Saved items & Profile</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
