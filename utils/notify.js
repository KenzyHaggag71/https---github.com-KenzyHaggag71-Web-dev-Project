const { transporter } = require('./mailer');

async function notify(message) {
  const to = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!to) return;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: message,
      text: message,
      html: `<p style="font-family:sans-serif;font-size:15px">${message}</p>
             <p style="color:#6b7280;font-size:12px">InternHub admin notification</p>`
    });
  } catch (err) {
    console.error('Notify email error:', err.message);
  }
}

module.exports = { notify };

