# 🚀 LinkedIn Clone — Comprehensive Project Walkthrough

A full-stack, responsive professional networking platform built with **React 19 + Vite**, **Express 5**, **Node.js**, and **MongoDB Atlas**, featuring modular components, real-time-style features, and a cohesive design system.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies Used | Port / URL |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, React Router DOM 7, Vanilla CSS System | `http://localhost:5173` |
| **Backend API** | Node.js, Express 5, Mongoose 8, Cookie-Parser, BcryptJS, JWT | `http://localhost:5000` |
| **Database** | MongoDB Atlas (Cloud Cluster with replica shards) | MongoDB SRV Connection |
| **Dev Proxy** | Vite Reverse Proxy (routes `/api/*` to `http://localhost:5000/api/*`) | Automatic |

---

## 📁 Repository Directory Structure

```text
linkedin-clone-phase1-main/
├── backend/
│   ├── middleware/
│   │   └── auth.js               # JWT verification & cookie authorization
│   ├── models/
│   │   ├── Comment.js            # Post comments schema
│   │   ├── Connection.js         # Peer connection requests & status
│   │   ├── Job.js                # Job postings, applicants, and saved status
│   │   ├── Message.js            # Direct 1-on-1 messages between members
│   │   ├── Notification.js       # User activity notifications
│   │   ├── Post.js               # Posts with media, likes, and comment counters
│   │   └── User.js               # Users, credentials hash, bio, and settings
│   ├── routes/
│   │   ├── auth.js               # Signup, login, logout, current user (/api/auth)
│   │   ├── jobs.js               # Job search, filters, apply, and save (/api/jobs)
│   │   ├── messages.js           # Conversations and direct chat history (/api/messages)
│   │   ├── news.js               # Technology headlines provider (/api/news)
│   │   ├── notifications.js      # List, mark read, and delete notifications (/api/notifications)
│   │   ├── posts.js              # Feed posts, media upload, edit, delete, like, comment (/api/posts)
│   │   └── users.js              # Network suggestions, connection requests, profile, password (/api/users)
│   ├── utils/
│   │   └── notify.js             # Automated event notification trigger utility
│   ├── .env                      # Database connection string and secrets
│   ├── package.json              # Backend dependencies and nodemon runner
│   └── server.js                 # Express server bootstrap & MongoDB connection
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreatePostCard.jsx  # Post editor with image URL support & preview
│   │   │   ├── Layout.jsx          # Shared layout wrapper with sticky Navbar
│   │   │   ├── Navbar.jsx          # Global navigation bar & profile dropdown
│   │   │   ├── NewsSidebar.jsx     # Right-hand trending industry news
│   │   │   ├── PostCard.jsx        # Rich post card with media, like, comments, edit/delete
│   │   │   ├── ProfileSidebar.jsx  # Left mini profile summary widget
│   │   │   └── SearchBar.jsx       # Real-time debounced typeahead member search
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global authentication provider & user state
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Main feed with sidebar layout
│   │   │   ├── JobsPage.jsx        # Jobs board with search, workplace/type filters, Easy Apply
│   │   │   ├── LoginPage.jsx       # Member login with credential validation
│   │   │   ├── MessagingPage.jsx   # 1-on-1 direct chat with contact list and bubbles
│   │   │   ├── NetworkPage.jsx     # Invitations, People You May Know, and My Connections
│   │   │   ├── NotificationsPage.jsx # Activity alerts, unread badges, mark-all-read
│   │   │   ├── ProfilePage.jsx     # Member profile hero, bio, edit modal, authored posts
│   │   │   ├── SettingsPage.jsx    # Dark Mode toggle, password change, account deletion
│   │   │   └── SignupPage.jsx      # New account registration
│   │   ├── App.css                 # Complete styling for expanded feature modules & Dark Mode
│   │   ├── App.jsx                 # Client-side router configuration
│   │   ├── index.css               # Core design tokens, typography, and base layout
│   │   └── main.jsx                # Application root mounting
│   ├── package.json                # Frontend dependencies (React 19, Vite, React Router)
│   └── vite.config.js              # Vite server & backend API proxy configuration
│
├── package.json                    # Workspace root scripts (dev:backend, dev:frontend)
└── WALKTHROUGH.md                  # This document
```

---

## 🌟 Detailed Feature Breakdown

