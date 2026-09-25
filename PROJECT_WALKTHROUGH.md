# LinkedIn Clone Phase 1 — Beginner-Friendly Walkthrough

Welcome! This document is a very gentle, step-by-step explanation of this project.

If you are brand new to coding, think of this app like a tiny social media website that lets a person:

- sign up
- log in
- open the home page
- create posts
- like posts
- update their profile

It is not a full LinkedIn yet, but it already has the main building blocks.

---

## 1. What this project is trying to do

This project is a simple clone of a LinkedIn-style app.

It has three big pieces:

1. A frontend (the pages you see in the browser)
2. A backend (the logic that runs behind the scenes)
3. A database (where user and post information is stored)

You can imagine it like this:

- Browser = the student looking at the app
- Server = the teacher running the app
- Database = the notebook where information is saved
- Routes = the doors or paths the student uses to reach different rooms
- Cookies = little pass tickets that say, “this user is logged in”

---

## 2. The big picture of the app

When a user opens the app, this usually happens:

1. The browser loads a page like login or signup
2. The user enters their details
3. The server checks if the details are correct
4. If correct, the server gives the user a login token
5. The browser stores that token in a cookie
6. The user can now access protected pages like the home feed

So the app is really doing two major jobs:

- helping users log in and stay logged in
- letting users read and create posts

---

## 3. The main folders and what they mean

Here is the project structure in plain English:

- public/ = all the pages and frontend files the browser uses
- routes/ = the API endpoints that handle requests
- models/ = the “shape” of data stored in MongoDB
- middleware/ = special helper code for authentication
- server.js = the main server file that starts everything
- package.json = the file that lists the project dependencies

Let us go through each one.

---

## 4. The entry point: server.js

The file [server.js](server.js) is the heart of the project.

It does a few important things:

- loads environment variables from .env
- sets up Express, which is the web server framework
- connects to MongoDB using Mongoose
- starts listening on a port such as 5000
- tells the app where to find the frontend files
- connects the API routes

A very simple way to think about it:

server.js is the manager that says:

- “Start the app”
- “Connect to the database”
- “Open the doors for API requests”
- “Serve the website pages”

### What happens in server.js

- It creates an Express app
- It tells Express to read JSON data from requests
- It uses cookie-parser so cookies can be read and written
- It mounts the auth, user, and post routes
- It serves files from the public folder
- It exposes a health check route at /health

If you are learning, remember this:

- server.js = the main starter file
- routes = the place where specific requests are handled

---

## 5. The frontend: the public folder

The [public](public) folder contains everything the browser sees.

This is where the HTML, CSS, and JavaScript live.

### Important frontend files

- [public/index.html](public/index.html) = the home page for the app
- [public/login.html](public/login.html) = the login page
- [public/signup.html](public/signup.html) = the signup page
- [public/css/style.css](public/css/style.css) = the styling for the whole UI
- [public/js/auth.js](public/js/auth.js) = handles login and signup on the browser side
- [public/js/app.js](public/js/app.js) = handles the logged-in home page and feed
- [public/js/settings.js](public/js/settings.js) = handles profile editing

### What the browser pages are for

- login page: lets a user sign in
- signup page: lets a new user create an account
- home page: shows the feed and lets users create and like posts
- settings page: lets a user edit profile details

This project is mostly frontend-driven, but the frontend is not doing everything on its own. It talks to the backend through APIs.

---

## 6. The auth flow: how login and signup work

This is one of the most important parts of the app.

Let us follow a user step by step.

### A. Signup flow

When a user opens the signup page:

1. They fill in their first name, last name, email, password, and optionally headline/location
2. The browser sends this information to the backend route /api/auth/signup
3. The server checks if the email already exists
4. If the email is new, it hashes the password using bcrypt
5. It saves the new user to MongoDB
6. It creates a JWT token
7. It stores that token in an HttpOnly cookie
8. The user is redirected to the home page

### B. Login flow

When a user logs in:

1. The browser sends the email and password to /api/auth/login
2. The server looks up the user in the database
3. It compares the entered password with the stored hashed password using bcrypt
4. If it matches, it creates a new JWT token
5. It stores the token in a cookie
6. The user is allowed into the app

### C. Why cookies matter

A cookie is like a little pass that says, “this person is logged in.”

The server reads that cookie on later requests to decide whether the user is allowed to visit protected endpoints.

---

## 7. The route files: the API doors

The [routes](routes) folder contains the endpoints the browser calls.

### [routes/auth.js](routes/auth.js)

This is the route file for authentication.

It handles:

- /api/auth/signup
- /api/auth/login
- /api/auth/logout
- /api/auth/me

It is responsible for making sure users can create accounts, log in, and stay authenticated.

### [routes/users.js](routes/users.js)

This file handles user-related actions.

It handles:

- getting the current user profile
- updating profile details
- searching for other users

### [routes/posts.js](routes/posts.js)

This file handles posts.

It handles:

- getting all posts
- creating a new post
- liking or unliking a post

If you are learning APIs, remember this:

- routes = the “endpoints” that receive requests
- the browser calls these endpoints with fetch or AJAX

---

## 8. The middleware: the security helper

