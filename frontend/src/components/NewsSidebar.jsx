import { useState, useEffect } from "react";

const FALLBACK_NEWS = [
  {
    title: "AI agents take center stage in full-stack engineering",
    source: "TechCrunch",
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    readers: "4,210 readers"
  },
  {
    title: "JavaScript and React ecosystem trends for 2026",
    source: "Hacker News",
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    readers: "2,845 readers"
  },
  {
    title: "MongoDB Atlas enhances serverless scaling performance",
    source: "Database Digest",
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    readers: "1,920 readers"
  },
  {
    title: "Remote tech hiring rebounds across engineering hubs",
    source: "Bloomberg Technology",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    readers: "3,114 readers"
  },
  {
    title: "Open-source developer tool adoption hits all-time high",
    source: "InfoWorld",
    publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    readers: "1,550 readers"
  }
];

function NewsSidebar() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news/technology", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.articles && data.articles.length > 0) {
            setArticles(data.articles.slice(0, 5));
            return;
          }
        }
      } catch (err) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
      setArticles(FALLBACK_NEWS);
    }

    fetchNews();
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return "recent";
    const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    return `${hours}h ago`;
  };

  return (
    <aside className="right-sidebar">
      <div className="card news-card">
        <div className="news-header">
          <h3>LinkedIn News</h3>
          <span className="news-info-icon" title="Top trending technology stories">ℹ</span>
        </div>
        <p className="news-subhead">Top technology stories</p>

        {loading ? (
          <div className="news-loading">Loading top stories...</div>
        ) : (
          <ul className="news-list">
            {articles.map((item, idx) => (
              <li key={idx} className="news-item">
                <a 
                  href={item.url || "#"} 
                  target={item.url ? "_blank" : "_self"} 
                  rel="noreferrer"
                  className="news-link"
                >
                  <strong className="news-title">{item.title}</strong>
                  <span className="news-meta">
                    {timeAgo(item.publishedAt)} • {item.readers || `${item.source || "Tech"} • Trending`}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card puzzle-card">
        <div className="puzzle-header">
          <span className="puzzle-badge">NEW</span>
          <h4>Today's Puzzle</h4>
        </div>
        <p className="puzzle-desc">Tango: Harmonic daily brain workout</p>
        <button type="button" className="puzzle-btn">Play now</button>
      </div>

      <footer className="footer-links">
        <div className="links-row">
          <a href="#">About</a>
          <a href="#">Accessibility</a>
          <a href="#">Help Center</a>
        </div>
        <div className="links-row">
          <a href="#">Privacy & Terms</a>
          <a href="#">Ad Choices</a>
          <a href="#">Advertising</a>
        </div>
        <p className="copyright-text">LinkedIn Corporation © 2026</p>
      </footer>
    </aside>
  );
}

export default NewsSidebar;
