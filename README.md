# InternHub — University Internship Platform

InternHub connects university students with internships and projects. Students browse and apply to listings, mentors assign and grade project work, companies post internships and review applicants, and an admin approves accounts and oversees the platform. The app is a server-rendered Express application with a clean separation of templates (EJS), styles (CSS), and behavior (JS), progressively enhanced with `fetch`-based AJAX (no full page reloads for search, actions, and pagination).

---

## Features

**Students**
- Browse and search internships with live filters (work mode, category, sort) and an interactive locations map.
- Save internships, view a single internship detail page, and apply by uploading a CV (PDF/Word).
- Track applications, view assigned projects, submit work, and read company feedback and project evaluations.
- Personal profile with avatar upload, plus an acceptance-letter (printable) for accepted applications.

**Mentors**
- Dashboard with assigned students and pending submissions.
- Create and edit projects, assign them to eligible students, and grade submissions (with email notifications).

**Companies**
- Post internships (with an optional map pin), manage listings, review applications, accept/reject, and leave student feedback.

**Admin**
- Approve or reject mentor/company accounts, manage all users (block/delete), oversee internships, and view analytics charts.

**Across the app**
- English / Arabic internationalization (with RTL support).
- Email notifications (welcome, approval, application updates, project assignments/submissions/grades).
- AJAX search, actions, and pagination; mobile-friendly navbar and layouts.

---

## Tech Stack

- **Runtime:** Node.js + Express 4
- **Database:** MongoDB via Mongoose 8
- **Views:** EJS (server-rendered, multi-page)
- **Auth/session:** express-session + bcryptjs
- **Uploads:** multer (CV and avatar files → `/uploads`)
- **Email:** nodemailer
- **Security:** helmet, express-rate-limit
- **Front-end libraries (CDN):** Leaflet (maps), Chart.js (admin analytics), Font Awesome (icons)

---

## Project Structure

```
.
├── app.js                  # Express setup, sessions, i18n, route mounting, auto-seed
├── package.json
├── middleware/
│   └── i18n.js             # Locale detection + translation helpers (en/ar)
├── models/                 # Mongoose schemas
│   ├── User.js  Internship.js  Application.js  Project.js  Submission.js  Feedback.js
│   └── seed.js             # Seeds default users + internships when DB is empty
├── routes/
│   ├── studentRoutes.js  mentorRoutes.js  companyRoutes.js  adminRoutes.js
├── utils/
│   ├── mailer.js  notify.js  paginate.js  studentAlerts.js  validation.js
├── locales/
│   ├── en.json  ar.json
├── views/                  # EJS templates (HTML + template tags only)
│   ├── index.ejs  error.ejs  placeholder.ejs
│   ├── partials/           # head, navbar, footer, sidebar, pagination, internship-results
│   ├── auth/  student/  mentor/  company/  admin/
├── public/
│   ├── css/                # All styles (no inline CSS in views)
│   │   ├── shared.css  student.css  mentor.css  company.css  admin.css
│   │   ├── auth.css  rtl.css  acceptance-letter.css  internship-detail.css
│   └── js/                 # All behavior (no inline JS in views)
│       ├── shared.js  ajax-actions.js  ajax-pagination.js  head-init.js
│       ├── home.js  auth.js  admin-dashboard.js  post-internship.js
│       ├── student-projects.js  explore-search.js  explore-map.js  explore-actions.js
└── uploads/                # Uploaded CVs and avatars (created at runtime)
```

> **Code conventions:** Templates contain only HTML + EJS. There are no `<style>` blocks, inline `style="..."` attributes, inline `<script>` logic, or inline `onclick` handlers in the views. Server data reaches the client through `<script type="application/json">` data islands that the external JS files read.

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A MongoDB connection string (local MongoDB or MongoDB Atlas)

### 1) Install
```bash
npm install
```

### 2) Configure environment
Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/internhub
SESSION_SECRET=change-me-to-a-long-random-string
PORT=8080
APP_URL=http://localhost:8080
ADMIN_EMAIL=admin@admin.com
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-char-gmail-app-password
NODE_ENV=development
```

### 3) Run
```bash
npm start        # node app.js
# or, for auto-reload during development:
npm run dev      # nodemon app.js
```

The server starts on `http://localhost:8080`. The app connects to MongoDB first, then begins listening. On first run with an empty database, it **auto-seeds** default users and internships.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `SESSION_SECRET` | Yes | Secret used to sign session cookies. |
| `PORT` | No | Server port (default `8080`). |
| `APP_URL` | No | Base URL used in emails (default `http://localhost:8080`). |
| `ADMIN_EMAIL` | No | Admin contact address used by the app. |
| `EMAIL_USER` | For email | Gmail address used to send notifications. |
| `EMAIL_PASS` | For email | **Gmail App Password** (requires 2-Step Verification; not your normal password). |
| `NODE_ENV` | No | `development` or `production`. |

