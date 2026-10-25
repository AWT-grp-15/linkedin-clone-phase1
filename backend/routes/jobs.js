const express = require("express");
const Job = require("../models/Job");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const SEED_JOBS = [
  {
    title: "Senior Full Stack Engineer",
    company: "Stripe",
    location: "Bengaluru, India (Remote)",
    workplaceType: "Remote",
    jobType: "Full-time",
    salary: "$120,000 - $160,000 / yr",
    description: "Join our core payments infrastructure team building reliable, low-latency APIs and resilient web platforms in Node.js, React, and distributed cloud services."
  },
  {
    title: "Frontend Developer (React / Next.js)",
    company: "Microsoft",
    location: "Hyderabad, India",
    workplaceType: "Hybrid",
    jobType: "Full-time",
    salary: "$90,000 - $130,000 / yr",
    description: "Build delightful, accessible user experiences for millions of enterprise customers worldwide. Deep expertise in modern TypeScript, React, and CSS architecture required."
  },
  {
    title: "Backend Engineer - Scaled Distributed Systems",
    company: "Amazon Web Services",
    location: "Bengaluru, India",
    workplaceType: "On-site",
    jobType: "Full-time",
    salary: "$110,000 - $150,000 / yr",
    description: "Architect high-throughput databases and cloud messaging solutions. Work with MongoDB, DynamoDB, Kafka, and microservices."
  },
  {
    title: "Product Designer (UI/UX)",
    company: "Canva",
    location: "Remote",
    workplaceType: "Remote",
    jobType: "Full-time",
    salary: "$85,000 - $115,000 / yr",
    description: "Design world-class collaborative creation experiences. We are looking for designers obsessed with typography, micro-interactions, and design systems."
  },
  {
    title: "Software Engineering Intern - Summer 2026",
    company: "Google",
    location: "Bengaluru, India",
    workplaceType: "Hybrid",
    jobType: "Internship",
    salary: "$40,000 - $60,000 / yr",
    description: "Exciting 3-month internship building AI-powered developer workflows. Open to students and recent graduates with strong data structures and algorithms fundamentals."
  },
  {
    title: "Cloud DevOps & Platform Engineer",
    company: "Atlassian",
    location: "Bengaluru, India (Hybrid)",
    workplaceType: "Hybrid",
    jobType: "Full-time",
    salary: "$95,000 - $140,000 / yr",
    description: "Automate CI/CD pipelines, Kubernetes clusters, and observability stacks for mission-critical developer collaboration tools."
  }
];

// Seed jobs if none exist
async function ensureJobsExist() {
  try {
    const count = await Job.countDocuments();
    if (count === 0) {
      await Job.insertMany(SEED_JOBS);
    }
  } catch (err) {
    console.error("Could not seed initial jobs:", err.message);
  }
}

// Get all jobs with optional search and filters
router.get("/", requireAuth, async (req, res) => {
  try {
    await ensureJobsExist();

    const { q, workplaceType, jobType } = req.query;
    const query = {};

    if (q) {
      const regex = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: regex }, { company: regex }, { location: regex }, { description: regex }];
    }

    if (workplaceType && workplaceType !== "All") {
      query.workplaceType = workplaceType;
    }

    if (jobType && jobType !== "All") {
      query.jobType = jobType;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    const formatted = jobs.map((job) => {
      const isApplied = job.applicants.some((id) => id.equals(req.user._id));
      const isSaved = job.savedBy.some((id) => id.equals(req.user._id));
      return {
        ...job.toObject(),
        isApplied,
        isSaved,
        applicantCount: job.applicants.length
      };
    });

    res.json({ jobs: formatted });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch jobs." });
  }
});

// Apply to a job (toggle/submit)
router.post("/:id/apply", requireAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    const index = job.applicants.findIndex((id) => id.equals(req.user._id));
    if (index >= 0) {
      return res.status(400).json({ message: "You have already applied for this job." });
    }

    job.applicants.push(req.user._id);
    await job.save();

    res.json({ message: "Application submitted successfully!", isApplied: true, applicantCount: job.applicants.length });
  } catch (error) {
    res.status(500).json({ message: "Could not apply for job." });
  }
});

// Save or unsave a job
router.post("/:id/save", requireAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    const index = job.savedBy.findIndex((id) => id.equals(req.user._id));
    let isSaved = false;

    if (index >= 0) {
      job.savedBy.splice(index, 1);
      isSaved = false;
    } else {
      job.savedBy.push(req.user._id);
      isSaved = true;
    }

    await job.save();
    res.json({ message: isSaved ? "Job saved." : "Job unsaved.", isSaved });
  } catch (error) {
    res.status(500).json({ message: "Could not save job." });
  }
});

module.exports = router;
