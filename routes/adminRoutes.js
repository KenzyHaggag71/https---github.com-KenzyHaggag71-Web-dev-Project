const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { paginate, baseQuery } = require('../utils/paginate');
const { sendApprovalEmail } = require('../utils/mailer');

function isAjax(req) { return req.get('X-Requested-With') === 'fetch'; }
function getFlash(req) {
  if (req.session.flash) {
    const f = req.session.flash;
    delete req.session.flash;
    return f;
  }
  return null;
}

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, companies, mentors, students, internships, applications,
           pendingCompanies, pendingMentors] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
  role: 'company',
  $or: [
    { status: 'approved' },
    { approved: true }
  ]
}),
      User.countDocuments({ role: 'mentor', status: 'approved' }),
      User.countDocuments({ role: 'user' }),
      Internship.countDocuments(),
      Application.countDocuments(),
      User.find({
  role: 'company',
  $or: [
    { status: 'pending' },
    { status: { $exists: false } },
    { approved: { $ne: true }, status: { $ne: 'approved' } }
  ]
}).lean(),
      User.find({ status: 'pending', role: 'mentor' }).lean()
    ]);

    // Aggregates for the analytics charts
    const [catAgg, statusAgg] = await Promise.all([
      Internship.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    const charts = {
      usersByRole: { students, mentors, companies },
      categories: catAgg.map(c => ({ key: c._id || 'Other', count: c.count })),
      statuses: statusAgg.map(s => ({ key: s._id || 'pending', count: s.count }))
    };

    res.render('admin/dashboard', {
      title: 'Admin Hub — InternHub',
      stats: { totalUsers, companies, mentors, students, internships, applications,
               pendingCompanies: pendingCompanies.length, pendingMentors: pendingMentors.length },
      pendingCompanies, pendingMentors, charts,
      pendingCount: pendingCompanies.length + pendingMentors.length,
      flash: getFlash(req)
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load admin dashboard.' });
  }
});

// Users list
router.get('/users', async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ]
    } : {};
    const pagination = await paginate(User, query, {
      page: req.query.page, limit: 10, sort: { createdAt: -1 }
    });
    res.render('admin/users', {
      title: 'Manage Users — Admin', users: pagination.items, search,
      pagination, baseUrl: '/admin/users', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load users.' });
  }
});

// Approvals page
router.get('/approvals', async (req, res) => {
  try {
    const pendingCompanyQuery = {
      role: 'company',
      $or: [
        { status: 'pending' },
        { status: { $exists: false } },
        { approved: { $ne: true }, status: { $ne: 'approved' } }
      ]
    };

    const [pendingCompanies, pendingMentors] = await Promise.all([
      User.find(pendingCompanyQuery).lean(),
      User.find({ status: 'pending', role: 'mentor' }).lean()
    ]);

    res.render('admin/approvals', {
      title: 'Approvals — Admin',
      pendingCompanies,
      pendingMentors,
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', {
      title: 'Error',
      message: 'Could not load approvals.'
    });
  }
});

// All internships
router.get('/internships', async (req, res) => {
  try {
    const pagination = await paginate(Internship, {}, {
      page: req.query.page, limit: 10, sort: { createdAt: -1 }
    });
    res.render('admin/internships', {
      title: 'Internships — Admin', internships: pagination.items,
      pagination, baseUrl: '/admin/internships', baseQuery: baseQuery(req.query),
      flash: getFlash(req)
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Error', message: 'Could not load internships.' });
  }
});

// Approve user
router.post('/approve/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      approved: true
    }, { new: true });

    if (user && user.email) {
      sendApprovalEmail(user.role, user.email, user.companyName || user.name)
        .catch(err => console.error('Approval email error:', err.message));
    }

    if (isAjax(req)) return res.json({ ok: true, message: 'User approved successfully.' });
    req.session.flash = { type: 'success', message: 'User approved successfully.' };
    res.redirect(req.headers.referer || '/admin/approvals');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not approve user.' });
    res.status(500).render('error', {
      title: 'Error',
      message: 'Could not approve user.'
    });
  }
});

// Reject (delete) user
router.post('/reject/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    if (isAjax(req)) return res.json({ ok: true, message: 'User rejected and removed.' });
    req.session.flash = { type: 'success', message: 'User rejected and removed.' };
    res.redirect(req.headers.referer || '/admin/approvals');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not reject user.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not reject user.' });
  }
});

// Toggle block/unblock
router.post('/toggle-block/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).render('error', { title: 'Error', message: 'User not found.' });
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    await User.findByIdAndUpdate(req.params.id, { status: newStatus });
    if (isAjax(req)) return res.json({ ok: true, status: newStatus, message: `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}.` });
    req.session.flash = { type: 'success', message: `User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}.` };
    res.redirect('/admin/users');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not update user.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not update user.' });
  }
});

// Delete user
router.post('/delete-user/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    if (isAjax(req)) return res.json({ ok: true, message: 'User deleted.' });
    req.session.flash = { type: 'success', message: 'User deleted.' };
    res.redirect('/admin/users');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not delete user.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not delete user.' });
  }
});

// Delete internship
router.post('/delete-internship/:id', async (req, res) => {
  try {
    await Internship.findByIdAndDelete(req.params.id);
    if (isAjax(req)) return res.json({ ok: true, message: 'Internship deleted.' });
    req.session.flash = { type: 'success', message: 'Internship deleted.' };
    res.redirect('/admin/internships');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not delete internship.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not delete internship.' });
  }
});

module.exports = router;
