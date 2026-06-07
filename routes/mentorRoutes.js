const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Internship = require('../models/Internship');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const Application = require('../models/Application');
const { transporter } = require('../utils/mailer');

function isAjax(req) { return req.get('X-Requested-With') === 'fetch'; }
function getFlash(req) {
  if (req.session.flash) {
    const f = req.session.flash;
    delete req.session.flash;
    return f;
  }
  return null;
}

router.get('/dashboard', async (req, res) => {
  try {
    const mentorUser = await User.findById(req.currentUser._id).lean();
    const savedIds = mentorUser.takenInternships || [];

    const [savedInternships, recentApplications, projects, eligibleStudents] = await Promise.all([
      Internship.find({ _id: { $in: savedIds } }).lean(),
      Application.find({ studentId: req.currentUser._id }).populate('internshipId').sort({ createdAt: -1 }).limit(5).lean(),
      Project.find({ mentorId: req.currentUser._id }).lean(),
      User.find({ role: 'user', status: 'active' }).lean()
    ]);

    const pendingSubmissions = await Submission.find({
      projectId: { $in: projects.map(p => p._id) },
      status: 'submitted'
    }).populate('studentId', 'name').populate('projectId', 'title').lean();

    res.render('mentor/dashboard', {
      title: 'Mentor Dashboard - InternHub',
      savedInternships,
      recentApplications,
      takenInternships: savedInternships,
      projects,
      pendingSubmissions,
      eligibleStudents,
      stats: {
        savedInternships: savedIds.length,
        applications: recentApplications.length,
        mentorProjects: projects.length,
        pendingSubmissions: pendingSubmissions.length
      },
      flash: getFlash(req),
      error: null
    });
  } catch (err) {
    console.error('Mentor dashboard error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Could not load mentor dashboard.' });
  }
});

