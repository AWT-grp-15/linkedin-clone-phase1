import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function CreatePostCard({ onPostCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (u) => {
    if (!u) return "U";
    return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imageUrl.trim()) || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          text: text.trim(),
          imageUrl: imageUrl.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to publish post.");
      }

      setText("");
      setImageUrl("");
      setShowImageInput(false);
      setIsExpanded(false);
      if (onPostCreated) {
        onPostCreated(data.post);
      }
    } catch (err) {
      setError(err.message || "Could not publish post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card create-post-card">
      <div className="create-post-top">
        <div className="create-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="You" />
          ) : (
            getInitials(user)
          )}
        </div>
        <textarea
          className="create-post-input"
          rows={isExpanded ? 3 : 1}
          placeholder={user ? `Start a post, ${user.firstName}...` : "Start a post (Log in to publish)..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsExpanded(true)}
        />
      </div>

      {showImageInput && (
        <div className="post-image-input-container">
          <input
            type="url"
            placeholder="Paste an image URL (e.g. https://...)..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="post-image-url-field"
          />
          {imageUrl && (
            <div className="post-image-preview">
              <img
                src={imageUrl}
                alt="Preview"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <button
                type="button"
                className="remove-img-btn"
                onClick={() => setImageUrl("")}
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="post-error-banner">{error}</div>}

      <div className="create-post-actions">
        <div className="media-buttons">
          <button
            type="button"
            className={`media-btn ${showImageInput ? "active" : ""}`}
            title="Add Image URL"
            onClick={() => {
              setIsExpanded(true);
              setShowImageInput(!showImageInput);
            }}
          >
            <span className="media-icon" style={{ color: "#378fe9" }}>📷</span>
            <span>Media</span>
          </button>
          <button
            type="button"
            className="media-btn"
            title="Write article"
            onClick={() => setIsExpanded(true)}
          >
            <span className="media-icon" style={{ color: "#e06847" }}>📰</span>
            <span>Article</span>
          </button>
        </div>

        {isExpanded && (
          <div className="post-submit-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setIsExpanded(false);
                setText("");
                setImageUrl("");
                setShowImageInput(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-post"
              disabled={(!text.trim() && !imageUrl.trim()) || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatePostCard;
