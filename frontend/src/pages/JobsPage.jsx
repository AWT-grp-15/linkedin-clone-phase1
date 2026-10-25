import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkplace, setSelectedWorkplace] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'saved'
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedWorkplace !== "All") params.append("workplaceType", selectedWorkplace);
      if (selectedType !== "All") params.append("jobType", selectedType);

      const res = await fetch(`/api/jobs?${params.toString()}`, {
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0 && !selectedJob) {
          setSelectedJob(data.jobs[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedWorkplace, selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleApply = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, isApplied: true, applicantCount: (j.applicantCount || 0) + 1 } : j))
        );
        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob((prev) => ({
            ...prev,
            isApplied: true,
            applicantCount: (prev.applicantCount || 0) + 1
          }));
        }
      }
    } catch (err) {
      console.error("Apply failed:", err);
    }
  };

  const handleSave = async (jobId) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const data = await res.json();
        setJobs((prev) =>
          prev.map((j) => (j._id === jobId ? { ...j, isSaved: data.isSaved } : j))
        );
        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob((prev) => ({ ...prev, isSaved: data.isSaved }));
        }
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const displayedJobs = activeTab === "saved" ? jobs.filter((j) => j.isSaved) : jobs;

  return (
    <div className="jobs-page-container">
      {/* Search and Filters Bar */}
      <section className="card jobs-search-card">
        <form onSubmit={handleSearchSubmit} className="jobs-search-form">
          <div className="jobs-search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by job title, company, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-jobs-search">
            Search
          </button>
        </form>

        <div className="jobs-filters-row">
          <div className="filter-pill-group">
            <label>Workplace:</label>
            {["All", "Remote", "Hybrid", "On-site"].map((wp) => (
              <button
                key={wp}
                type="button"
                className={`filter-pill ${selectedWorkplace === wp ? "active" : ""}`}
                onClick={() => setSelectedWorkplace(wp)}
              >
                {wp}
              </button>
            ))}
          </div>

          <div className="filter-pill-group">
            <label>Job Type:</label>
            {["All", "Full-time", "Internship", "Contract"].map((jt) => (
              <button
                key={jt}
                type="button"
                className={`filter-pill ${selectedType === jt ? "active" : ""}`}
                onClick={() => setSelectedType(jt)}
              >
                {jt}
              </button>
            ))}
          </div>

          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Jobs ({jobs.length})
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              🔖 Saved ({jobs.filter((j) => j.isSaved).length})
            </button>
          </div>
        </div>
      </section>

      {/* Main Jobs Split Layout */}
      <div className="jobs-split-layout">
        {/* Left Jobs List */}
        <div className="jobs-list-column">
          {loading ? (
            <div className="card jobs-loading-card">
              <div className="loading-spinner"></div>
              <p>Searching open opportunities...</p>
            </div>
          ) : displayedJobs.length > 0 ? (
            displayedJobs.map((job) => (
              <div
                key={job._id}
                className={`card job-card-item ${selectedJob?._id === job._id ? "selected" : ""}`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="job-card-top">
                  <div className="job-company-badge">
                    {job.company?.[0]?.toUpperCase() || "J"}
                  </div>
                  <div className="job-card-titles">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company-name">{job.company}</p>
                    <p className="job-location-meta">
                      📍 {job.location} • <span className="workplace-tag">{job.workplaceType}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`btn-save-bookmark ${job.isSaved ? "saved" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(job._id);
                    }}
                    title={job.isSaved ? "Saved" : "Save Job"}
                  >
                    {job.isSaved ? "🔖" : "📑"}
                  </button>
                </div>
                <div className="job-card-badges">
                  <span className="job-salary-badge">{job.salary}</span>
                  <span className="job-type-badge">{job.jobType}</span>
                  {job.isApplied && <span className="job-applied-tag">Applied ✓</span>}
                </div>
              </div>
            ))
          ) : (
            <div className="card empty-jobs-card">
              <p>No jobs found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Right Job Details Pane */}
        {selectedJob && (
          <div className="jobs-detail-pane card">
            <div className="detail-pane-header">
              <h2>{selectedJob.title}</h2>
              <p className="detail-company">
                {selectedJob.company} • {selectedJob.location} ({selectedJob.workplaceType})
              </p>
              <div className="detail-meta-row">
                <span className="detail-salary">💰 {selectedJob.salary}</span>
                <span className="detail-type">💼 {selectedJob.jobType}</span>
                <span className="detail-applicants">👥 {selectedJob.applicantCount || 0} applicants</span>
              </div>
              <div className="detail-action-buttons">
                <button
                  type="button"
                  className={`btn-easy-apply ${selectedJob.isApplied ? "applied" : ""}`}
                  disabled={selectedJob.isApplied}
                  onClick={() => handleApply(selectedJob._id)}
                >
                  {selectedJob.isApplied ? "Applied ✓" : "Easy Apply"}
                </button>
                <button
                  type="button"
                  className={`btn-detail-save ${selectedJob.isSaved ? "saved" : ""}`}
                  onClick={() => handleSave(selectedJob._id)}
                >
                  {selectedJob.isSaved ? "Saved 🔖" : "Save Job"}
                </button>
              </div>
            </div>

            <hr className="detail-divider" />

            <div className="detail-pane-body">
              <h3>About the job</h3>
              <p className="job-description-text">{selectedJob.description}</p>
              
              <div className="job-perks-box">
                <h4>Role Highlights</h4>
                <ul>
                  <li>Direct collaboration with global engineering teams</li>
                  <li>Competitive benefits package and learning allowances</li>
                  <li>Modern tech stack: Node.js, React, Cloud microservices</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobsPage;