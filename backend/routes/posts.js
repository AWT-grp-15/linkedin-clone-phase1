const express = require("express");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const { requireAuth } = require("../middleware/auth");
const { createNotification } = require("../utils/notify");

const router = express.Router();

// Get all posts for feed
router.get("/", requireAuth, async (_req, res) => {
  const posts = await Post.find()
    .populate("author", "firstName lastName headline location")
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ posts });
});

// Get posts created by a specific user
router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate("author", "firstName lastName headline location")
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    res.status(400).json({ message: "Could not load user posts." });
  }
});

// Create a new post
router.post("/", requireAuth, async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    const imageUrl = String(req.body.imageUrl || "").trim();

    if (!text && !imageUrl) {
      return res.status(400).json({ message: "Post must have text or an image." });
    }

    const post = await Post.create({
      author: req.user._id,
      text: text || " ",
      imageUrl: imageUrl || ""
    });
    const populated = await post.populate("author", "firstName lastName headline location");

    res.status(201).json({ post: populated });
  } catch (_error) {
    res.status(400).json({ message: "Could not create the post." });
  }
});

// Update/Edit a post
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }

    const text = req.body.text !== undefined ? String(req.body.text).trim() : post.text;
    const imageUrl = req.body.imageUrl !== undefined ? String(req.body.imageUrl).trim() : post.imageUrl;

    post.text = text;
    post.imageUrl = imageUrl;
    post.edited = true;
    await post.save();

    const populated = await post.populate("author", "firstName lastName headline location");
    res.json({ post: populated });
  } catch (error) {
    res.status(400).json({ message: "Could not update post." });
  }
});

// Delete a post
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    if (String(post.author) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.json({ message: "Post deleted successfully.", id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: "Could not delete post." });
  }
});

// Get comments for a post
router.get("/:id/comments", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "firstName lastName headline location")
      .sort({ createdAt: -1 });

    res.json({ comments });
  } catch (error) {
    res.status(400).json({ message: "Could not load comments." });
  }
});

// Create comment
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const text = String(req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text
    });

    // Increment comments count on post
    post.comments = (post.comments || 0) + 1;
    await post.save();

    const populated = await comment.populate("author", "firstName lastName headline location");

    // Send notification to post author
    if (String(post.author) !== String(req.user._id)) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: "post_comment",
        message: `${req.user.firstName} ${req.user.lastName} commented on your post: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"`,
        link: "/"
      });
    }

    res.status(201).json({ comment: populated, commentsCount: post.comments });
  } catch (error) {
    res.status(400).json({ message: "Could not create comment." });
  }
});

// Like/unlike post
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const index = post.likes.findIndex((id) => id.equals(req.user._id));
    const isLiking = index < 0;

    if (!isLiking) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id);

      // Send notification to post author
      if (String(post.author) !== String(req.user._id)) {
        await createNotification({
          recipient: post.author,
          sender: req.user._id,
          type: "post_like",
          message: `${req.user.firstName} ${req.user.lastName} liked your post.`,
          link: "/"
        });
      }
    }

    await post.save();
    res.json({ liked: isLiking, likes: post.likes.length });
  } catch (error) {
    res.status(400).json({ message: "Could not process like." });
  }
});

module.exports = router;
