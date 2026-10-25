import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, link) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include"
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (link) navigate(link);
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include"
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const timeAgo = (date) => {
    if (!date) return "recently";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "post_like":
        return "👍";
      case "post_comment":
        return "💬";
      case "connection_request":
        return "👥";
      case "connection_accepted":
        return "🔗";
      default:
        return "🔔";
    }
  };

  const displayedList =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="notifications-page-container">
      <div className="notifications-layout">
        {/* Left Filter Card */}
        <aside className="notifications-sidebar">
          <div className="card notifications-filter-card">
            <h3>Manage Notifications</h3>
            <ul className="notif-filter-list">
              <li
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                <span>All Notifications</span>
                <span className="notif-pill">{notifications.length}</span>
              </li>
              <li
                className={filter === "unread" ? "active" : ""}
                onClick={() => setFilter("unread")}
              >
                <span>Unread</span>
                {unreadCount > 0 && <span className="notif-pill unread">{unreadCount}</span>}
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Notifications List */}
        <main className="notifications-main-content">
          <div className="card notifications-feed-card">
            <div className="notifications-feed-header">
              <h2>Notifications</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn-mark-all-read"
                  onClick={handleMarkAllRead}
                >
                  ✓ Mark all as read
                </button>
              )}
            </div>

            {loading ? (
              <div className="notif-loading">
                <div className="loading-spinner"></div>
                <p>Loading your notifications...</p>
              </div>
            ) : displayedList.length > 0 ? (
              <div className="notifications-stream">
                {displayedList.map((item) => (
                  <div
                    key={item._id}
                    className={`notification-item ${!item.read ? "unread" : ""}`}
                    onClick={() => handleMarkAsRead(item._id, item.link)}
                  >
                    <div className="notif-avatar-col">
                      <div className="notif-avatar">
                        {item.sender?.avatar ? (
                          <img src={item.sender.avatar} alt={item.sender.firstName} />
                        ) : (
                          <span>{getInitials(item.sender)}</span>
                        )}
                      </div>
                      <span className="notif-type-badge">{getTypeIcon(item.type)}</span>
                    </div>

                    <div className="notif-content-col">
                      <p className="notif-message-text">{item.message}</p>
                      <span className="notif-timestamp">{timeAgo(item.createdAt)}</span>
                    </div>

                    <div className="notif-actions-col">
                      {!item.read && <span className="unread-dot"></span>}
                      <button
                        type="button"
                        className="notif-delete-btn"
                        onClick={(e) => handleDelete(e, item._id)}
                        title="Delete notification"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-notifications">
                <div className="empty-icon">🔔</div>
                <h3>No notifications here</h3>
                <p>When someone likes your posts or sends you a connection request, you'll see it here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default NotificationsPage;