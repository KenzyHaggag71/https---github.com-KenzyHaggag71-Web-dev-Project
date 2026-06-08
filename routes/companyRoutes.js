const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Feedback = require('../models/Feedback');
const { paginate, baseQuery } = require('../utils/paginate');
const { notify } = require('../utils/notify');
const { notifyStudentsOfNewInternship } = require('../utils/studentAlerts');
const { humanList, composeNeed } = require('../utils/validation');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: {
    
    
    rejectUnauthorized: false
  }
});

function isAjax(req) { return req.get('X-Requested-With') === 'fetch'; }
function getFlash(req) {
  if (req.session.flash) { const f = req.session.flash; delete req.session.flash; return f; }
  return null;
}


router.use((req, res, next) => {
  const isApproved = req.currentUser.status === 'approved' || req.currentUser.approved === true;

  if (!isApproved) {
    return res.render('placeholder', {
      title: 'Pending Approval',
      pageTitle: 'Company Hub',
      message: 'Your company account is awaiting admin approval.'
    });
  }

  next();
});

const CATEGORIES = ['Computer Science','Engineering','Business','Law','Pharmacy','Architecture','Mass Communication','Arts & Design','Science'];
const CURRENCIES = ['EGP', 'USD'];

function formatStipend(currency, amount) {
  const n = Number(amount).toLocaleString('en-US');
  return currency === 'USD' ? `$${n}/mo` : `EGP ${n}/mo`;
}

function validateInternship(body) {
  const need        = [];  
  const title       = (body.title || '').trim();
  const category    = (body.category || '').trim();
  const location    = (body.location || '').trim();
  const workMode    = (body.workMode || '').trim();
  const type        = (body.type || '').trim();
  const description = (body.description || '').trim();
  const link        = (body.link || '').trim();
  const currency    = CURRENCIES.includes(body.currency) ? body.currency : 'EGP';

  if (title.length < 3 || title.length > 120)            need.push('a title (3–120 characters)');
  if (!CATEGORIES.includes(category))                    need.push('a valid category');
  if (!['Remote', 'Hybrid', 'On-site'].includes(workMode)) need.push('a work mode');
  if (!['Paid', 'Unpaid', 'Volunteer'].includes(type))   need.push('a type');
  if (description.length < 20 || description.length > 5000) need.push('a description (at least 20 characters)');
  if (location.length > 120)                             need.push('a shorter location (max 120 characters)');

  
  const weeks = parseInt(body.duration, 10);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 104)
    need.push('a duration in weeks (1–104)');

  
  let price = 0, stipend = '';
  if (type === 'Paid') {
    const amount = parseFloat(body.price);
    if (!(amount >= 1) || amount > 1000000) {
      need.push('a stipend amount (1–1,000,000)');
    } else {
      price = Math.round(amount);
      stipend = formatStipend(currency, price);
    }
  }

  
  const skills = (body.skills || '').split(',').map(s => s.trim()).filter(Boolean);
  if (skills.length < 1)       need.push('at least one skill');
  else if (skills.length > 15) need.push('no more than 15 skills');
  else if (skills.some(s => s.length > 40)) need.push('shorter skill names (max 40 characters each)');

  
  if (link && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(link))
    need.push('a valid application link (starting with http:// or https://)');

  
  let lat = body.lat ? parseFloat(body.lat) : null;
  let lng = body.lng ? parseFloat(body.lng) : null;
  if (lat == null || isNaN(lat)) lat = null;
  if (lng == null || isNaN(lng)) lng = null;

  if (need.length) return { error: composeNeed(need) };

  return {
    data: {
      title, category, location, workMode, type, description, link,
      duration: weeks + ' weeks',
      price, stipend, skills, lat, lng
    }
  };
}


