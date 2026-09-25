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
        <div>
          <h3>${escapeHtml(author.firstName)} ${escapeHtml(author.lastName)}</h3>
          <p>${escapeHtml(author.headline || "LinkedIn member")}</p>
          <small>${timeAgo(post.createdAt)}</small>
        </div>
      </div>
      <p class="post-text">${escapeHtml(post.text).replaceAll("\\n", "<br>")}</p>
      <div class="post-stats">
        <span>${post.likes?.length || 0} reactions</span>
        <span>${post.comments || 0} comments</span>
      </div>
      <div class="post-actions">
        <button class="post-action ${liked ? "liked" : ""}" data-action="like">👍 <span>Like</span></button>
        <button class="post-action" data-action="comment">💬 <span>Comment</span></button>
        <button class="post-action" data-action="share">↗ <span>Share</span></button>
        <button class="post-action" data-action="send">✉ <span>Send</span></button>
      </div>
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

function setupPosts() {
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
    } else if (button.dataset.action === "comment") {
      showToast("Comments are planned for the next phase.");
    } else if (button.dataset.action === "share") {
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
  } catch (_error) {
    location.href = "/login.html";
  }
}

document.addEventListener("DOMContentLoaded", bootProtectedPage);
