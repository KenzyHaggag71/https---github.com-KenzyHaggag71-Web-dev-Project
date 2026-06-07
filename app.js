const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const crypto     = require('crypto');
const express    = require('express');
const path       = require('path');
const mongoose   = require('mongoose');
const session    = require('express-session');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const bcrypt     = require('bcryptjs');

const User        = require('./models/User');
const Internship  = require('./models/Internship');
const seedDatabase = require('./models/seed');
const { sendWelcomeEmail, transporter } = require('./utils/mailer');
const { notify } = require('./utils/notify');
const { composeAuth } = require('./utils/validation');

const adminRoutes   = require('./routes/adminRoutes');
const companyRoutes = require('./routes/companyRoutes');
const mentorRoutes  = require('./routes/mentorRoutes');
const studentRoutes = require('./routes/studentRoutes');

const { i18n, SUPPORTED } = require('./middleware/i18n');

const app  = express();
const PORT = process.env.PORT || 8080;

/* ── Database ──────────────────────────────────────────────────────────────── */
const dbURI = process.env.MONGODB_URI;
if (!dbURI || dbURI.includes('<db_password>')) {
  console.error('\n[ERROR] MONGODB_URI is not configured in .env\n');
  process.exit(1);
}
mongoose.connect(dbURI)
  .then(async () => {
    console.log('[OK] Connected to MongoDB');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log('[OK] Server → http://localhost:' + PORT);
      console.log('[OK] Build: explore-map-live-v7  (verify at /__buildcheck)');
    });
  })
  .catch(err => {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    process.exit(1);
  });

/* ── View engine ───────────────────────────────────────────────────────────── */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ── Security ──────────────────────────────────────────────────────────────── */
// Trust the hosting proxy (Render/Heroku) so secure cookies + HTTPS detection work.
app.set('trust proxy', 1);
// Helmet sets safe HTTP headers. CSP is disabled because the app loads external
// CDNs (Google Fonts, Font Awesome, Chart.js) and inline scripts; leaving it on
// would block them. Other protections (X-Frame-Options, etc.) stay enabled.
app.use(helmet({ contentSecurityPolicy: false }));

/* ── Middleware ────────────────────────────────────────────────────────────── */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* Quick check that the up-to-date (no-reload) build is the one running.
   Visit http://localhost:8080/__buildcheck — you should see {"build":"explore-map-live-v7"}. */
app.get('/__buildcheck', (req, res) => res.json({ build: 'explore-map-live-v7', ok: true }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: 'lax',
    // Only require HTTPS for the cookie in production (so local http still works).
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Limit repeated login attempts (anti brute-force). Lenient so a live demo isn't blocked.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts. Please try again in a few minutes.'
});

/* ── Localization (i18n) — sets res.locals.t / lang / dir ─────────────────── */
app.use(i18n);

/* ── Inject currentUser into every request & view ─────────────────────────── */
app.use(async (req, res, next) => {
  res.locals.currentUser = null;
  req.currentUser = null;
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).lean();
      if (user) {
        delete user.password;
        res.locals.currentUser = user;
        req.currentUser = user;
      } else {
        req.session.destroy(() => {});
      }
    } catch (err) {
      console.error('Session user lookup failed:', err.message);
    }
  }
  next();
});

/* ── Helpers ───────────────────────────────────────────────────────────────── */
function requireLogin(req, res, next) {
  if (!req.currentUser) return res.redirect('/login');
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.currentUser)          return res.redirect('/login');
    if (req.currentUser.role !== role)
      return res.status(403).render('error', { title: 'Forbidden', message: 'Access denied.' });
    next();
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidUniversityEmail(email) {
  return /\.edu(\.[a-z]{2})?$/i.test(String(email).toLowerCase());
}
/* Strict password rule: at least 6 characters AND at least one capital letter. */
function isStrongPassword(pw) {
  pw = String(pw || '');
  return pw.length >= 6 && /[A-Z]/.test(pw);
}
const PASSWORD_RULE_MSG = 'Password must be at least 6 characters and include at least one capital letter.';