function isPastDate(dateString) {
  if (!dateString) return false;

  const selectedDate = new Date(dateString + 'T00:00:00');
  if (Number.isNaN(selectedDate.getTime())) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

router.post('/assign-project', async (req, res) => {
  try {
    let { internshipId, targetYear, title, deadline, description, instructions, assignedTo } = req.body;
    if (!Array.isArray(assignedTo)) assignedTo = assignedTo ? [assignedTo] : [];

    if (!title || !description) {
      if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Title and description are required.' });
      req.session.flash = { type: 'error', message: 'Title and description are required.' };
      return res.redirect('/mentor/dashboard');
    }

    if (deadline && isPastDate(deadline)) {
      if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Deadline cannot be in the past.' });
      req.session.flash = { type: 'error', message: 'Deadline cannot be in the past.' };
      return res.redirect('/mentor/dashboard');
    }

    let company = '';
    let category = '';

    if (internshipId) {
      const internship = await Internship.findById(internshipId).lean();
      if (internship) {
        company = internship.company;
        category = internship.category;
      }
    }

    await Project.create({
      mentorId: req.currentUser._id,
      internshipId: internshipId || null,
      company,
      category,
      title,
      description,
      instructions: instructions || '',
      deadline: deadline ? new Date(deadline) : null,
      targetYear: targetYear || 'any',
      assignedTo
    });

    // Notify each assigned student by email (fire-and-forget, never blocks the response)
    if (Array.isArray(assignedTo) && assignedTo.length) {
      const mentorName = req.currentUser.name || 'Your mentor';
      const deadlineText = deadline ? new Date(deadline).toLocaleDateString() : 'No deadline set';
      const appUrl = process.env.APP_URL || 'http://localhost:8080';
      User.find({ _id: { $in: assignedTo } }, 'email name').lean()
        .then(function (students) {
          students.forEach(function (s) {
            if (!s || !s.email) return;
            transporter.sendMail({
              from: process.env.EMAIL_USER, to: s.email,
              subject: 'You have been assigned a new project',
              html: `
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#171A20;line-height:1.6">
                  <h2 style="color:#3457DC">New project assigned</h2>
                  <p>Hi ${s.name || 'there'},</p>
                  <p><strong>${mentorName}</strong> has assigned you a new project:</p>
                  <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin:16px 0;background:#FAFAFA">
                    <p style="margin:0 0 8px"><strong>Project:</strong> ${title}</p>
                    <p style="margin:0 0 8px"><strong>Deadline:</strong> ${deadlineText}</p>
                    <p style="margin:0"><strong>Details:</strong> ${description}</p>
                  </div>
                  <p><a href="${appUrl}/student/projects" style="display:inline-block;background:#3457DC;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px">View your projects</a></p>
                  <p style="margin-top:24px">Best regards,<br><strong>The InternHub Team</strong></p>
                </div>`
            }).catch(function (e) { console.error('Assign-project email error:', e.message); });
          });
        })
        .catch(function (e) { console.error('Assign-project lookup error:', e.message); });
    }

    req.session.flash = { type: 'success', message: 'Project assigned successfully!' };
    if (isAjax(req)) { delete req.session.flash; return res.json({ ok: true, message: 'Project assigned successfully!', redirect: '/mentor/dashboard#my-projects' }); }
    res.redirect('/mentor/dashboard#my-projects');
  } catch (err) {
    console.error('Assign project error:', err.message);
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not assign project.' });
    req.session.flash = { type: 'error', message: 'Could not assign project.' };
    res.redirect('/mentor/dashboard');
  }
});

router.post('/evaluate-submission/:id', async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    if (!grade || !feedback) {
      if (isAjax(req)) return res.status(400).json({ ok: false, message: 'Grade and feedback are required.' });
      req.session.flash = { type: 'error', message: 'Grade and feedback are required.' };
      return res.redirect('/mentor/dashboard#pending-submissions');
    }

    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback, status: 'evaluated' },
      { new: true }
    ).populate('studentId', 'email name').populate('projectId', 'title');

    // Notify the student by email (fire-and-forget)
    if (submission && submission.studentId && submission.studentId.email) {
      const projectTitle = submission.projectId ? submission.projectId.title : (submission.title || 'your project');
      transporter.sendMail({
        from: process.env.EMAIL_USER, to: submission.studentId.email,
        subject: 'Your project submission has been evaluated',
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#171A20;line-height:1.6">
            <h2 style="color:#3457DC">Your submission was evaluated</h2>
            <p>Hi ${submission.studentId.name || 'there'},</p>
            <p>Your mentor has reviewed your submission for <strong>${projectTitle}</strong>.</p>
            <p style="font-size:18px"><strong>Grade:</strong> ${grade}</p>
            <blockquote style="border-left:3px solid #3457DC;margin:12px 0;padding:8px 16px;background:#FAFAFA">${feedback}</blockquote>
            <p style="margin-top:24px">Best regards,<br><strong>The InternHub Team</strong></p>
          </div>`
      }).catch(function (e) { console.error('Evaluation email error:', e.message); });
    }

    if (isAjax(req)) return res.json({ ok: true, message: 'Submission evaluated!' });
    req.session.flash = { type: 'success', message: 'Submission evaluated!' };
    res.redirect('/mentor/dashboard#pending-submissions');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not evaluate submission.' });
    res.status(500).render('error', { title: 'Error', message: 'Could not evaluate submission.' });
  }
});

router.get('/edit-project/:id', async (req, res) => {
  try {
    const [project, mentorUser, eligibleStudents] = await Promise.all([
      Project.findOne({ _id: req.params.id, mentorId: req.currentUser._id }).lean(),
      User.findById(req.currentUser._id).lean(),
      User.find({ role: 'user', status: 'active' }).lean()
    ]);

    if (!project) {
      req.session.flash = { type: 'error', message: 'Project not found.' };
      return res.redirect('/mentor/dashboard');
    }

    const takenInternships = await Internship.find({
      _id: { $in: mentorUser.takenInternships || [] }
    }).lean();

    res.render('mentor/edit-project', {
      title: 'Edit Project - InternHub',
      project,
      takenInternships,
      eligibleStudents,
      flash: getFlash(req),
      error: null
    });
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Could not load project.' };
    res.redirect('/mentor/dashboard');
  }
});

router.post('/update-project/:id', async (req, res) => {
  try {
    let { internshipId, targetYear, title, deadline, description, instructions, assignedTo } = req.body;
    if (!Array.isArray(assignedTo)) assignedTo = assignedTo ? [assignedTo] : [];

    if (!title || !description) {
      req.session.flash = { type: 'error', message: 'Title and description are required.' };
      return res.redirect('/mentor/edit-project/' + req.params.id);
    }

    if (deadline && isPastDate(deadline)) {
      req.session.flash = { type: 'error', message: 'Deadline cannot be in the past.' };
      return res.redirect('/mentor/edit-project/' + req.params.id);
    }

    let company = '';
    let category = '';

    if (internshipId) {
      const internship = await Internship.findById(internshipId).lean();
      if (internship) {
        company = internship.company;
        category = internship.category;
      }
    }

    await Project.findOneAndUpdate(
      { _id: req.params.id, mentorId: req.currentUser._id },
      {
        internshipId: internshipId || null,
        company,
        category,
        title,
        description,
        instructions: instructions || '',
        deadline: deadline ? new Date(deadline) : null,
        targetYear: targetYear || 'any',
        assignedTo
      }
    );

    req.session.flash = { type: 'success', message: 'Project updated.' };
    res.redirect('/mentor/dashboard#my-projects');
  } catch (err) {
    req.session.flash = { type: 'error', message: 'Could not update project.' };
    res.redirect('/mentor/dashboard');
  }
});

router.post('/delete-project/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, mentorId: req.currentUser._id });

    if (!project) {
      if (isAjax(req)) return res.status(404).json({ ok: false, message: 'Project not found.' });
      req.session.flash = { type: 'error', message: 'Project not found.' };
      return res.redirect('/mentor/dashboard');
    }

    await Submission.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id });

    if (isAjax(req)) return res.json({ ok: true, message: 'Project deleted.' });
    req.session.flash = { type: 'success', message: 'Project deleted.' };
    res.redirect('/mentor/dashboard#my-projects');
  } catch (err) {
    if (isAjax(req)) return res.status(500).json({ ok: false, message: 'Could not delete project.' });
    req.session.flash = { type: 'error', message: 'Could not delete project.' };
    res.redirect('/mentor/dashboard');
  }
});

module.exports = router;