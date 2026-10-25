const state = {
  user: null,
  posts: []
};

const $ = (selector) => document.querySelector(selector);

function initials(user) {
  return `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
}

function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function avatar(user, className = "avatar") {
  return `<div class="${className}">${escapeHtml(initials(user) || "U")}</div>`;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

async function getCurrentUser() {
  const data = await api("/api/auth/me");
  state.user = data.user;
  return data.user;
}

function renderNav() {
  const user = state.user;
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = `${user.firstName} ${user.lastName}`;
  });
  document.querySelectorAll("[data-user-headline]").forEach((el) => {
    el.textContent = user.headline || "Student | Technology Enthusiast";
  });
  document.querySelectorAll("[data-user-avatar]").forEach((el) => {
    el.outerHTML = avatar(user, el.className || "avatar");
  });
}

function setupMenu() {
  const button = $("#profileButton");
  const menu = $("#profileMenu");
  if (!button || !menu) return;

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.classList.toggle("open");
  });

  document.addEventListener("click", () => menu.classList.remove("open"));

  $("#logoutButton")?.addEventListener("click", async (event) => {
    event.preventDefault();
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login.html";
  });
}

function setupMobileNav() {
  const button = $("#mobileMenuButton");
  const nav = $("#mainNav");
  if (!button || !nav) return;

  button.addEventListener("click", () => nav.classList.toggle("open"));
}

function postCard(post) {
  const author = post.author;
  const liked = Array.isArray(post.likes) && post.likes.some((id) => String(id) === String(state.user._id));
  return `
    <article class="post-card" data-post-id="${post._id}">
     <div class="post-author">
  ${avatar(author)}

  <div class="post-author-info">
    <h3>
      ${escapeHtml(author.firstName)}
      ${escapeHtml(author.lastName)}
    </h3>

    <p>${escapeHtml(author.headline || "LinkedIn member")}</p>

    <small>${timeAgo(post.createdAt)}</small>
  </div>

  ${
    String(author._id) !== String(state.user._id)
      ? `
        <button
          class="connect-button"
          data-action="connect"
          data-user-id="${author._id}"
        >
          Connect
        </button>
      `
      : ""
  }
</div>
      <p class="post-text">${escapeHtml(post.text).replaceAll("\\n", "<br>")}</p>
      <div class="post-stats">
        <span>${post.likes?.length || 0} reactions</span>
        <span>${post.comments || 0} comments</span>
      </div>
    <div class="post-actions"> 
  <button class="post-action ${liked ? "liked" : ""}" data-action="like">
    👍 <span>Like</span>
  </button> 

  <button class="post-action" data-action="comment">
    💬 <span>Comment</span>
  </button> 

  <button class="post-action" data-action="share">
    ↗ <span>Share</span>
  </button> 

  <button class="post-action" data-action="send">
    ✉ <span>Send</span>
  </button> 
</div>

<div class="comments-section" data-comments-for="${post._id}"></div>
    </article>
  `;
}

async function loadPosts() {
  const feed = $("#feed");
  if (!feed) return;

  try {
    const data = await api("/api/posts");
    state.posts = data.posts;
    if (!data.posts.length) {
      feed.innerHTML = `<div class="empty-state"><div>📝</div><h3>Your feed is ready</h3><p>Create the first post and it will appear here.</p></div>`;
      return;
    }
    feed.innerHTML = data.posts.map(postCard).join("");
  } catch (error) {
    feed.innerHTML = `<div class="empty-state"><h3>Could not load the feed</h3><p>${escapeHtml(error.message)}</p></div>`;
  }
}
async function loadComments(postId) {
  const container = document.querySelector(
    `[data-comments-for="${postId}"]`
  );

  if (!container) return;

  try {
    const data = await api(`/api/posts/${postId}/comments`);

    container.innerHTML = `
      <div class="comment-list">

        ${
          data.comments.length
            ? data.comments.map(comment => `
                <div class="comment">

                  ${avatar(comment.author, "comment-avatar")}

                  <div class="comment-content">

                    <strong>
                      ${escapeHtml(comment.author.firstName)}
                      ${escapeHtml(comment.author.lastName)}
                    </strong>

                    <p>${escapeHtml(comment.text)}</p>

                    <small>
                      ${timeAgo(comment.createdAt)}
                    </small>

                  </div>

                </div>
              `).join("")
            : `<p class="no-comments">No comments yet.</p>`
        }

      </div>

      <form class="comment-form">

        <input
          type="text"
          class="comment-input"
          placeholder="Write a comment..."
          maxlength="1000"
          required
        >

        <button type="submit">
          Post
        </button>

      </form>
    `;

    const form = container.querySelector(".comment-form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const input = form.querySelector(".comment-input");
      const text = input.value.trim();

      if (!text) return;

      try {

        await api(`/api/posts/${postId}/comments`, {
          method: "POST",
          body: JSON.stringify({ text })
        });

        input.value = "";

        await loadComments(postId);

      } catch (error) {

        showToast(error.message, "error");

      }
    });

  } catch (error) {

    container.innerHTML = `
      <p class="comment-error">
        ${escapeHtml(error.message)}
      </p>
    `;

  }
}
function setupPosts() {
  async function loadComments(postId) {
  const container = document.querySelector(
    `[data-comments-for="${postId}"]`
  );

  if (!container) return;

  try {
    const data = await api(`/api/posts/${postId}/comments`);

    container.innerHTML = `
      <div class="comment-list">

        ${
          data.comments.length
            ? data.comments.map(comment => `
                <div class="comment">

                  ${avatar(comment.author, "comment-avatar")}

                  <div class="comment-content">

                    <strong>
                      ${escapeHtml(comment.author.firstName)}
                      ${escapeHtml(comment.author.lastName)}
                    </strong>

                    <p>${escapeHtml(comment.text)}</p>

                    <small>${timeAgo(comment.createdAt)}</small>

                  </div>

                </div>
              `).join("")
            : `<p class="no-comments">No comments yet.</p>`
        }

      </div>

      <form class="comment-form">

        <input
          type="text"
          class="comment-input"
          placeholder="Write a comment..."
          maxlength="1000"
          required
        >

        <button type="submit">Post</button>

      </form>
    `;

    const form = container.querySelector(".comment-form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const input = form.querySelector(".comment-input");
      const text = input.value.trim();

      if (!text) return;

      try {

await api(`/api/posts/${postId}/comments`, {
  method: "POST",
  body: JSON.stringify({ text })
});

input.value = "";

// Increment comment count
const card = document.querySelector(
  `[data-post-id="${postId}"]`
);

if (card) {
  const stats = card.querySelector(".post-stats");

  if (stats) {
    const commentCount = stats.children[1];

    const currentCount = parseInt(
      commentCount.textContent.match(/\d+/)?.[0] || "0"
    );

    commentCount.textContent = `${currentCount + 1} comments`;
  }
}

await loadComments(postId);

      } catch (error) {
        showToast(error.message, "error");
      }
    });

  } catch (error) {

    container.innerHTML = `
      <p class="comment-error">
        ${escapeHtml(error.message)}
      </p>
    `;

  }
}
  const form = $("#createPostForm");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const textarea = $("#postText");
    const text = textarea.value.trim();
    if (!text) return showToast("Write something before posting.", "error");

    const button = form.querySelector("button");
    button.disabled = true;

    try {
      await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({ text })
      });
      textarea.value = "";
      await loadPosts();
      showToast("Post published.");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });

  $("#feed")?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const card = button.closest("[data-post-id]");
    if (!card) return;

    if (button.dataset.action === "like") {
      try {
        await api(`/api/posts/${card.dataset.postId}/like`, { method: "POST" });
        await loadPosts();
      } catch (error) {
        showToast(error.message, "error");
      }
    }
    else if (button.dataset.action === "connect") {

  const userId = button.dataset.userId;

  try {

    await api(`/api/users/${userId}/connect`, {
      method: "POST"
    });

    button.textContent = "Pending";
    button.disabled = true;
    button.classList.add("pending");

    showToast("Connection request sent.");

  } catch (error) {

    showToast(error.message, "error");

  }
}
     else if (button.dataset.action === "comment") {

  const commentsSection = card.querySelector(".comments-section");

  if (commentsSection.classList.contains("open")) {

    commentsSection.innerHTML = "";
    commentsSection.classList.remove("open");

  } else {

    await loadComments(card.dataset.postId);
    commentsSection.classList.add("open");

  }

}
     else if (button.dataset.action === "share") {
      navigator.clipboard?.writeText(location.origin + "/index.html");
      showToast("Post link copied.");
    } else {
      showToast("Messaging is available from the Messaging page.");
    }
  });
}

function setupSearch() {
  const input = $("#globalSearch");
  const results = $("#searchResults");
  if (!input || !results) return;

  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) {
      results.classList.remove("show");
      results.innerHTML = "";
      return;
    }

    timer = setTimeout(async () => {
      try {
        const data = await api(`/api/users/search?q=${encodeURIComponent(q)}`);
        results.innerHTML = data.users.length
          ? data.users.map((u) => `<a href="profile.html"><strong>${escapeHtml(u.firstName)} ${escapeHtml(u.lastName)}</strong><span>${escapeHtml(u.headline || "")}</span></a>`).join("")
          : `<div class="search-empty">No members found</div>`;
        results.classList.add("show");
      } catch (error) {
        results.innerHTML = `<div class="search-empty">${escapeHtml(error.message)}</div>`;
        results.classList.add("show");
      }
    }, 250);
  });
}

async function bootProtectedPage() {
  try {

    await getCurrentUser();

    renderNav();
    setupMenu();
    setupMobileNav();
    setupSearch();
    setupPosts();

    await loadPosts();
    await loadTechNews();

    if ($("#connectionRequests")) {
  setupConnectionRequests();
  await loadConnectionRequests();
}

if ($("#connections")) {
  await loadConnections();
}

  } catch (_error) {

    location.href = "/login.html";

  }
}
async function loadTechNews() {
  const container = $("#techNews");

  if (!container) return;

  try {
    const data = await api("/api/news/technology");

    if (!data.articles.length) {
      container.innerHTML = `
        <div class="news-empty">
          No technology news available.
        </div>
      `;
      return;
    }

    container.innerHTML = data.articles
      .map(article => `
        <a
          class="news-item"
          href="${escapeHtml(article.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <b>${escapeHtml(article.title)}</b>

          <span>
            ${escapeHtml(article.source || "Technology News")}
            · ${timeAgo(article.publishedAt)}
          </span>
        </a>
      `)
      .join("");

  } catch (error) {

    container.innerHTML = `
      <div class="news-empty">
        Could not load news.
      </div>
    `;

  }
}
document.addEventListener("DOMContentLoaded", bootProtectedPage);
async function loadConnectionRequests() {
  const container = $("#connectionRequests");

  if (!container) return;

  try {
    const data = await api("/api/users/connection-requests");

    if (!data.requests.length) {
      container.innerHTML = `
        <div class="empty-network">
          <p>No pending invitations.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = data.requests.map(request => {

      const user = request.sender;

      return `
        <div
          class="connection-request"
          data-request-id="${request._id}"
        >

          ${avatar(user)}

          <div class="connection-info">

            <h3>
              ${escapeHtml(user.firstName)}
              ${escapeHtml(user.lastName)}
            </h3>

            <p>
              ${escapeHtml(
                user.headline || "LinkedIn member"
              )}
            </p>

            <small>
              ${timeAgo(request.createdAt)}
            </small>

          </div>

          <div class="connection-actions">

            <button
              class="accept-button"
              data-connection-action="accept"
              data-request-id="${request._id}"
            >
              Accept
            </button>

            <button
              class="ignore-button"
              data-connection-action="reject"
              data-request-id="${request._id}"
            >
              Ignore
            </button>

          </div>

        </div>
      `;

    }).join("");

  } catch (error) {

    container.innerHTML = `
      <p class="error-message">
        ${escapeHtml(error.message)}
      </p>
    `;

  }
}
async function loadConnections() {
  const container = $("#connections");

  if (!container) return;

  try {
    const data = await api("/api/users/connections");

    if (!data.connections.length) {
      container.innerHTML = `
        <div class="empty-network">
          <p>You don't have any connections yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.connections.map(user => `
      <div class="connection-request">

        ${avatar(user)}

        <div class="connection-info">

          <h3>
            ${escapeHtml(user.firstName)}
            ${escapeHtml(user.lastName)}
          </h3>

          <p>
            ${escapeHtml(
              user.headline || "LinkedIn member"
            )}
          </p>

          <small>
            ${escapeHtml(user.location || "")}
          </small>

        </div>

        <div>
          <button
            class="connect-button connected"
            disabled
          >
            Connected
          </button>
        </div>

      </div>
    `).join("");

  } catch (error) {

    container.innerHTML = `
      <p class="error-message">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}
function setupConnectionRequests() {

  $("#connectionRequests")?.addEventListener(
    "click",
    async (event) => {

      const button = event.target.closest(
        "[data-connection-action]"
      );

      if (!button) return;

      const action =
        button.dataset.connectionAction;

      const requestId =
        button.dataset.requestId;

      try {

        await api(
          `/api/users/connections/${requestId}/${action}`,
          {
            method: "POST"
          }
        );

        showToast(
          action === "accept"
            ? "Connection accepted."
            : "Invitation ignored."
        );

        await loadConnectionRequests();

      } catch (error) {

        showToast(
          error.message,
          "error"
        );

      }
    }
  );
}