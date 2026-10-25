import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NetworkPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState("grow"); // 'grow' | 'connections'
  const [loading, setLoading] = useState(true);

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const loadNetworkData = async () => {
    setLoading(true);
    try {
      const [reqRes, sugRes, connRes] = await Promise.all([
        fetch("/api/users/connection-requests", { credentials: "include" }),
        fetch("/api/users/suggestions", { credentials: "include" }),
        fetch("/api/users/connections", { credentials: "include" })
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests || []);
      }
      if (sugRes.ok) {
        const data = await sugRes.json();
        setSuggestions(data.suggestions || []);
      }
      if (connRes.ok) {
        const data = await connRes.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error("Failed to load network data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNetworkData();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      const res = await fetch(`/api/users/connections/${requestId}/accept`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        loadNetworkData();
      }
    } catch (err) {
      console.error("Accept failed:", err);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await fetch(`/api/users/connections/${requestId}/reject`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      }
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  const handleConnect = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/connect`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s._id === userId ? { ...s, requested: true } : s))
        );
      }
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  return (
    <div className="network-page-container">
      <div className="network-layout">
        {/* Left Network Sidebar */}
        <aside className="network-sidebar">
          <div className="card network-manage-card">
            <h3 className="network-sidebar-title">Manage my network</h3>
            <ul className="network-nav-list">
              <li
                className={activeTab === "grow" ? "active" : ""}
                onClick={() => setActiveTab("grow")}
              >
                <span className="net-icon">👥</span>
                <span className="net-label">Grow Network</span>
                {requests.length > 0 && (
                  <span className="net-badge">{requests.length}</span>
                )}
              </li>
              <li
                className={activeTab === "connections" ? "active" : ""}
                onClick={() => setActiveTab("connections")}
              >
                <span className="net-icon">🔗</span>
                <span className="net-label">Connections</span>
                <span className="net-count">{connections.length}</span>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Network Content */}
        <main className="network-main-content">
          {activeTab === "grow" ? (
            <>
              {/* Invitations Section */}
              {requests.length > 0 && (
                <div className="card invitations-card">
                  <div className="invitations-header">
                    <h3>Invitations ({requests.length})</h3>
                  </div>
                  <div className="invitations-list">
                    {requests.map((req) => (
                      <div key={req._id} className="invitation-item">
                        <Link to={`/profile/${req.sender?._id}`} className="invitation-avatar-link">
                          <div className="invitation-avatar">
                            {req.sender?.avatar ? (
                              <img src={req.sender.avatar} alt={req.sender.firstName} />
                            ) : (
                              getInitials(req.sender)
                            )}
                          </div>
                        </Link>
                        <div className="invitation-info">
                          <Link to={`/profile/${req.sender?._id}`} className="invitation-name">
                            {req.sender?.firstName} {req.sender?.lastName}
                          </Link>
                          <p className="invitation-headline">{req.sender?.headline}</p>
                          {req.sender?.location && (
                            <span className="invitation-location">📍 {req.sender.location}</span>
                          )}
                        </div>
                        <div className="invitation-actions">
                          <button
                            type="button"
                            className="btn-ignore"
                            onClick={() => handleReject(req._id)}
                          >
                            Ignore
                          </button>
                          <button
                            type="button"
                            className="btn-accept"
                            onClick={() => handleAccept(req._id)}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* People You May Know */}
              <div className="card suggestions-card">
                <div className="suggestions-header">
                  <h3>People you may know</h3>
                  <span className="suggestions-subtitle">Based on your industry and mutual connections</span>
                </div>

                {loading ? (
                  <div className="network-loading">Loading suggestions...</div>
                ) : suggestions.length > 0 ? (
                  <div className="suggestions-grid">
                    {suggestions.map((person) => (
                      <div key={person._id} className="suggestion-user-card">
                        <div className="card-top-banner"></div>
                        <Link to={`/profile/${person._id}`} className="person-avatar-wrap">
                          <div className="person-avatar">
                            {person.avatar ? (
                              <img src={person.avatar} alt={person.firstName} />
                            ) : (
                              getInitials(person)
                            )}
                          </div>
                        </Link>
                        <div className="person-details">
                          <Link to={`/profile/${person._id}`} className="person-name">
                            {person.firstName} {person.lastName}
                          </Link>
                          <p className="person-headline">{person.headline}</p>
                          {person.location && (
                            <span className="person-location">📍 {person.location}</span>
                          )}
                        </div>
                        <div className="person-footer">
                          <button
                            type="button"
                            className={`btn-connect ${person.requested ? "requested" : ""}`}
                            disabled={person.requested}
                            onClick={() => handleConnect(person._id)}
                          >
                            {person.requested ? "Pending" : "+ Connect"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-suggestions">
                    <p>You're all caught up! No more suggestions right now.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Connections Tab */
            <div className="card connections-view-card">
              <div className="connections-header">
                <h3>{connections.length} Connections</h3>
              </div>
              {connections.length > 0 ? (
                <div className="connections-list">
                  {connections.map((conn) => (
                    <div key={conn._id} className="connection-row">
                      <Link to={`/profile/${conn._id}`} className="conn-avatar-wrap">
                        <div className="conn-avatar">
                          {conn.avatar ? (
                            <img src={conn.avatar} alt={conn.firstName} />
                          ) : (
                            getInitials(conn)
                          )}
                        </div>
                      </Link>
                      <div className="conn-info">
                        <Link to={`/profile/${conn._id}`} className="conn-name">
                          {conn.firstName} {conn.lastName}
                        </Link>
                        <p className="conn-headline">{conn.headline}</p>
                        {conn.location && (
                          <span className="conn-location">📍 {conn.location}</span>
                        )}
                      </div>
                      <div className="conn-actions">
                        <Link to="/messaging" className="btn-message-conn">
                          💬 Message
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-connections">
                  <p>You haven't connected with anyone yet. Explore suggestions to grow your network!</p>
                  <button
                    type="button"
                    className="btn-grow-net"
                    onClick={() => setActiveTab("grow")}
                  >
                    Find Connections
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default NetworkPage;