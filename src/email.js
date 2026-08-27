const nodemailer = require("nodemailer");

// Falls back to console logging if SMTP isn't configured -- keeps the
// system testable even without email set up, but now that we have real
// credentials, it'll actually send.
const transporter = process.env.SMTP_USER
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // false because we're using STARTTLS on port 587, not raw SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendApprovalEmail({ to, studentName, eventName, eventDate, venue }) {
  const subject = `Approved: ${eventName}`;
  const body = `Hi ${studentName}, your request for "${eventName}" on ${eventDate} at ${venue} has been APPROVED.`;
  return sendOrLog({ to, subject, body });
}

async function sendRejectionEmail({ to, studentName, eventName, reason }) {
  const subject = `Not approved: ${eventName}`;
  const body = `Hi ${studentName}, your request for "${eventName}" was not approved. Reason: ${reason || "none given"}.`;
  return sendOrLog({ to, subject, body });
}

async function sendOrLog({ to, subject, body }) {
  if (!transporter) {
    console.log(`[email:MOCK] to=${to} subject="${subject}"\n${body}\n`);
    return { mocked: true };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text: body,
  });

  console.log(`[email:SENT] to=${to} subject="${subject}" messageId=${info.messageId}`);
  return { mocked: false, messageId: info.messageId };
}

module.exports = { sendApprovalEmail, sendRejectionEmail };