### 1. 🔍 Live Search Bar with Dropdown
* **Frontend:** `frontend/src/components/SearchBar.jsx`
* **API:** `GET /api/users/search?q={query}`
* **Features:**
  * Debounced input (250ms) preventing unnecessary network requests.
  * Dropdown showing user avatar, full name, headline, and location.
  * Quick **"Connect"** button right inside the search results.
  * Direct navigation to `/profile/:userId` when clicking any member.
  * Auto-closes on outside click.

---

### 2. 🏠 Feed & Post Management
* **Frontend:** `HomePage.jsx`, `CreatePostCard.jsx`, `PostCard.jsx`
* **API:** `GET /api/posts`, `POST /api/posts`, `PATCH /api/posts/:id`, `DELETE /api/posts/:id`, `POST /api/posts/:id/like`, `POST /api/posts/:id/comments`
* **Features:**
  * **Media Attachments:** Paste an image URL in the post composer with live thumbnail preview and remove (`✕`) option.
  * **Feed Stream:** Displays posts with author details, timestamps, and attached media.
  * **Interactive Likes:** Instant optimistic UI update with like counter. Triggers an alert to the post author.
  * **Comments Drawer:** Slide-down drawer to view and submit comments with user initials and timestamps.
  * **Author Menu (`···`):** Post owners can edit post text/media inline or permanently delete their post.
  * **Sample Feed Fallback:** Displays starter posts when the database is empty so the initial view is never blank.

---

### 3. 👥 My Network Page
* **Frontend:** `frontend/src/pages/NetworkPage.jsx`
* **API:** `/api/users/suggestions`, `/api/users/connection-requests`, `/api/users/:id/connect`, `/api/users/connections/:id/accept`, `/api/users/connections/:id/reject`, `/api/users/connections`
* **Features:**
  * **Pending Invitations:** Displays received connection requests with **Accept** and **Ignore** buttons.
  * **People You May Know:** Recommended contacts grid filtering out self, existing connections, and pending requests.
  * **One-Click Connect:** `+ Connect` button immediately transitions to `Pending` without page reload.
  * **My Connections Tab:** Shows total connection count, searchable connection rows, and a **`💬 Message`** shortcut.

---

### 4. 👤 Profile & Edit Intro
* **Frontend:** `frontend/src/pages/ProfilePage.jsx`
* **API:** `GET /api/users/profile/:userId`, `PATCH /api/users/me`, `GET /api/posts/user/:userId`
* **Features:**
  * Supports viewing your own profile (`/profile`) or any member (`/profile/:userId`).
  * **Hero Header:** Gradient banner, avatar badge, full name, headline, location, and connection counter.
  * **Contextual CTAs:** **"Edit Profile"** for self; **"+ Connect"**, **"Pending"**, or **"Message"** for others.
  * **Edit Modal:** Form to update first name, last name, headline, location, avatar URL, and About/bio summary.
  * **Authored Activity:** Filtered stream displaying only posts created by this user.
  * **Analytics Card:** Views, impressions, and search appearance metrics.

---

### 5. 💼 Jobs Board
* **Frontend:** `frontend/src/pages/JobsPage.jsx`
* **Backend:** `backend/models/Job.js`, `backend/routes/jobs.js`
* **API:** `GET /api/jobs`, `POST /api/jobs/:id/apply`, `POST /api/jobs/:id/save`
* **Features:**
  * **Auto-Seeding:** Automatically seeds realistic listings from Google, Microsoft, Stripe, AWS, Canva, and Atlassian if none exist.
  * **Search & Filters:** Real-time search query + workplace filters (`Remote`, `Hybrid`, `On-site`) + job type filters (`Full-time`, `Internship`, `Contract`).
  * **Split Layout:** Interactive job list on the left with a sticky detail pane on the right showing salary, full description, and role highlights.
  * **Easy Apply:** Instant application submission with `Applied ✓` badge.
  * **Saved Jobs:** Bookmark jobs with `🔖` and toggle between **All Jobs** and **Saved Jobs**.

---

### 6. 🔔 Notifications Center
* **Frontend:** `frontend/src/pages/NotificationsPage.jsx`
* **Backend:** `backend/models/Notification.js`, `backend/routes/notifications.js`, `backend/utils/notify.js`
* **API:** `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`, `DELETE /api/notifications/:id`
* **Features:**
  * **Automated Event Triggers:** Creates notifications when someone likes your post, comments, sends a connection request, or accepts your request.
  * **Filter Tabs:** Toggle between **All Notifications** and **Unread**.
  * **Unread Indicators:** Blue highlight and badge count for unread alerts.
  * **Quick Actions:** Click any alert to navigate to the link and mark as read; **"Mark all as read"** button; individual delete (`✕`).

