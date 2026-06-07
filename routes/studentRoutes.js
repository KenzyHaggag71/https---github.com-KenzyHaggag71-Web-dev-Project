
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const Feedback = require('../models/Feedback');
const { paginate, paginateArray, baseQuery } = require('../utils/paginate');
const { transporter } = require('../utils/mailer');
const { notify } = require('../utils/notify');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync('uploads/', { recursive: true });
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
      return cb(new Error('Profile picture must be an image.'));
    }
    cb(null, true);
  }
});

function getFlash(req) {
  if (req.session.flash) { const f = req.session.flash; delete req.session.flash; return f; }
  return null;
}

function requireLogin(req, res, next) {
  if (!req.currentUser) return res.redirect('/login');
  next();
}
/* True when the request came from our client-side fetch() calls. */
function isAjax(req) { return req.get('X-Requested-With') === 'fetch'; }
function handleUpload(fieldName, redirectTo) {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        req.session.flash = {
          type: 'error',
          message: err.message || 'File upload failed. Please try again.'
        };
        return res.redirect(redirectTo);
      }
      next();
    });
  };
}

const CATEGORIES = ['Computer Science','Engineering','Business','Law','Pharmacy','Architecture','Mass Communication','Arts & Design','Science'];


router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.currentUser._id).lean();
    const savedIds = user.takenInternships || [];
    const [savedInternships, recentApplications, projects] = await Promise.all([
      Internship.find({ _id: { $in: savedIds } }).lean(),
      Application.find({ studentId: req.currentUser._id }).populate('internshipId').sort({ createdAt: -1 }).limit(5).lean(),
      Project.find({ assignedTo: req.currentUser._id }).lean()
    ]);
    res.render('student/dashboard', {
      title: 'My Dashboard — InternHub',
      savedInternships, recentApplications,
      stats: { savedInternships: savedIds.length, applications: recentApplications.length, projects: projects.length },
      flash: getFlash(req)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load dashboard.' });
  }
});


router.get('/explore', async (req, res) => {
  try {
    const { search, workMode, category, sort, company: companyFilter } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (workMode) query.workMode = workMode;
    if (category) query.category = category;
    if (companyFilter) query.company = { $regex: companyFilter, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'stipend-high') sortOption = { price: -1 };
    if (sort === 'stipend-low')  sortOption = { price: 1 };

    const pagination = await paginate(Internship, query, {
      page: req.query.page, limit: 9, sort: sortOption
    });
    const internships = pagination.items;

    let savedIds = [];
    if (req.currentUser) {
      const u = await User.findById(req.currentUser._id, 'takenInternships').lean();
      savedIds = (u.takenInternships || []).map(id => id.toString());
    }

    res.render('student/explore', {
      title: 'Explore Internships — InternHub',
      internships, savedIds, categories: CATEGORIES,
      search: search || '', workMode: workMode || '', category: category || '', sort: sort || 'recent',
      pagination, baseUrl: '/student/explore', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load internships.' });
  }
});

/* AJAX endpoint — returns the filtered results + pagination as HTML fragments
   (JSON), so the Explore page can update live without a full reload. */
router.get('/explore/results', async (req, res) => {
  try {
    const { search, workMode, category, sort, company: companyFilter } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { skills: { $elemMatch: { $regex: search, $options: 'i' } } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (workMode) query.workMode = workMode;
    if (category) query.category = category;
    if (companyFilter) query.company = { $regex: companyFilter, $options: 'i' };

    let sortOption = { createdAt: -1 };
    if (sort === 'stipend-high') sortOption = { price: -1 };
    if (sort === 'stipend-low')  sortOption = { price: 1 };

    const pagination = await paginate(Internship, query, {
      page: req.query.page, limit: 9, sort: sortOption
    });
    const internships = pagination.items;

    let savedIds = [];
    if (req.currentUser) {
      const u = await User.findById(req.currentUser._id, 'takenInternships').lean();
      savedIds = (u.takenInternships || []).map(id => id.toString());
    }

    res.render('partials/internship-results', { internships, savedIds, pagination }, (err, gridHtml) => {
      if (err) { console.error('results render:', err.message); return res.status(500).json({ error: 'render' }); }
      res.render('partials/pagination', {
        pagination, baseUrl: '/student/explore', baseQuery: baseQuery(req.query)
      }, (err2, pagerHtml) => {
        if (err2) { console.error('pager render:', err2.message); return res.status(500).json({ error: 'render' }); }
        var tFn = res.locals.t || function (x) { return x; };
        var mapData = internships.map(function (it) {
          return {
            title: tFn(it.title), company: it.company, location: it.location || '',
            lat: (it.lat != null ? it.lat : null), lng: (it.lng != null ? it.lng : null)
          };
        });
        res.json({ gridHtml, pagerHtml, count: pagination.totalItems, mapData: mapData });
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not load internships.' });
  }
});


router.get('/internship/:id', async (req, res) => {
  try {
    const internship = await Internship.findById(req.params.id).lean();
    if (!internship) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Internship not found.' });
    }
    let isSaved = false;
    if (req.currentUser) {
      const u = await User.findById(req.currentUser._id, 'takenInternships').lean();
      isSaved = (u && u.takenInternships ? u.takenInternships.map(id => id.toString()) : []).includes(req.params.id);
    }
    res.render('student/internship-detail', {
      title: internship.title + ' — InternHub',
      internship, isSaved, flash: getFlash(req)
    });
  } catch (err) {
    console.error('Internship detail error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load internship.' });
  }
});

router.post('/save-internship/:id', requireLogin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.currentUser._id, { $addToSet: { takenInternships: req.params.id } });
    if (isAjax(req)) return res.json({ ok: true, message: 'Internship saved!' });
    req.session.flash = { type: 'success', message: 'Internship saved!' };
    res.redirect(req.headers.referer || '/student/explore');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not save internship.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not save internship.' });
  }
});


router.post('/unsave-internship/:id', requireLogin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.currentUser._id, { $pull: { takenInternships: req.params.id } });
    if (isAjax(req)) return res.json({ ok: true, message: 'Removed from saved.' });
    req.session.flash = { type: 'success', message: 'Removed from saved.' };
    res.redirect(req.headers.referer || '/student/dashboard');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not remove internship.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not remove internship.' });
  }
});


