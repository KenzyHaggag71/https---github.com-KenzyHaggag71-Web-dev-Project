const crypto = require('crypto');
const { transporter } = require('./mailer');
const User = require('../models/User');

const MAX_RECIPIENTS = 300;      
const SEND_GAP_MS = 150;         

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function notifyStudentsOfNewInternship(internship) {
  try {
    if (!process.env.EMAIL_USER) return;

    const appUrl = process.env.APP_URL || 'http://localhost:8080';
    const students = await User.find({
      role: { $in: ['user', 'student'] },
      status: { $ne: 'blocked' },
      internshipAlerts: { $ne: false },
      email: { $exists: true, $ne: '' }
    }).limit(MAX_RECIPIENTS);

    if (!students.length) return;

    const title = esc(internship.title);
    const company = esc(internship.company);
    const location = esc(internship.location || 'See listing');
    const category = esc(internship.category || '');
    const exploreLink = appUrl + '/student/explore' +
      (internship.category ? ('?category=' + encodeURIComponent(internship.category)) : '');

    let sent = 0;
    for (const student of students) {
      try {
        if (!student.unsubscribeToken) {
          student.unsubscribeToken = crypto.randomBytes(24).toString('hex');
          await student.save();
        }
        const unsubLink = appUrl + '/unsubscribe/' + student.unsubscribeToken;
        const name = esc(student.profile && student.profile.fullName ? student.profile.fullName : student.name || 'there');

        await transporter.sendMail({
          from: `"InternHub" <${process.env.EMAIL_USER}>`,
          to: student.email,
          subject: `New internship: ${internship.title} at ${internship.company}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
              <h2 style="color:#3457DC;margin-bottom:4px">New internship just posted 🎓</h2>
              <p style="margin-top:0;color:#374151">Hi ${name}, a new opportunity matching the InternHub catalog is now live:</p>
              <div style="border:1px solid #E4E4E4;border-radius:10px;padding:16px;margin:14px 0">
                <p style="font-size:16px;font-weight:700;margin:0 0 6px">${title}</p>
                <p style="margin:0;color:#374151">${company}</p>
                <p style="margin:6px 0 0;color:#6b7280;font-size:13px">${location}${category ? ' · ' + category : ''}</p>
              </div>
              <a href="${exploreLink}"
                 style="display:inline-block;padding:10px 24px;background:#3457DC;color:#fff;border-radius:6px;text-decoration:none">
                View internships
              </a>
              <p style="margin-top:26px;color:#9ca3af;font-size:12px">
                You're receiving this because you have InternHub internship alerts on.
                <a href="${unsubLink}" style="color:#6b7280">Unsubscribe from these emails</a>.
              </p>
            </div>`
        });
        sent++;
        if (SEND_GAP_MS) await sleep(SEND_GAP_MS);
      } catch (err) {
        console.error('Student alert send error (' + student.email + '):', err.message);
      }
    }
    console.log('[alerts] New-internship emails sent to ' + sent + ' student(s).');
  } catch (err) {
    console.error('notifyStudentsOfNewInternship error:', err.message);
  }
}

module.exports = { notifyStudentsOfNewInternship };
