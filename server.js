const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);

require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "linkedin-clone" });
});

app.get("*splat", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Add it to .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas connected");
    app.listen(PORT, () => {
      console.log(`LinkedIn clone running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

start();
