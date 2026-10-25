import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
          setOpen(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectUser = (userId) => {
    setOpen(false);
    setQuery("");
    navigate(`/profile/${userId}`);
  };

  const handleConnect = async (e, userId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/users/${userId}/connect`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setResults((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, connectedStatus: "pending" } : u))
        );
      }
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const getInitials = (u) => {
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <div className="search-bar-wrapper" ref={dropdownRef}>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Search people, skills, roles..."
          aria-label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
        />
        {loading && <span className="search-spinner">⏳</span>}
      </div>

      {open && (
        <div className="search-dropdown-menu">
          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user._id}
                className="search-result-item"
                onClick={() => handleSelectUser(user._id)}
              >
                <div className="search-user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.firstName} />
                  ) : (
                    <span>{getInitials(user)}</span>
                  )}
                </div>
                <div className="search-user-info">
                  <div className="search-user-name">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="search-user-headline">{user.headline}</div>
                  {user.location && (
                    <div className="search-user-location">📍 {user.location}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="search-connect-btn"
                  onClick={(e) => handleConnect(e, user._id)}
                  disabled={user.connectedStatus === "pending"}
                >
                  {user.connectedStatus === "pending" ? "Pending" : "Connect"}
                </button>
              </div>
            ))
          ) : (
            <div className="search-no-results">No people found matching "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
