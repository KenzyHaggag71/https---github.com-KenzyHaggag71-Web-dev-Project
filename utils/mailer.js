const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendWelcomeEmail(role, to, name) {
  const subjects = {
    student: 'Welcome to InternHub! 🎓',
    mentor:  'Your InternHub mentor application is under review',
    company: 'Your InternHub company account is under review'
  };

  const bodies = {
    student: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#6366f1">Welcome to InternHub, ${name}! 🎓</h2>
        <p>Your account is ready. Start exploring internship opportunities tailored to your major and interests.</p>
        <a href="${process.env.APP_URL || 'http://localhost:8080'}/student/explore"
           style="display:inline-block;margin-top:12px;padding:10px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none">
          Explore Internships
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">InternHub · Connecting students with dream internships</p>
      </div>`,

    mentor: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#6366f1">Thanks for applying as a mentor, ${name}!</h2>
        <p>Your application is now <strong>pending admin review</strong>. We'll notify you once it's approved — usually within 24 hours.</p>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">InternHub · Connecting students with dream internships</p>
      </div>`,

    company: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#6366f1">Welcome to InternHub, ${name}!</h2>
        <p>Your company account is now <strong>pending admin approval</strong>. Once approved you can post internships and review applications.</p>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">InternHub · Connecting students with dream internships</p>
      </div>`
  };

  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: subjects[role] || 'Welcome to InternHub',
    html: bodies[role] || `<p>Welcome, ${name}!</p>`
  });
}

async function sendApprovalEmail(role, to, name) {
  const appUrl = process.env.APP_URL || 'http://localhost:8080';
  const dest = role === 'company' ? '/company/dashboard'
             : role === 'mentor'  ? '/mentor/dashboard'
             : '/student/explore';
  const intro = role === 'company'
    ? 'Your company account has been approved. You can now post internships and review applications.'
    : role === 'mentor'
    ? 'Your mentor application has been approved. You can now access your mentor dashboard.'
    : 'Your account has been approved.';

  await transporter.sendMail({
    from: `"InternHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your InternHub account has been approved ✅',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#3457DC">Good news, ${name}! ✅</h2>
        <p>${intro}</p>
        <a href="${appUrl}${dest}"
           style="display:inline-block;margin-top:12px;padding:10px 24px;background:#3457DC;color:#fff;border-radius:6px;text-decoration:none">
          Go to your dashboard
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:13px">InternHub · Connecting students with dream internships</p>
      </div>`
  });
}

module.exports = { transporter, sendWelcomeEmail, sendApprovalEmail };