router.post('/apply', requireLogin, handleUpload('cv', '/student/explore'), async (req, res) => {
  function fail(msg, code) {
    if (isAjax(req)) return res.status(code || 400).json({ ok: false, message: msg });
    req.session.flash = { type: 'error', message: msg };
    return res.redirect('/student/explore');
  }
  try {
    const { internshipId } = req.body;
    if (!req.file) return fail('Please upload your resume before applying.');
    const [user, existing, internship] = await Promise.all([
      User.findById(req.currentUser._id).lean(),
      Application.findOne({ studentId: req.currentUser._id, internshipId }),
      Internship.findById(internshipId).lean()
    ]);
    if (existing) return fail('You already applied to this internship.');
    if (!internship) return fail('Internship not found.', 404);

    await Application.create({
      studentId: req.currentUser._id,
      studentName: user.profile?.fullName || user.name,
      studentEmail: user.email,
      studentUniversity: user.profile?.university || '',
      studentMajor: user.profile?.major || '',
      internshipId,
      cvFilePath: req.file ? req.file.filename : '',
      cvFileName: req.file ? req.file.originalname : '',
      status: 'pending'
    });

    notify(`\u{1F4E8} New application for ${internship.title}`).catch(() => {});

    // Notify the posting company of the new application (fire-and-forget, never blocks)
    if (internship.postedByUserId) {
      User.findById(internship.postedByUserId, 'email').lean().then(function (company) {
        if (company && company.email) {
          transporter.sendMail({
            from: process.env.EMAIL_USER, to: company.email,
            subject: `New application for ${internship.title}`,
            html: `<p>A new student has applied to <strong>${internship.title}</strong> on InternHub.</p><p>Log in to your dashboard to review the application.</p>`
          }).catch(function (e) { console.error('New-application email error:', e.message); });
        }
      }).catch(function () {});
    }

    if (isAjax(req)) return res.json({ ok: true, message: 'Application submitted!' });
    req.session.flash = { type: 'success', message: 'Application submitted!' };
    res.redirect('/student/my-internships');
  } catch (err) {
    console.error('Apply error:', err.message);
    return fail('Could not submit application.', 500);
  }
});

