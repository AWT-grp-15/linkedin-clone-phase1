import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("none"); // 'self' | 'none' | 'pending' | 'accepted' | 'received'
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    headline: "",
    location: "",
    about: "",
    avatar: ""
  });

  const isSelf = !userId || (currentUser && String(currentUser._id) === String(userId));
  const targetId = isSelf ? (currentUser?._id || "me") : userId;

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/profile/${targetId}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data.user);
        setConnectionStatus(data.connectionStatus);
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          headline: data.user.headline || "",
          location: data.user.location || "",
          about: data.user.about || "",
          avatar: data.user.avatar || ""
        });

        // Load this user's posts
        const postsRes = await fetch(`/api/posts/user/${data.user._id}`, {
          credentials: "include"
        });
        if (postsRes.ok) {
          const pData = await postsRes.json();
          setUserPosts(pData.posts || []);
        }
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser]);

  const handleConnect = async () => {
    if (!profileUser) return;
    try {
      const res = await fetch(`/api/users/${profileUser._id}/connect`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setConnectionStatus("pending");
      }
    } catch (err) {
      console.error("Connect failed:", err);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setProfileUser(data.user);
        if (setCurrentUser) {
          setCurrentUser(data.user);
        }
        setShowEditModal(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="card profile-loading-card">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="profile-page-container">
        <div className="card profile-not-found">
          <h2>Member not found</h2>
          <p>The profile you are looking for does not exist or has been removed.</p>
          <Link to="/" className="btn-back-home">Back to Home Feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-layout">
        <main className="profile-main-column">
          {/* Top Profile Card */}
          <section className="card profile-hero-card">
            <div className="profile-cover-banner">
              <div className="cover-gradient-art"></div>
            </div>

            <div className="profile-avatar-row">
              <div className="profile-avatar-large">
                {profileUser.avatar ? (
                  <img src={profileUser.avatar} alt={profileUser.firstName} />
                ) : (
                  <span>{getInitials(profileUser)}</span>
                )}
              </div>
              {isSelf && (
                <button
                  type="button"
                  className="btn-edit-profile-icon"
                  onClick={() => setShowEditModal(true)}
                  title="Edit profile"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            <div className="profile-details-content">
              <div className="profile-name-headline">
                <h1 className="profile-full-name">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                <p className="profile-headline">{profileUser.headline}</p>
                <div className="profile-sub-meta">
                  {profileUser.location && (
                    <span className="profile-location">📍 {profileUser.location}</span>
                  )}
                  <span className="profile-connections-count">
                    👥 <strong>{profileUser.connections || 0}</strong> connections
                  </span>
                </div>
              </div>

              <div className="profile-cta-buttons">
                {isSelf ? (
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setShowEditModal(true)}
                  >
                    Edit Profile
                  </button>
                ) : connectionStatus === "accepted" ? (
                  <Link to="/messaging" className="btn-primary-action">
                    💬 Message
                  </Link>
                ) : connectionStatus === "pending" ? (
                  <button type="button" className="btn-secondary-action" disabled>
                    ⏳ Pending Request
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={handleConnect}
                  >
                    + Connect
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="card profile-section-card">
            <div className="section-card-header">
              <h2>About</h2>
              {isSelf && (
                <button
                  type="button"
                  className="btn-text-edit"
                  onClick={() => setShowEditModal(true)}
                >
                  ✏️
                </button>
              )}
            </div>
            <div className="section-card-body">
              {profileUser.about ? (
                <p className="profile-about-text">{profileUser.about}</p>
              ) : (
                <p className="profile-about-empty">
                  {isSelf
                    ? "Add a summary to introduce yourself to connections and recruiters."
                    : "No summary added yet."}
                </p>
              )}
            </div>
          </section>

          {/* Activity / Posts Section */}
          <section className="card profile-section-card">
            <div className="section-card-header">
              <h2>Activity</h2>
              <span className="activity-count">{userPosts.length} posts</span>
            </div>
            <div className="section-card-body">
              {userPosts.length > 0 ? (
                <div className="profile-posts-list">
                  {userPosts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onPostDeleted={(id) => setUserPosts((prev) => prev.filter((p) => p._id !== id))}
                      onPostUpdated={(up) => setUserPosts((prev) => prev.map((p) => (p._id === up._id ? up : p)))}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-activity">
                  <p>{isSelf ? "You haven't posted yet. Share an update to your network!" : "No recent activity."}</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Right Sidebar info */}
        <aside className="profile-side-column">
          <div className="card profile-stats-card">
            <h3>Profile Analytics</h3>
            <div className="stat-row">
              <span className="stat-label">Profile views</span>
              <span className="stat-value">124</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Post impressions</span>
              <span className="stat-value">580</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Search appearances</span>
              <span className="stat-value">42</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Intro</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="modal-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>First name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Last name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer at TechCorp"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Avatar / Profile Photo URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>About</label>
                <textarea
                  rows={4}
                  placeholder="Write a brief overview of your experience, skills, and background..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;