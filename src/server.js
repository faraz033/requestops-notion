require("dotenv").config();
const cron = require("node-cron");
const express = require("express");

const { notion, createRequest, getDecidedRequests, createRunLog, markProcessed, getText } = require("./notion");
const { sendApprovalEmail, sendRejectionEmail } = require("./email");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "RequestOps backend is alive" });
});

app.get("/test-create", async (req, res) => {
  try {
    const page = await createRequest({
      requestId: "REQ-TEST-" + Date.now(),
      studentName: "Test Student",
      email: "test@example.com",
      eventName: "Test Event",
      eventDate: "2026-09-01",
      venue: "Test Hall",
      description: "This is a test request created directly from code.",
    });
    res.json({ success: true, pageId: page.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/test-decided", async (req, res) => {
  try {
    const results = await getDecidedRequests();
    res.json({ count: results.length, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function processDecisions() {
  const requests = await getDecidedRequests();
  console.log(`Found ${requests.length} decided request(s)`);

  for (const page of requests) {
    const requestId = getText(page, "Request ID");
    const status = page.properties["Status"]?.select?.name;
    const studentName = getText(page, "Student Name");
    const email = getText(page, "Email");
    const eventName = getText(page, "Event Name");
    const eventDate = getText(page, "Event Date");
    const venue = getText(page, "Venue");
    const reason = getText(page, "Decision Reason");

    try {
      if (status === "Approved") {
        await sendApprovalEmail({ to: email, studentName, eventName, eventDate, venue });
        await createRunLog({ requestId, status: "Success", outcome: `Approval email sent to ${email}.` });
      } else if (status === "Rejected") {
        await sendRejectionEmail({ to: email, studentName, eventName, reason });
        await createRunLog({ requestId, status: "Success", outcome: `Rejection email sent to ${email}. Reason: ${reason || "none"}.` });
      }
      await markProcessed(page.id);
      console.log(`✓ ${requestId} processed`);
    } catch (error) {
      console.error(`✗ ${requestId} failed:`, error.message);
      await createRunLog({ requestId, status: "Failed", outcome: error.message });
    }
  }

  return requests.length;
}

app.get("/test-process", async (req, res) => {
  try {
    const count = await processDecisions();
    res.json({ processed: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Runs processDecisions() automatically on a schedule, with no human
// visiting a URL. "*/2 * * * *" means "every 2 minutes."
cron.schedule("*/2 * * * *", async () => {
  try {
    const count = await processDecisions();
    if (count > 0) {
      console.log(`[cron] automatically processed ${count} request(s)`);
    }
  } catch (error) {
    console.error("[cron] error:", error.message);
  }
});

console.log("[cron] scheduled to check every 2 minutes");
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});