/* ── Public routes ─────────────────────────────────────────────────────────── */
/* Switch UI language, then return to the page the user came from. */
app.get('/lang/:locale', (req, res) => {
  const locale = req.params.locale;
  if (SUPPORTED.indexOf(locale) !== -1) req.session.lang = locale;
  res.redirect(req.headers.referer || '/');
});

app.get('/', async (req, res) => {
  try {
    const [internshipCount, companyCount, studentCount, trendingInternships] = await Promise.all([
      Internship.countDocuments(),
      User.countDocuments({ role: 'company', status: 'approved' }),
      User.countDocuments({ role: 'user' }),
      Internship.find().sort({ postedDate: -1 }).limit(5).lean()
    ]);
    res.render('index', {
      title: 'InternHub — Launch Your Career',
      stats: { companies: companyCount, internships: internshipCount, students: studentCount },
      trendingInternships
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load homepage.' });
  }
});

/* ── Auth routes ───────────────────────────────────────────────────────────── */
app.get('/login', (req, res) => {
  if (req.currentUser) return res.redirect('/');
  res.render('auth/login', { title: 'Sign In - InternHub', error: null, formData: {} });
});

app.post('/login', loginLimiter, async (req, res) => {
  try {
    const email    = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    const enter = [];
    const other = [];
    if (!email) enter.push('email');
    else if (!isValidEmail(email)) other.push('Please enter a valid email address.');
    if (!password) enter.push('password');
    if (enter.length || other.length)
      return res.render('auth/login', { title: 'Sign In - InternHub', error: composeAuth(enter, [], other), formData: { email } });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.render('auth/login', { title: 'Sign In - InternHub', error: 'Invalid credentials.', formData: { email } });
    if (user.status === 'blocked')
      return res.render('auth/login', { title: 'Sign In - InternHub', error: 'Your account has been blocked.', formData: { email } });
    if ((user.role === 'company' || user.role === 'mentor') && user.status === 'pending')
      return res.render('auth/login', { title: 'Sign In - InternHub', error: 'Your account is pending admin approval.', formData: { email } });

    req.session.userId = user._id;
    if (user.role === 'admin')   return res.redirect('/admin/dashboard');
    if (user.role === 'company') return res.redirect('/company/dashboard');
    if (user.role === 'mentor')  return res.redirect('/mentor/dashboard');
    return res.redirect('/student/dashboard');
  } catch (err) {
    res.render('auth/login', { title: 'Sign In - InternHub', error: 'Something went wrong.', formData: {} });
  }
});

app.get('/signup', (req, res) => {
  if (req.currentUser) return res.redirect('/');
  res.render('auth/signup', { title: 'Sign Up - InternHub', error: null, success: null, activeRole: 'student', formData: {} });
});

app.post('/signup', async (req, res) => {
  try {
    const signupRole = req.body.signupRole || 'student';
    const data       = req.body || {};
    const email      = (data.email || '').trim().toLowerCase();
    const password   = data.password || '';
    const confirm    = data.confirmPassword || '';
    const terms      = data.terms === 'on';

    const renderSignup = (error, success) =>
      res.render('auth/signup', { title: 'Sign Up - InternHub', error, success: success || null, activeRole: signupRole, formData: data });

    const enter = [];   // empty required text fields  -> "Please enter your ..."
    const select = [];  // empty required dropdowns     -> "Please select your ..."
    const other = [];   // specific rule messages

    // Role-specific field checks (collect every problem, grouped naturally).
    const pending = { role: signupRole, email };
    if (signupRole === 'student' || signupRole === 'mentor') {
      const name       = (data.name || '').trim();
      const university = (data.university || '').trim();
      const major      = (data.major || '').trim();
      const year       = parseInt(data.year, 10);
      const who        = signupRole === 'student' ? 'students' : 'mentors';

      if (!name) enter.push('name');
      if (!university) enter.push('university name');
      else if (university.length < 2) other.push('University name must be at least 2 characters.');

      if (!email) enter.push('email');
      else if (!isValidEmail(email)) other.push('Please enter a valid email address.');
      else if (!isValidUniversityEmail(email)) other.push('Only .edu or .edu.eg emails are allowed for ' + who + '.');

      if (!password) enter.push('password');
      else if (!isStrongPassword(password)) other.push(PASSWORD_RULE_MSG);
      else if (password !== confirm) other.push('Passwords do not match.');

      if (!major) select.push('major');
      if (!Number.isInteger(year)) select.push('year of study');
      else if (signupRole === 'mentor' && year < 2) other.push('Mentors must be in Year 2 or above.');

      Object.assign(pending, { name, university, major, year });
    } else if (signupRole === 'company') {
      const companyName = (data.companyName || '').trim();
      const industry    = (data.industry || '').trim();

      if (!companyName) enter.push('company name');
      if (!email) enter.push('email');
      else if (!isValidEmail(email)) other.push('Please enter a valid email address.');
      if (!password) enter.push('password');
      else if (!isStrongPassword(password)) other.push(PASSWORD_RULE_MSG);
      else if (password !== confirm) other.push('Passwords do not match.');
      if (!industry) select.push('industry');

      Object.assign(pending, { companyName, industry, website: (data.website || '').trim(), description: (data.description || '').trim() });
    } else {
      other.push('Invalid signup role.');
    }

    if (!terms) other.push('You must agree to the confirmation checkbox.');

    // Email uniqueness (only meaningful once the email itself is valid).
    if (isValidEmail(email) && await User.findOne({ email }))
      other.push('Email already registered. Try signing in.');

    if (enter.length || select.length || other.length)
      return renderSignup(composeAuth(enter, select, other));

    pending.hashedPassword = await bcrypt.hash(password, 10);

    // Email-verification step: generate a 6-digit code, stash the pending signup
    // in the session, and email the code. The account is created only after the
    // person proves they own the email by entering the correct code.
    const code = String(Math.floor(100000 + Math.random() * 900000));
    req.session.pendingSignup = Object.assign(pending, { code, expires: Date.now() + 10 * 60 * 1000, attempts: 0 });
    transporter.sendMail({
      from: process.env.EMAIL_USER, to: email,
      subject: 'Your InternHub verification code',
      html: `<p>Welcome to InternHub! Your verification code is:</p>
             <h2 style="letter-spacing:6px;color:#3457DC">${code}</h2>
             <p>Enter this code to finish creating your account. It expires in 10 minutes.</p>`
    }).catch(err => console.error('Verification email error:', err.message));

    return res.render('auth/verify-email', { title: 'Verify Email - InternHub', email, error: null, resent: false });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.render('auth/signup', {
      title: 'Sign Up - InternHub', error: 'Something went wrong.',
      success: null, activeRole: req.body.signupRole || 'student', formData: req.body || {}
    });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => { if (err) console.error('Logout error:', err.message); });
  res.redirect('/');
});

/* ── Email verification (OTP) for signup ───────────────────────────────────── */
app.get('/verify-email', (req, res) => {
  const p = req.session.pendingSignup;
  if (!p) return res.redirect('/signup');
  res.render('auth/verify-email', { title: 'Verify Email - InternHub', email: p.email, error: null, resent: false });
});

app.post('/verify-email', async (req, res) => {
  const p = req.session.pendingSignup;
  if (!p) return res.redirect('/signup');
  const backToSignup = (error) =>
    res.render('auth/signup', { title: 'Sign Up - InternHub', error, success: null, activeRole: p.role || 'student', formData: {} });
  try {
    if (Date.now() > p.expires) { delete req.session.pendingSignup; return backToSignup('Verification code expired. Please sign up again.'); }
    if (p.attempts >= 5)        { delete req.session.pendingSignup; return backToSignup('Too many attempts. Please sign up again.'); }
    const entered = (req.body.code || '').trim();
    if (entered !== p.code) {
      p.attempts += 1;
      return res.render('auth/verify-email', { title: 'Verify Email - InternHub', email: p.email, error: 'Incorrect verification code.', resent: false });
    }

    // Code correct → create the account now.
    if (p.role === 'student') {
      const newUser = await User.create({
        name: p.name, email: p.email, password: p.hashedPassword, role: 'user', status: 'active', year: p.year,
        profile: { fullName: p.name, university: p.university, major: p.major, year: p.year, skills: [], bio: '', avatar: '' },
        takenInternships: []
      });
      sendWelcomeEmail('student', p.email, p.name).catch(err => console.error('Welcome email error:', err.message));
      notify(`\u{1F393} New student signed up: ${p.name} (${p.email})`).catch(() => {});
      delete req.session.pendingSignup;
      req.session.userId = newUser._id;
      return res.redirect('/student/dashboard');
    }
    if (p.role === 'mentor') {
      await User.create({
        name: p.name, email: p.email, password: p.hashedPassword, role: 'mentor', status: 'pending', year: p.year,
        profile: { fullName: p.name, university: p.university, major: p.major, year: p.year, skills: [], bio: '', avatar: '' }
      });
      sendWelcomeEmail('mentor', p.email, p.name).catch(err => console.error('Welcome email error:', err.message));
      notify(`\u{1F9D1}\u200D\u{1F3EB} New mentor application: ${p.name} (${p.email})`).catch(() => {});
      delete req.session.pendingSignup;
      return res.render('auth/login', { title: 'Sign In - InternHub', error: null, formData: {}, success: 'Mentor application submitted! Awaiting admin approval.' });
    }
    if (p.role === 'company') {
      await User.create({
        name: p.companyName, email: p.email, password: p.hashedPassword, role: 'company', status: 'pending',
        companyName: p.companyName, industry: p.industry, website: p.website, description: p.description,
        profile: { avatar: '', bio: '' }
      });
      sendWelcomeEmail('company', p.email, p.companyName).catch(err => console.error('Welcome email error:', err.message));
      notify(`\u{1F3E2} New company registered: ${p.companyName} (${p.email})`).catch(() => {});
      delete req.session.pendingSignup;
      return res.render('auth/login', { title: 'Sign In - InternHub', error: null, formData: {}, success: 'Company registered! Awaiting admin approval.' });
    }
    delete req.session.pendingSignup;
    return backToSignup('Invalid signup role.');
  } catch (err) {
    console.error('Verify-email error:', err.message);
    return backToSignup('Something went wrong.');
  }
});

app.post('/resend-code', (req, res) => {
  const p = req.session.pendingSignup;
  if (!p) return res.redirect('/signup');
  p.code = String(Math.floor(100000 + Math.random() * 900000));
  p.expires = Date.now() + 10 * 60 * 1000;
  p.attempts = 0;
  transporter.sendMail({
    from: process.env.EMAIL_USER, to: p.email,
    subject: 'Your InternHub verification code',
    html: `<p>Your new InternHub verification code is:</p><h2 style="letter-spacing:6px;color:#3457DC">${p.code}</h2><p>It expires in 10 minutes.</p>`
  }).catch(err => console.error('Verification email error:', err.message));
  res.render('auth/verify-email', { title: 'Verify Email - InternHub', email: p.email, error: null, resent: true });
});

/* ── Forgot / reset password ───────────────────────────────────────────────── */
app.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { title: 'Forgot Password - InternHub', error: null, success: null });
});

