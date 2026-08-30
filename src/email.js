const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendApprovalEmail({ to, studentName, eventName, eventDate, venue }) {
  const subject = `Approved: ${eventName}`;
  const body = `Hi ${studentName}, your request for "${eventName}" on ${eventDate} at ${venue} has been APPROVED.`;
  return sendViaResend({ to, subject, body });
}

async function sendRejectionEmail({ to, studentName, eventName, reason }) {
  const subject = `Not approved: ${eventName}`;
  const body = `Hi ${studentName}, your request for "${eventName}" was not approved. Reason: ${reason || "none given"}.`;
  return sendViaResend({ to, subject, body });
}

async function sendViaResend({ to, subject, body }) {
  if (!RESEND_API_KEY) {
    console.log(`[email:MOCK] to=${to} subject="${subject}"\n${body}\n`);
    return { mocked: true };
  }

  // Resend's own sandbox domain (onboarding@resend.dev) works without any
  // setup, but without a verified domain it can only deliver to the email
  // address you signed up with on Resend -- fine for personal testing.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RequestOps <onboarding@resend.dev>",
      to,
      subject,
      text: body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Resend API failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  console.log(`[email:SENT via Resend] to=${to} subject="${subject}" id=${data.id}`);
  return { mocked: false, id: data.id };
}

module.exports = { sendApprovalEmail, sendRejectionEmail };