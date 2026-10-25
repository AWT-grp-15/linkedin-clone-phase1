import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <NavLink to="/" className="navbar-brand" title="LinkedIn Home">
            in
          </NavLink>
          <SearchBar />
        </div>

        <div className="navbar-links">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">⌂</span>
            <span>Home</span>
          </NavLink>

          <NavLink to="/network" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">👥</span>
            <span>My Network</span>
          </NavLink>

          <NavLink to="/jobs" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">💼</span>
            <span>Jobs</span>
          </NavLink>

          <NavLink to="/messaging" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">💬</span>
            <span>Messaging</span>
          </NavLink>

          <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <span className="nav-icon">🔔</span>
            <span>Notifications</span>
          </NavLink>

          {!loading && user ? (
            <div className="nav-profile-wrap" ref={menuRef}>
              <button 
                type="button" 
                className="nav-link nav-profile-btn" 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <div className="navbar-avatar-circle">
                  {getInitials(user)}
                </div>
                <span className="nav-me-text">
                  Me <small>▼</small>
                </span>
              </button>

              {menuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-user-header">
                    <div className="dropdown-avatar">{getInitials(user)}</div>
                    <div>
                      <strong className="dropdown-name">{user.firstName} {user.lastName}</strong>
                      <p className="dropdown-headline">{user.headline || "LinkedIn Member"}</p>
                    </div>
                  </div>
                  <NavLink to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    View Profile
                  </NavLink>
                  <NavLink to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    Settings & Privacy
                  </NavLink>
                  <hr className="dropdown-divider" />
                  <button type="button" className="dropdown-item signout-btn" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : !loading && (
            <div className="nav-auth-buttons">
              <NavLink to="/signup" className="nav-join-btn">
                Join now
              </NavLink>
              <NavLink to="/login" className="nav-signin-btn">
                Sign in
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;