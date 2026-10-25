import { useState, useEffect } from "react";
import ProfileSidebar from "../components/ProfileSidebar";
import CreatePostCard from "../components/CreatePostCard";
import PostCard from "../components/PostCard";
import NewsSidebar from "../components/NewsSidebar";
import { useAuth } from "../context/AuthContext";

const SAMPLE_POSTS = [
  {
    _id: "sample-1",
    author: {
      firstName: "Satya",
      lastName: "Nadella",
      headline: "Chairman and CEO at Microsoft",
      location: "Redmond, WA"
    },
    text: "Excited about the possibilities of AI in empowering every person and every organization on the planet to achieve more. Innovation is happening at an unprecedented pace!",
    likes: ["u1", "u2", "u3"],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    _id: "sample-2",
    author: {
      firstName: "Sarah",
      lastName: "Chen",
      headline: "Senior Software Engineer @ TechCorp | Distributed Systems",
      location: "San Francisco, CA"
    },
    text: "Thrilled to share that our team just migrated our real-time notification engine to Node.js and MongoDB with zero downtime! 🚀\n\nKey takeaways:\n1. Plan rollbacks in advance\n2. Keep database connections warm\n3. Thorough staging integration tests.",
    likes: ["u1", "u4"],
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  }
];

function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPosts() {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
          return;
        }
      }
    } catch (err) {
      console.log("Could not load backend posts, using sample feed:", err.message);
    } finally {
      setLoading(false);
    }

    // Default to sample posts if empty or backend is waiting on DB config
    setPosts(SAMPLE_POSTS);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  };

  return (
    <div className="linkedin-home-container">
      <div className="home-grid">
        {/* Left Profile Sidebar */}
        <ProfileSidebar />

        {/* Center Main Feed */}
        <section className="main-feed-column">
          <CreatePostCard onPostCreated={handlePostCreated} />

          <div className="feed-sort-divider">
            <hr />
            <button type="button" className="sort-btn">
              Sort by: <strong>Top ▼</strong>
            </button>
          </div>

          {loading ? (
            <div className="card loading-feed-card">
              <div className="loading-spinner"></div>
              <p>Loading your feed...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="posts-stream">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostDeleted={handlePostDeleted}
                  onPostUpdated={handlePostUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="card empty-feed-card">
              <div className="empty-icon">📰</div>
              <h3>No posts yet</h3>
              <p>Be the first to share an update with your professional community!</p>
            </div>
          )}
        </section>

        {/* Right News Sidebar */}
        <NewsSidebar />
      </div>
    </div>
  );
}

export default HomePage;