router.get('/dashboard', async (req, res) => {
  try {
    const listings = await Internship.find({ postedByUserId: req.currentUser._id }).lean();
    const myListingIds = listings.map(l => l._id);
    const [allApps, recentApplications] = await Promise.all([
      Application.find({ internshipId: { $in: myListingIds } }).lean(),
      Application.find({ internshipId: { $in: myListingIds } })
        .populate('internshipId').sort({ createdAt: -1 }).limit(5).lean()
    ]);
    res.render('company/dashboard', {
      title: 'Company Hub — InternHub', listings, recentApplications,
      stats: {
        listings: listings.length,
        applications: allApps.length,
        pending: allApps.filter(a => a.status === 'pending').length,
        accepted: allApps.filter(a => a.status === 'accepted').length
      },
      flash: getFlash(req)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load dashboard.' });
  }
});


router.get('/post-internship', (req, res) => {
  res.render('company/post-internship', {
    title: 'Post Internship — InternHub',
    editing: false, listing: {}, formData: {}, error: null,
    categories: CATEGORIES, flash: getFlash(req)
  });
});


router.post('/post-internship', async (req, res) => {
  const v = validateInternship(req.body);
  if (v.error) {
    if (isAjax(req)) return res.status(400).json({ ok: false, message: v.error });
    return res.render('company/post-internship', {
      title: 'Post Internship — InternHub',
      editing: false, listing: {}, formData: req.body, categories: CATEGORIES, flash: null,
      error: v.error
    });
  }
  try {
    const created = await Internship.create(Object.assign({}, v.data, {
      company: req.currentUser.companyName || req.currentUser.name,
      postedByUserId: req.currentUser._id,
      postedDate: new Date().toISOString().split('T')[0],
      icon: 'fas fa-briefcase'
    }));
    notify(`\u{1F4BC} New internship posted: ${v.data.title} by ${req.currentUser.companyName || req.currentUser.name}`).catch(() => {});
    
    notifyStudentsOfNewInternship(created);
    if (isAjax(req)) return res.json({ ok: true, message: 'Internship posted successfully!', redirect: '/company/manage-listings' });
    req.session.flash = { type: 'success', message: 'Internship posted successfully!' };
    res.redirect('/company/manage-listings');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not post internship. Please try again.' });
    res.render('company/post-internship', {
      title: 'Post Internship — InternHub',
      editing: false, listing: {}, formData: req.body, categories: CATEGORIES, flash: null,
      error: 'Could not post internship. Please try again.'
    });
  }
});


router.get('/edit-internship/:id', async (req, res) => {
  try {
    const listing = await Internship.findOne({ _id: req.params.id, postedByUserId: req.currentUser._id }).lean();
    if (!listing) return res.status(404).render('error', { title: 'Not Found', message: 'Internship not found.' });
    res.render('company/post-internship', {
      title: 'Edit Internship — InternHub',
      editing: true, listing,
      formData: {
        ...listing,
        skills: listing.skills ? listing.skills.join(', ') : '',
        currency: /^\s*\$/.test(listing.stipend || '') ? 'USD' : 'EGP'
      },
      categories: CATEGORIES, error: null, flash: null
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load internship.' });
  }
});


router.post('/update-internship/:id', async (req, res) => {
  const v = validateInternship(req.body);
  if (v.error) {
    if (isAjax(req)) return res.status(400).json({ ok: false, message: v.error });
    return res.render('company/post-internship', {
      title: 'Edit Internship — InternHub',
      editing: true, listing: { _id: req.params.id }, formData: req.body,
      categories: CATEGORIES, flash: null, error: v.error
    });
  }
  try {
    await Internship.findOneAndUpdate(
      { _id: req.params.id, postedByUserId: req.currentUser._id },
      v.data
    );
    if (isAjax(req)) return res.json({ ok: true, message: 'Internship updated.', redirect: '/company/manage-listings' });
    req.session.flash = { type: 'success', message: 'Internship updated.' };
    res.redirect('/company/manage-listings');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not update internship.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not update internship.' });
  }
});


router.get('/manage-listings', async (req, res) => {
  try {
    const listings = await Internship.find({ postedByUserId: req.currentUser._id }).lean();
    res.render('company/manage-listings', { title: 'My Listings — InternHub', listings, flash: getFlash(req) });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load listings.' });
  }
});


router.post('/delete-internship/:id', async (req, res) => {
  try {
    await Internship.findOneAndDelete({ _id: req.params.id, postedByUserId: req.currentUser._id });
    if (isAjax(req)) return res.json({ ok: true, message: 'Internship deleted.' });
    req.session.flash = { type: 'success', message: 'Internship deleted.' };
    res.redirect('/company/manage-listings');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not delete internship.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not delete internship.' });
  }
});


router.get('/cv/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('internshipId').lean();
    if (!application || !application.internshipId ||
        String(application.internshipId.postedByUserId) !== String(req.currentUser._id)) {
      return res.status(404).render('error', { title: 'Not Found', message: 'Application not found.' });
    }
    if (!application.cvFilePath) {
      return res.status(404).render('error', { title: 'No CV', message: 'No CV was attached to this application.' });
    }
    const filePath = path.join(__dirname, '..', 'uploads', application.cvFilePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).render('error', {
        title: 'CV file not available',
        message: 'This CV was uploaded in a previous session and isn\'t in the current uploads folder. Ask the student to re-apply, or restore the original uploads folder.'
      });
    }
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not open the CV.' });
  }
});


router.get('/applications', async (req, res) => {
  try {
    const myListingIds = (await Internship.find({ postedByUserId: req.currentUser._id }, '_id')).map(i => i._id);
    const pagination = await paginate(Application,
      { internshipId: { $in: myListingIds } },
      { page: req.query.page, limit: 8, sort: { createdAt: -1 }, populate: 'internshipId' });
    res.render('company/applications', {
      title: 'Applications — InternHub', applications: pagination.items,
      pagination, baseUrl: '/company/applications', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load applications.' });
  }
});


router.post('/accept-application/:id', async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('internshipId');
    if (!app || !app.internshipId || String(app.internshipId.postedByUserId) !== String(req.currentUser._id)) {
      return res.status(404).render('error', { title: 'Error', message: 'Application not found.' });
    }
    await Application.findByIdAndUpdate(req.params.id, { status: 'accepted' });
    await User.findByIdAndUpdate(app.studentId, { $addToSet: { takenInternships: app.internshipId._id } });
    try {
      const appUrl = process.env.APP_URL || 'http://localhost:8080';
      const letterLink = `${appUrl}/student/acceptance-letter/${app._id}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER, to: app.studentEmail,
        subject: `Letter of Acceptance — ${app.internshipId.title}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#171A20;line-height:1.6">
            <h2 style="color:#3457DC;margin-bottom:4px">InternHub — Letter of Acceptance</h2>
            <p>Dear <strong>${app.studentName || 'Student'}</strong>,</p>
            <p>We are pleased to inform you that your application for the position below has been <strong>accepted</strong>.</p>
            <table style="border-collapse:collapse;margin:16px 0;background:#FAFAFA;border:1px solid #E4E4E4;border-radius:8px">
              <tr><td style="padding:10px 18px"><strong>Position:</strong></td><td style="padding:10px 18px">${app.internshipId.title}</td></tr>
              <tr><td style="padding:10px 18px"><strong>Company:</strong></td><td style="padding:10px 18px">${app.internshipId.company}</td></tr>
            </table>
            <p>Congratulations! We look forward to working with you and wish you a rewarding internship experience.</p>
            <p style="margin:22px 0">
              <a href="${letterLink}" style="background:#171A20;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;display:inline-block">View &amp; print your acceptance letter</a>
            </p>
            <p style="margin-top:24px">Best regards,<br><strong>The InternHub Team</strong></p>
          </div>`
      });
    } catch (mailErr) { console.error('Email error:', mailErr.message); }
    if (isAjax(req)) return res.json({ ok: true, status: 'accepted', message: 'Application accepted and student notified.' });
    req.session.flash = { type: 'success', message: 'Application accepted and student notified.' };
    res.redirect('/company/applications');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not accept application.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not accept application.' });
  }
});


router.post('/reject-application/:id', async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate('internshipId');
    await Application.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    if (app && app.studentEmail) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER, to: app.studentEmail,
          subject: `Update on your application${app.internshipId ? ' to ' + app.internshipId.title : ''}`,
          html: `<p>Thank you for applying${app.internshipId ? ' to <strong>' + app.internshipId.title + '</strong>' : ''}. After careful consideration, the company has decided not to move forward at this time.</p><p>Keep exploring new opportunities on InternHub — the right fit is out there.</p>`
        });
      } catch (mailErr) { console.error('Reject email error:', mailErr.message); }
    }
    if (isAjax(req)) return res.json({ ok: true, status: 'rejected', message: 'Application rejected.' });
    req.session.flash = { type: 'success', message: 'Application rejected.' };
    res.redirect('/company/applications');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not reject application.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not reject application.' });
  }
});


router.get('/my-students', async (req, res) => {
  try {
    const myListingIds = (await Internship.find({ postedByUserId: req.currentUser._id }, '_id')).map(i => i._id);
    const students = await Application.find({ internshipId: { $in: myListingIds }, status: 'accepted' })
      .populate('internshipId').lean();
    const studentIds = students.map(s => s.studentId);
    const feedbackDocs = await Feedback.find({
      companyId: req.currentUser._id, studentId: { $in: studentIds }, kind: 'company-to-student'
    }).lean();
    const feedbackMap = {};
    feedbackDocs.forEach(f => { feedbackMap[f.studentId.toString()] = f; });
    res.render('company/my-students', { title: 'My Students — InternHub', students, feedbackMap, flash: getFlash(req) });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load students.' });
  }
});


router.post('/give-feedback', async (req, res) => {
  try {
    const { studentId, internshipId, rating, text } = req.body;
    const existing = await Feedback.findOne({ companyId: req.currentUser._id, studentId, kind: 'company-to-student' });
    if (existing) {
      if (isAjax(req)) return res.status(400).json({ ok: false, message: 'You already gave feedback to this student.' });
      req.session.flash = { type: 'error', message: 'You already gave feedback to this student.' };
      return res.redirect('/company/my-students');
    }
    await Feedback.create({ kind: 'company-to-student', companyId: req.currentUser._id, studentId, internshipId, rating: parseInt(rating), text });
    
    User.findById(studentId, 'email name profile').lean().then(function (stu) {
      if (stu && stu.email) {
        transporter.sendMail({
          from: process.env.EMAIL_USER, to: stu.email,
          subject: 'You received new feedback on InternHub',
          html: `
            <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#171A20;line-height:1.6">
              <h2 style="color:#3457DC">New feedback from ${req.currentUser.companyName || req.currentUser.name}</h2>
              <p>Hi ${stu.name || 'there'},</p>
              <p>You received feedback on your internship:</p>
              <p style="font-size:18px"><strong>Rating:</strong> ${parseInt(rating)} / 5</p>
              <blockquote style="border-left:3px solid #3457DC;margin:12px 0;padding:8px 16px;background:#FAFAFA">${text}</blockquote>
              <p style="margin-top:24px">Best regards,<br><strong>The InternHub Team</strong></p>
            </div>`
        }).catch(function (e) { console.error('Feedback email error:', e.message); });
      }
    }).catch(function () {});
    if (isAjax(req)) return res.json({ ok: true, message: 'Feedback sent!' });
    req.session.flash = { type: 'success', message: 'Feedback sent!' };
    res.redirect('/company/my-students');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not save feedback.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not save feedback.' });
  }
});

module.exports = router;
