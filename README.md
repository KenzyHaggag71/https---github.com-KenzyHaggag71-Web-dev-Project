# InternHub 

Node.js + Express + MongoDB + EJS version of the InternHub project.

## What's in this build (Phase 1)

This is the **first phase** of the backend migration. It includes:

- Full Express server with MongoDB connection
- All 6 Mongoose models (User, Internship, Application, Project, Submission, Feedback)
- Automatic seed data on first run (default users + 11 internships)
- Sessions for login (using express-session)
- Bcrypt password hashing (passwords never stored in plain text)
- File upload middleware (express-fileupload, for CVs later)
- **Working pages:**
  - Homepage with live stats
  - Login page (all 4 roles)
  - Signup page (all 3 signup roles: student, mentor, company)
  - Logout
  - Role-based navbar (different items for student/mentor/admin/company)
- Reusable EJS partials (head, navbar, footer)
- Error handling on every route
- Placeholder pages for dashboards (built out in Phase 2/3)

## What's NOT in this build yet

- Student pages: explore, dashboard, companies, my-internships, my-feedback, projects, profile, resources
- Admin pages: dashboard, users, approvals
- Company pages: dashboard, post-internship, manage-listings, applications, my-students
- Mentor dashboard
- CV upload functionality
- Application/feedback/project CRUD

These come in Phase 2 and Phase 3.

## How to run

### 1. Add your MongoDB password

Open `.env` and replace `<db_password>` with your real MongoDB password.

```
MONGODB_URI=mongodb+srv://ahmed2400640:YOUR_REAL_PASSWORD_HERE@cluster0.vec6duh.mongodb.net/internhub?retryWrites=true&w=majority&appName=Cluster0
```

### 2. Install dependencies

```
npm install
```

### 3. Run the server

```
node app.js
```

You should see:

```
[OK] Connected to MongoDB
[OK] Server running on http://localhost:8080
```

If the database is empty, it will also print:

```
Seeding default users...
   Created 7 default users
Seeding default internships...
   Created 11 default internships
```

### 4. Open in browser

Go to **http://localhost:8080**

### 5. Test login

Use one of the demo accounts (shown on the login page):

| Role | Email | Password |
|---|---|---|
| Admin | admin@admin.com | admin123 |
| Company | microsoft@company.com | company123 |
| Student | john@stanford.edu | user123 |
| Mentor | mentor@university.edu | mentor123 |

## Folder structure

```
internhub-backend/
├── app.js                  Main Express server (all routes here, matches Lab 9)
├── package.json
├── .env                    MongoDB credentials (you fill in password)
├── .gitignore
├── models/                 Mongoose schemas
│   ├── User.js
│   ├── Internship.js
│   ├── Application.js
│   ├── Project.js
│   ├── Submission.js
│   ├── Feedback.js
│   └── seed.js             Seeds DB on first run
├── public/                 Static files served by Express
│   ├── css/                All 6 stylesheets (unchanged from frontend)
│   ├── js/                 Small browser-side scripts
│   ├── images/             For uploaded CVs/avatars
│   └── assets/             spotlight-video.mp4
└── views/                  EJS templates
    ├── partials/           head, navbar, footer
    ├── auth/               login.ejs, signup.ejs
    ├── admin/              (Phase 3)
    ├── company/            (Phase 3)
    ├── mentor/             (Phase 3)
    ├── student/            (Phase 2)
    ├── index.ejs           Homepage
    ├── error.ejs           Error page
    └── placeholder.ejs     For unbuilt pages
```

## Troubleshooting

**"MONGODB_URI is not configured"** — you forgot to replace `<db_password>` in `.env`.

**"MongoDB connection failed"** — check that your password is correct and that your IP is whitelisted in MongoDB Atlas (Network Access → Allow Access from Anywhere if testing).

**"Port 8080 in use"** — open `.env` and change `PORT=8080` to another number like `PORT=3000`.

**Want to wipe seed data and start fresh** — log into Atlas, open your `internhub` database, and delete the `users` and `internships` collections. Next server start will reseed.

## Bonus features (Phase 2 evaluation)

**Localization (English + Arabic, full RTL)** — All UI chrome and main pages are
translated. Language strings live in `locales/en.json` and `locales/ar.json`; the
`middleware/i18n.js` middleware exposes a `t()` helper plus `lang`/`dir` to every
view, and a globe switcher in the navbar lets users flip language. The choice is
stored in the session via the `GET /lang/:locale` route. Arabic loads `public/css/rtl.css`
and switches the page to `dir="rtl"`. Missing keys fall back to English, then to the
key itself, so the UI never breaks.

**Pagination** — Server-side pagination via `utils/paginate.js` (works for Mongoose
queries and in-memory arrays) and the reusable `views/partials/pagination.ejs` control.
It is wired into Explore, My Internships, Companies (student), Users & Internships
(admin), and Applications (company). All active filters/search terms are preserved
across pages through the `baseQuery` helper.