The [middleware/auth.js](middleware/auth.js) file is a helper file used to protect routes.

It contains the logic for:

- creating JWT tokens
- putting the token in a cookie
- checking whether the token is valid
- attaching the authenticated user to the request object

The important function here is requireAuth.

That function says:

- “Do I see a valid token?”
- “If yes, continue”
- “If no, stop and say the user is not authenticated”

This is how the app keeps private pages protected.

---

## 9. The models: the database blueprints

The [models](models) folder defines the shape of the data in MongoDB.

### [models/User.js](models/User.js)

This file defines what a user document looks like.

A user has fields like:

- firstName
- lastName
- email
- passwordHash
- headline
- location
- connections

The password is not stored as plain text. It is stored as a hashed string.

That is important because a real app must never store passwords directly in plain text.

### [models/Post.js](models/Post.js)

This file defines what a post looks like.

A post has:

- an author
- text content
- likes
- comments count
- timestamps

This means each post belongs to a user and can be liked by users.

---

## 10. The frontend JavaScript: what each file does

### [public/js/auth.js](public/js/auth.js)

This file is used on the login and signup pages.

It handles:

- form validation
- sending signup/login requests to the backend
- showing error or success messages
- redirecting the user after login/signup

It is the “middleman” between the browser form and the API.

### [public/js/app.js](public/js/app.js)

This is the big frontend file for the home page.

It handles:

- loading the logged-in user
- rendering the navigation and profile details
- showing the post feed
- creating a new post
- liking a post
- searching for members
- logging out

If you want to change what the home page does, this file is very important.

### [public/js/settings.js](public/js/settings.js)

This file is for the settings page.

It loads the current user profile and sends updated profile values to the backend.

---

## 11. A simple “request journey” example

Let us imagine a user logs in.

Here is the full path:

1. The user types email and password into the login form
2. [public/js/auth.js](public/js/auth.js) collects the values
3. The browser sends a POST request to /api/auth/login
4. [routes/auth.js](routes/auth.js) receives the request
5. It looks up the user in MongoDB
6. It checks the password using bcrypt
7. On success, it creates a JWT token
8. It stores the token in a cookie
9. The frontend redirects to the home page
10. [public/js/app.js](public/js/app.js) runs
11. It calls /api/auth/me to get the current user
12. The server verifies the cookie using middleware
13. The app shows the user’s name and feed

That is the core flow of the app.

---

## 12. What the database is doing behind the scenes

This project uses MongoDB Atlas through Mongoose.

That means:

- the app talks to a remote database
- data is stored as documents (kind of like JSON objects)
- the app can read, create, update, and search records

The two main collections are:

- users
- posts

A user document holds profile information.

A post document holds the post content and who authored it.

---

## 13. How to run this project locally

Before running it, make sure you have:

- Node.js installed
- a MongoDB Atlas cluster ready
- an environment file with your database connection string

### Step 1: install dependencies

Run:

```bash
npm install
```

### Step 2: create your .env file

The project already has [.env.example](.env.example). Use it as a starting point.

Your file should include at least:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=some-long-secret-string
NODE_ENV=development
```

### Step 3: start the server

Run:

```bash
npm run dev
```

Then open:

```text
http://localhost:5000
```

If the database connection string is missing or wrong, the server will not start properly.

---

## 14. A very simple user story

Here is how the app feels from a user’s point of view:

1. A person opens the app
2. They see a login or signup page
3. They create an account
4. The app remembers them
5. They land on the home feed
6. They write a post
7. The post appears in the feed
8. They can like it
9. They can update their profile in settings

That is the whole experience in a tiny nutshell.

---

## 15. What is already built

This phase already includes:

- responsive UI
- login and signup pages
- password hashing
- JWT-based authentication
- protected routes
- logout
- profile editing
- member search
- post creation
- liking posts

That is a lot for a starter project.

---

## 16. What you might want to change next

If you want to extend the project, here are some natural next steps:

- add comments to posts
- add real-time messaging
- add profile photos
- add connection requests
- add notifications
- add image uploads
- add password reset

These would make the app feel more like a real social network.

---

## 17. Quick cheat sheet: “Which file should I edit?”

Here is a quick starter guide:

- Want to change login/signup behavior? Edit [public/js/auth.js](public/js/auth.js)
- Want to change the home feed or post actions? Edit [public/js/app.js](public/js/app.js)
- Want to change profile editing? Edit [public/js/settings.js](public/js/settings.js)
- Want to change how auth works? Edit [routes/auth.js](routes/auth.js) or [middleware/auth.js](middleware/auth.js)
- Want to change the data shape for users? Edit [models/User.js](models/User.js)
- Want to change the data shape for posts? Edit [models/Post.js](models/Post.js)
- Want to add a new API endpoint? Add a new route file or update an existing route file in [routes](routes)

---

## 18. Final summary

If you strip everything down, this project is really just this:

- the browser displays pages
- the server receives requests
- the database stores data
- authentication keeps users safe and logged in
- the app lets people create and interact with posts

That is the core idea.

If you understand these pieces, you already understand the main architecture of the project.

If you want, I can also turn this into a more visual “diagram-style walkthrough” or a file-by-file code explanation next.