router.get('/my-internships', requireLogin, async (req, res) => {
  try {
    const pagination = await paginate(Application,
      { studentId: req.currentUser._id },
      { page: req.query.page, limit: 6, sort: { createdAt: -1 }, populate: 'internshipId' });
    const applications = pagination.items;
    res.render('student/my-internships', {
      title: 'My Internships — InternHub', applications,
      pagination, baseUrl: '/student/my-internships', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load applications.' });
  }
});

router.get('/projects', requireLogin, async (req, res) => {
  try {
    const [projects, submissions] = await Promise.all([
      Project.find({ assignedTo: req.currentUser._id }).lean(),
      Submission.find({ studentId: req.currentUser._id }).populate('projectId', 'title').lean()
    ]);
    const submissionMap = {};
    submissions.forEach(s => { if (s.projectId) submissionMap[s.projectId._id.toString()] = s; });
    res.render('student/projects', { title: 'Projects — InternHub', projects, submissionMap, flash: getFlash(req) });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load projects.' });
  }
});

router.post('/submit-project', requireLogin, async (req, res) => {
  try {
   const { projectId, title, link, description } = req.body;

if (!title?.trim()) {
  if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Submission title is required.' });
  req.session.flash = {
    type: 'error',
    message: 'Submission title is required.'
  };
  return res.redirect('/student/projects');
}

if (!link?.trim()) {
  if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Project URL is required.' });
  req.session.flash = {
    type: 'error',
    message: 'Project URL is required.'
  };
  return res.redirect('/student/projects');
}

try {
  new URL(link);
} catch {
  if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Please provide a valid URL.' });
  req.session.flash = {
    type: 'error',
    message: 'Please provide a valid URL.'
  };
  return res.redirect('/student/projects');
}
    const existing = await Submission.findOne({ projectId, studentId: req.currentUser._id });
    if (existing) {
      if (isAjax(req)) return res.status(400).json({ ok: false, message: 'You already submitted this project.' });
      req.session.flash = { type: 'error', message: 'You already submitted this project.' };
      return res.redirect('/student/projects');
    }
    await Submission.create({
  projectId,
  studentId: req.currentUser._id,
  title,
  link: link.trim(),
  description: description || '',
  status: 'submitted'
});

    // Notify the project's mentor by email (fire-and-forget, never blocks the response)
    const studentName = req.currentUser.name || 'A student';
    const appUrl = process.env.APP_URL || 'http://localhost:8080';
    Project.findById(projectId).populate('mentorId', 'email name').lean()
      .then(function (proj) {
        if (!proj || !proj.mentorId || !proj.mentorId.email) return;
        transporter.sendMail({
          from: process.env.EMAIL_USER, to: proj.mentorId.email,
          subject: 'A student submitted work for your project',
          html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#171A20;line-height:1.6">
              <h2 style="color:#3457DC">New submission received</h2>
              <p>Hi ${proj.mentorId.name || 'there'},</p>
              <p><strong>${studentName}</strong> has submitted work for your project <strong>${proj.title}</strong>.</p>
              <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:16px 0;background:#FAFAFA">
                <p style="margin:0 0 8px"><strong>Submission:</strong> ${title}</p>
                <p style="margin:0"><strong>Link:</strong> <a href="${link.trim()}">${link.trim()}</a></p>
              </div>
              <p><a href="${appUrl}/mentor/dashboard#pending-submissions" style="display:inline-block;background:#3457DC;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px">Review submission</a></p>
              <p style="margin-top:24px">Best regards,<br><strong>The InternHub Team</strong></p>
            </div>`
        }).catch(function (e) { console.error('Submission email error:', e.message); });
      })
      .catch(function (e) { console.error('Submission mentor lookup error:', e.message); });

    if (isAjax(req)) return res.json({ ok: true, message: 'Work submitted!' });
    req.session.flash = { type: 'success', message: 'Work submitted!' };
    res.redirect('/student/projects');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not submit project.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not submit project.' });
  }
});

router.get('/companies', async (req, res) => {
  try {
    const internshipCompanies = await Internship.aggregate([
      {
        $group: {
          _id: '$company',
          internshipsCount: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const companyNames = internshipCompanies.map(c => c._id).filter(Boolean);

    const registeredCompanies = await User.find({
      role: 'company',
      $or: [
        { companyName: { $in: companyNames } },
        { name: { $in: companyNames } }
      ]
    }).lean();

    const registeredByName = new Map();
    registeredCompanies.forEach(c => {
      registeredByName.set(c.companyName || c.name, c);
    });

    const allCompanies = internshipCompanies.filter(c => c._id).map(c => {
      const registered = registeredByName.get(c._id) || {};
      return {
        ...registered,
        name: c._id,
        companyName: c._id,
        industry: registered.industry || c.categories.join(', '),
        description: registered.description || '',
        website: registered.website || '',
        internshipsCount: c.internshipsCount
      };
    });

    const pagination = paginateArray(allCompanies, { page: req.query.page, limit: 9 });

    res.render('student/companies', {
      title: 'Companies — InternHub',
      companies: pagination.items,
      pagination, baseUrl: '/student/companies', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load companies.' });
  }
});

router.get('/profile', requireLogin, (req, res) => {
  res.render('student/profile', { title: 'My Profile — InternHub', error: null, flash: getFlash(req) });
});

router.post('/update-profile', requireLogin, handleUpload('avatar', '/student/profile'), async (req, res) => {
  try {
    const { fullName, university, major, year, skills, bio } = req.body;
    const skillsArr = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const avatar = req.file ? req.file.filename : (req.currentUser.profile?.avatar || '');

    await User.findByIdAndUpdate(req.currentUser._id, {
      name: fullName || req.currentUser.name,
      year: parseInt(year) || req.currentUser.year,
      profile: {
        fullName: fullName || '',
        university: university || '',
        major: major || '',
        year: parseInt(year) || null,
        skills: skillsArr,
        bio: bio || '',
        avatar
      }
    });

    req.session.flash = { type: 'success', message: 'Profile updated!' };
    res.redirect('/student/profile');
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not update profile.' });
  }
});

router.get('/resources', requireLogin, (req, res) => {
  res.render('student/resources', { title: 'Resources — InternHub' });
});

router.get('/my-feedback', requireLogin, async (req, res) => {
  try {
    const [companyFeedbacks, evaluations] = await Promise.all([
      Feedback.find({ studentId: req.currentUser._id, kind: 'company-to-student' })
        .populate('companyId', 'companyName name').populate('internshipId', 'title').lean(),
      Submission.find({ studentId: req.currentUser._id, status: 'evaluated' })
        .populate('projectId', 'title').lean()
    ]);
    res.render('student/my-feedback', { title: 'My Feedback — InternHub', companyFeedbacks, evaluations, flash: getFlash(req) });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load feedback.' });
  }
});

router.get('/calendar/:id', requireLogin, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id, studentId: req.currentUser._id, status: 'accepted'
    }).populate('internshipId').lean();
    if (!application || !application.internshipId) {
      return res.status(404).render('error', { title: 'Not Found', message: 'No accepted application found.' });
    }
    const it = application.internshipId;
    const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const start = new Date(); start.setDate(start.getDate() + 14); // tentative start (~2 weeks)
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const summary = `${res.locals.t(it.title)} — ${it.company}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//InternHub//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + application._id + '@internhub',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:' + esc(summary),
      'DESCRIPTION:' + esc(res.locals.t('cal.desc')),
      'LOCATION:' + esc(it.location || ''),
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="internship.ics"');
    res.send(ics);
  } catch (err) {
    console.error('Calendar invite error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong.' });
  }
});

router.get('/acceptance-letter/:id', requireLogin, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id, studentId: req.currentUser._id, status: 'accepted'
    }).populate('internshipId').lean();
    if (!application || !application.internshipId) {
      return res.status(404).render('error', { title: 'Not Found', message: 'No accepted application found.' });
    }
    res.render('student/acceptance-letter', {
      title: 'Acceptance Letter — InternHub',
      application,
      studentName: application.studentName ||
        (req.currentUser.profile && req.currentUser.profile.fullName) || req.currentUser.name
    });
  } catch (err) {
    console.error('Acceptance letter error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong.' });
  }
});

module.exports = router;
