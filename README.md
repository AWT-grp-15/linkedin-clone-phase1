# LinkedIn Clone — Phase 1

A responsive LinkedIn-style clone built from the supplied HTML/CSS template, with:

- Responsive desktop/tablet/mobile UI
- Login and signup pages
- MongoDB Atlas + Mongoose
- Secure password hashing with bcrypt
- JWT authentication stored in an HttpOnly cookie
- Protected application pages
- Logout
- Profile editing
- Search members
- Create posts
- Like/unlike posts
- Home, Network, Jobs, Messaging, Notifications, Profile and Settings navigation

## 1. Requirements

- Node.js 18+
- A MongoDB Atlas cluster
- VS Code or another editor

## 2. Install

```bash
npm install
```

## 3. Configure MongoDB Atlas

Create a `.env` file from `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/linkedin_clone?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret-here
NODE_ENV=development
```

In MongoDB Atlas, make sure:
1. A database user exists.
2. Your current IP is allowed in Network Access.
3. The connection string uses the correct username/password.
4. The database name is `linkedin_clone` (or change it in the URI).

## 4. Run

Development:

```bash
npm run dev
```

Production-style:

```bash
npm start
```

Open:

http://localhost:5000

## Authentication flow

Signup -> server validates input -> password is hashed -> user is saved -> JWT is created -> JWT is stored in an HttpOnly cookie -> user enters the protected home page.

Login -> credentials are checked against the bcrypt hash -> JWT cookie is created -> user enters the protected home page.

Protected API requests use the cookie automatically. If the cookie is missing/expired, the frontend redirects to login.

## Project structure

```text
linkedin-clone/
├─ middleware/
│  └─ auth.js
├─ models/
│  ├─ User.js
│  └─ Post.js
├─ public/
│  ├─ css/style.css
│  ├─ js/app.js
│  ├─ js/auth.js
│  ├─ js/settings.js
│  ├─ index.html
│  ├─ login.html
│  ├─ signup.html
│  ├─ network.html
│  ├─ jobs.html
│  ├─ messaging.html
│  ├─ notifications.html
│  ├─ profile.html
│  └─ settings.html
├─ routes/
│  ├─ auth.js
│  ├─ posts.js
│  └─ users.js
├─ .env.example
├─ package.json
└─ server.js
```

## Phase 2 ideas

Connection requests, comments, real messaging, image uploads, notifications, job search, profile photos, email verification, password reset, and production deployment.
