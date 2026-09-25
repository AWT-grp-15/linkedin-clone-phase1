const express = require("express");
const Post = require("../models/Post");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (_req, res) => {
  const posts = await Post.find()
    .populate("author", "firstName lastName headline location")
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ posts });
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Write something before posting." });
    }

    const post = await Post.create({ author: req.user._id, text });
    const populated = await post.populate("author", "firstName lastName headline location");

    res.status(201).json({ post: populated });
  } catch (_error) {
    res.status(400).json({ message: "Could not create the post." });
  }
});

router.post("/:id/like", requireAuth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found." });

  const index = post.likes.findIndex((id) => id.equals(req.user._id));
  if (index >= 0) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.json({ liked: index < 0, likes: post.likes.length });
});

module.exports = router;
