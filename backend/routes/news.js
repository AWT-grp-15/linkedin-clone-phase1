const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/technology", requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        message: "Could not fetch technology news."
      });
    }

    const articles = data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source?.name,
      publishedAt: article.publishedAt
    }));

    res.json({ articles });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Could not load technology news."
    });
  }
});

module.exports = router;