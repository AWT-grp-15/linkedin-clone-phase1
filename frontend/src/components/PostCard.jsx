import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PostCard({ post, onPostDeleted, onPostUpdated }) {
  const { user } = useAuth();
  
  const isInitiallyLiked = Boolean(
    post.likes && user && post.likes.some((id) => (typeof id === "string" ? id === user._id : id.toString() === user._id?.toString()))
  );

  const [liked, setLiked] = useState(isInitiallyLiked);
  const [likeCount, setLikeCount] = useState(post.likes ? post.likes.length : 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Edit / Delete state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef(null);

  const isAuthor = Boolean(
    user && post.author && (post.author._id === user._id || post.author === user._id)
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleLike = async () => {
    if (!user) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likes);
      }
    } catch (err) {
      console.error("Like failed:", err);
      setLiked(liked);
      setLikeCount(post.likes?.length || 0);
    }
  };

  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/posts/${post._id}/comments`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || []);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: commentText.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setCommentsCount((prev) => prev + 1);
        setCommentText("");
      }
    } catch (err) {
      console.error("Comment submission failed:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        if (onPostDeleted) onPostDeleted(post._id);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() && !editImageUrl.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: editText.trim(), imageUrl: editImageUrl.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setIsEditing(false);
        if (onPostUpdated) onPostUpdated(data.post);
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const authorName = post.author
    ? `${post.author.firstName} ${post.author.lastName}`
    : "LinkedIn Member";
  const authorHeadline = post.author?.headline || "Professional";
  const authorProfileLink = post.author?._id ? `/profile/${post.author._id}` : "#";

  return (
    <article className="card post-card">
      <div className="post-header">
        <Link to={authorProfileLink} className="post-avatar-link">
          <div className="post-avatar">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt={authorName} />
            ) : (
              getInitials(post.author)
            )}
          </div>
        </Link>
        <div className="post-author-meta">
          <Link to={authorProfileLink} className="author-name-link">
            <h3 className="author-name">{authorName}</h3>
          </Link>
          <p className="author-headline">{authorHeadline}</p>
          <span className="post-time">
            {timeAgo(post.createdAt)} {post.edited && "• (edited)"} • 🌐
          </span>
        </div>

        {isAuthor && (
          <div className="post-author-actions" ref={menuRef}>
            <button
              type="button"
              className="post-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Post options"
            >
              •••
            </button>
            {showMenu && (
              <div className="post-dropdown-menu">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                >
                  ✏️ Edit post
                </button>
                <button
                  type="button"
                  className="delete-post-btn"
                  onClick={() => {
                    setShowMenu(false);
                    handleDeletePost();
                  }}
                >
                  🗑️ Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="post-body">
        {isEditing ? (
          <div className="post-edit-box">
            <textarea
              className="post-edit-textarea"
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <input
              type="url"
              className="post-edit-image-input"
              placeholder="Image URL (optional)"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />
            <div className="post-edit-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(post.text);
                  setEditImageUrl(post.imageUrl || "");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-post"
                disabled={isSaving || (!editText.trim() && !editImageUrl.trim())}
                onClick={handleSaveEdit}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="post-text">{post.text}</p>
            {post.imageUrl && (
              <div className="post-image-attachment">
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="post-metrics">
        <span className="metrics-likes">
          {likeCount > 0 && `👍 ${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
        </span>
        <button type="button" className="metrics-comments-btn" onClick={toggleComments}>
          {commentsCount > 0 ? `${commentsCount} comments` : "Comments"}
        </button>
      </div>

      <div className="post-action-bar">
        <button
          type="button"
          className={`action-btn ${liked ? "action-liked" : ""}`}
          onClick={handleLike}
        >
          <span className="action-icon">{liked ? "👍" : "👍🏻"}</span>
          <span>Like</span>
        </button>

        <button type="button" className="action-btn" onClick={toggleComments}>
          <span className="action-icon">💬</span>
          <span>Comment</span>
        </button>

        <button
          type="button"
          className="action-btn"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.origin);
              alert("Post link copied to clipboard!");
            }
          }}
        >
          <span className="action-icon">🔁</span>
          <span>Share</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-drawer">
          <form className="add-comment-form" onSubmit={handleCommentSubmit}>
            <div className="comment-user-avatar">{getInitials(user)}</div>
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submittingComment}
                >
                  {submittingComment ? "..." : "Comment"}
                </button>
              )}
            </div>
          </form>

          {loadingComments ? (
            <div className="comments-loading">Loading comments...</div>
          ) : comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment._id} className="comment-bubble-row">
                  <div className="comment-author-avatar">
                    {getInitials(comment.author)}
                  </div>
                  <div className="comment-bubble">
                    <div className="comment-bubble-header">
                      <strong>
                        {comment.author
                          ? `${comment.author.firstName} ${comment.author.lastName}`
                          : "User"}
                      </strong>
                      <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                    </div>
                    {comment.author?.headline && (
                      <p className="comment-headline">{comment.author.headline}</p>
                    )}
                    <p className="comment-body-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="comments-empty">Be the first to comment!</div>
          )}
        </div>
      )}
    </article>
  );
}

export default PostCard;