app.post('/forgot-password', async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const render = (error, success) =>
    res.render('auth/forgot-password', { title: 'Forgot Password - InternHub', error, success });
  try {
    const user = await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetToken = token;
      user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();
      const base = process.env.APP_URL || (req.protocol + '://' + req.get('host'));
      const link = base + '/reset-password/' + token;
      transporter.sendMail({
        from: process.env.EMAIL_USER, to: user.email,
        subject: 'Reset your InternHub password',
        html: `<p>We received a request to reset your InternHub password.</p>
               <p><a href="${link}" style="display:inline-block;padding:10px 22px;background:#3457DC;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a></p>
               <p>Or open this link: <br>${link}</p>
               <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`
      }).catch(err => console.error('Reset email error:', err.message));
    }
    // Always show the same message so we never reveal which emails exist.
    return render(null, 'If an account exists for that email, a reset link has been sent.');
  } catch (err) {
    console.error('Forgot-password error:', err.message);
    return render('Something went wrong.', null);
  }
});

app.get('/reset-password/:token', async (req, res) => {
  try {
    const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) {
      return res.status(400).render('error', { title: 'Error', message: 'This reset link is invalid or has expired.' });
    }
    res.render('auth/reset-password', { title: 'Reset Password - InternHub', error: null, token: req.params.token });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong.' });
  }
});