---

### 7. 💬 1-on-1 Direct Messaging
* **Frontend:** `frontend/src/pages/MessagingPage.jsx`
* **Backend:** `backend/models/Message.js`, `backend/routes/messages.js`
* **API:** `GET /api/messages/conversations`, `GET /api/messages/:userId`, `POST /api/messages/:userId`
* **Features:**
  * **Conversation Sidebar:** Lists contacts with message history or accepted connections, with avatar, last message preview, and unread badges.
  * **Contact Search:** Filter conversations by contact name.
  * **Active Chat View:** Shows recipient meta, profile shortcut, and chat history.
  * **Message Bubbles:** Color-coded (blue for sender on right, gray for recipient on left) with timestamps.
  * **Smooth Auto-Scroll:** Always scrolls into view upon new message arrival.

---

### 8. ⚙️ Account Settings & Dark Mode
* **Frontend:** `frontend/src/pages/SettingsPage.jsx`
* **API:** `POST /api/users/change-password`, `DELETE /api/users/account`
* **Features:**
  * **Dark Mode Toggle:** Animated switch that applies `.dark-mode` to `document.body` and persists in `localStorage`.
  * **Account Overview:** Displays full name, email, headline, and location.
  * **Password Change:** Secure password modification with current password verification via bcrypt.
  * **Danger Zone:** Permanently close account with cascading deletion of all posts, comments, connections, messages, and notifications.

---

## 🗺️ API Route Reference

| Module | Method & Route | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/auth/signup` | Register new member account |
| **Auth** | `POST /api/auth/login` | Authenticate and issue JWT cookie |
| **Auth** | `GET /api/auth/me` | Fetch currently authenticated user |
| **Auth** | `POST /api/auth/logout` | Clear auth cookie |
| **Posts** | `GET /api/posts` | Get feed posts |
| **Posts** | `POST /api/posts` | Create new post (supports text + imageUrl) |
| **Posts** | `PATCH /api/posts/:id` | Edit post text or media (author only) |
| **Posts** | `DELETE /api/posts/:id` | Delete post (author only) |
| **Posts** | `GET /api/posts/user/:userId` | Get posts authored by specific user |
| **Posts** | `POST /api/posts/:id/like` | Like or unlike a post |
| **Posts** | `GET /api/posts/:id/comments` | Fetch comments for a post |
| **Posts** | `POST /api/posts/:id/comments` | Add a comment to a post |
| **Users** | `GET /api/users/search?q=` | Search members by name or headline |
| **Users** | `GET /api/users/suggestions` | Suggested connections (people you may know) |
| **Users** | `GET /api/users/profile/:userId` | View user profile & connection status |
| **Users** | `PATCH /api/users/me` | Update current user profile / bio |
| **Users** | `POST /api/users/:id/connect` | Send connection request |
| **Users** | `GET /api/users/connection-requests` | View incoming pending invitations |
| **Users** | `POST /api/users/connections/:id/accept` | Accept connection request |
| **Users** | `POST /api/users/connections/:id/reject` | Reject/ignore connection request |
| **Users** | `GET /api/users/connections` | List all established connections |
| **Users** | `POST /api/users/change-password` | Change user password |
| **Users** | `DELETE /api/users/account` | Permanently delete account and all data |
| **Jobs** | `GET /api/jobs` | Search and filter jobs |
| **Jobs** | `POST /api/jobs/:id/apply` | Apply to a job listing |
| **Jobs** | `POST /api/jobs/:id/save` | Save or unsave a job listing |
| **Notifications** | `GET /api/notifications` | Get user notifications & unread count |
| **Notifications** | `PATCH /api/notifications/:id/read` | Mark single notification as read |
| **Notifications** | `POST /api/notifications/read-all` | Mark all notifications as read |
| **Notifications** | `DELETE /api/notifications/:id` | Delete notification |
| **Messages** | `GET /api/messages/conversations` | List active conversations |
| **Messages** | `GET /api/messages/:userId` | Get message history with user |
| **Messages** | `POST /api/messages/:userId` | Send direct message to user |

---

## 🚀 Running the Project

### 1. Start Both Services from Root:
```bash
# Terminal 1: Start Backend Server (Port 5000)
npm run dev:backend

# Terminal 2: Start Frontend Dev Server (Port 5173)
npm run dev:frontend
```

### 2. Access the Application:
* **Frontend App:** [http://localhost:5173](http://localhost:5173)
* **Backend Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