> **Email note:** If `EMAIL_USER` / `EMAIL_PASS` are not set, the app runs fine and simply skips sending mail. For Gmail you must use a 16-character **App Password**, not your account password.

---

## Default Accounts (auto-seeded)

These are created automatically the first time you run the app against an empty database:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@admin.com` | `admin123` |
| Company | `microsoft@company.com` | `company123` |
| Mentor | `mentor@university.edu` | `mentor123` |
| Student | `john@stanford.edu` | `user123` |
| Student | `jane@mit.edu` | `user123` |

> Change these credentials before any real deployment.

---

## Routes Overview

| Mount | Access | Purpose |
|---|---|---|
| `/` | Public | Home / landing, login, signup, password reset, email verification. |
| `/student/*` | Mostly authenticated (some pages public, e.g. Explore, Companies) | Student dashboard, explore, applications, projects, profile. |
| `/mentor/*` | Mentor role | Mentor dashboard and project management. |
| `/company/*` | Company role | Company dashboard, listings, applications, students. |
| `/admin/*` | Admin role | User management, approvals, internships, analytics. |
| `/__buildcheck` | Public | Returns the current build marker for verifying a fresh deploy. |

**Verifying a fresh deploy:** open `http://localhost:8080/__buildcheck` — it returns the current build marker. After pulling new changes, restart the server and hard-refresh (Ctrl/Cmd+Shift+R).

---

## Internationalization

- Supported locales: **English (`en`)** and **Arabic (`ar`)**, with right-to-left styling via `rtl.css`.
- Translations live in `locales/en.json` and `locales/ar.json` (flat keys). Templates use the `t()` helper provided by `middleware/i18n.js`.
- The active language is stored in the session and can be switched from the navbar.

---

## Team & Work Division

| Member | Module | Files / Folders |
|---|---|---|
| **Kareem** | Company + Company Styling + Shared CSS | `views/company/*`, `routes/companyRoutes.js`, `public/css/company.css`, `public/js/post-internship.js`, `public/css/shared.css` (lines 1–1350) |
| **Kenzy** | Mentor + Shared JS/Utils | `views/mentor/*`, `routes/mentorRoutes.js`, `public/css/mentor.css`, `public/js/shared.js`, `public/js/auth.js`, `utils/*`, `views/partials/internship-results.ejs`, `public/css/shared.css` (lines 1351–2700) |
| **Moaz** | Auth + Database + Navbar/Footer + Localization | `views/auth/*`, `models/*`, `middleware/i18n.js`, `locales/*`, `views/partials/head.ejs`, `views/partials/navbar.ejs`, `views/partials/footer.ejs`, `views/partials/pagination.ejs`, `views/partials/sidebar.ejs`, `views/error.ejs`, `views/placeholder.ejs`, `app.js`, `public/css/auth.css`, `public/js/head-init.js`, `public/js/ajax-pagination.js` |
| **Helmy** | Admin + Index/Home + Admin Styling + Shared CSS | `views/admin/*`, `routes/adminRoutes.js`, `views/index.ejs`, `public/css/admin.css`, `public/js/home.js`, `public/js/admin-dashboard.js`, `public/css/rtl.css`, `public/css/shared.css` (lines 2701–end) |
| **Rana** | Student | `views/student/*`, `routes/studentRoutes.js`, `public/css/student.css`, `public/js/explore-actions.js`, `public/js/explore-map.js`, `public/js/explore-search.js`, `public/js/ajax-actions.js`, `public/js/student-projects.js`, `public/css/acceptance-letter.css`, `public/css/internship-detail.css` |

---

## Notes

- **Server-rendered MPA:** pages are rendered by EJS on the server; AJAX is layered on top as progressive enhancement (live search, no-reload actions, and `fetch`-based pagination), so the app still works if JavaScript is limited.
- **Uploads:** CVs and avatars are stored under `/uploads` and served statically. Ensure this directory is writable in your environment.
- **Security:** sessions, password hashing (bcryptjs), helmet headers, and rate limiting are enabled. Always set a strong `SESSION_SECRET` and rotate the default accounts before going live.