app.post('/reset-password/:token', async (req, res) => {
  const { password, confirmPassword } = req.body;
  const render = (error) =>
    res.render('auth/reset-password', { title: 'Reset Password - InternHub', error, token: req.params.token });
  try {
    const user = await User.findOne({ resetToken: req.params.token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) {
      return res.status(400).render('error', { title: 'Error', message: 'This reset link is invalid or has expired.' });
    }
    if (!isStrongPassword(password))       return render(PASSWORD_RULE_MSG);
    if (password !== confirmPassword)      return render('Passwords do not match.');
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();
    res.render('auth/login', { title: 'Sign In - InternHub', error: null, formData: {}, success: 'Password reset! You can now sign in.' });
  } catch (err) {
    console.error('Reset-password error:', err.message);
    return render('Something went wrong.');
  }
});

/* ── Unsubscribe from new-internship student alerts (public, no login) ─────── */
app.get('/unsubscribe/:token', async (req, res) => {
  try {
    const user = await User.findOne({ unsubscribeToken: req.params.token });
    if (user) {
      user.internshipAlerts = false;
      await user.save();
    }
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Unsubscribed — InternHub</title>
      <style>
        body{font-family:system-ui,'Segoe UI',sans-serif;background:#F4F4F6;margin:0;
          display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px}
        .box{background:#fff;border:1px solid #E4E4E4;border-radius:16px;padding:40px;
          max-width:440px;text-align:center;box-shadow:0 12px 32px rgba(0,0,0,.06)}
        h1{color:#171A20;font-size:1.35rem;margin:0 0 10px}
        p{color:#5C5E62;line-height:1.6;margin:0 0 22px}
        a{display:inline-block;background:#3457DC;color:#fff;text-decoration:none;
          padding:10px 24px;border-radius:8px;font-weight:600}
      </style></head>
      <body><div class="box">
        <h1>You're unsubscribed ✅</h1>
        <p>You won't receive new-internship alert emails anymore.
           You can still browse every internship any time on InternHub.</p>
        <a href="/student/explore">Browse internships</a>
      </div></body></html>`);
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
    res.status(500).send('Could not process unsubscribe. Please try again later.');
  }
});

/* ── Role-guarded router mounts ────────────────────────────────────────────── */
app.use('/admin',   requireRole('admin'),   adminRoutes);
app.use('/company', requireRole('company'), companyRoutes);
app.use('/mentor',  requireRole('mentor'),  mentorRoutes);
app.use('/student', studentRoutes);          // per-route auth inside studentRoutes

/* ── 404 ───────────────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).render('error', { title: 'Page Not Found', message: 'The page you are looking for does not exist.' });
});
