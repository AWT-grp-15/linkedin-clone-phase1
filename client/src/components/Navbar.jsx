import { NavLink } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, loading, logout } = useAuth();
  return (
    <nav className="navbar">
      <div className="navbar-container">

        <div className="navbar-left">
          <NavLink to="/" className="navbar-brand">
            in
          </NavLink>

          <SearchBar />
        </div>

        <div className="navbar-links">
          <NavLink to="/" className="nav-link">
            <span className="nav-icon">⌂</span>
            <span>Home</span>
          </NavLink>

          <NavLink to="/network" className="nav-link">
            <span className="nav-icon">♙</span>
            <span>Network</span>
          </NavLink>

          <NavLink to="/jobs" className="nav-link">
            <span className="nav-icon">▣</span>
            <span>Jobs</span>
          </NavLink>

          <NavLink to="/messaging" className="nav-link">
            <span className="nav-icon">✉</span>
            <span>Messaging</span>
          </NavLink>

          <NavLink to="/notifications" className="nav-link">
            <span className="nav-icon">♢</span>
            <span>Notifications</span>
          </NavLink>

          {!loading && user && (
                <NavLink to="/profile" className="nav-link">
                    <span className="nav-icon">
                    {user.avatar ? (
                        <img
                        src={user.avatar}
                        alt=""
                        className="navbar-avatar"
                        />
                    ) : (
                        "●"
                    )}
                    </span>

                    <span>{user.firstName}</span>
                </NavLink>
            )}
            {!loading && !user && (
                <NavLink to="/login" className="nav-link">
                    <span>Login</span>
                </NavLink>
            )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;