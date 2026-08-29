require("dotenv").config();
const cron = require("node-cron");
const express = require("express");

const { notion, createRequest, getDecidedRequests, createRunLog, markProcessed, getText, getRequestByRequestId } = require("./notion");const { sendApprovalEmail, sendRejectionEmail } = require("./email");
const { looksMessy, extractFieldsFromText } = require("./ai");

const app = express();

app.use(express.json());
app.use(express.static("public"));

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

app.post("/api/requests", async (req, res) => {
  try {
    const { studentName, email, description } = req.body;
    let { eventName, eventDate, venue } = req.body;

    if (!studentName || !email || !description) {
      return res.status(400).json({ success: false, message: "Name, email, and a description are required." });
    }

    if (looksMessy({ eventName, eventDate, venue, description })) {
      console.log("[ai] structured fields missing, attempting extraction...");
      const extracted = await extractFieldsFromText(description);
      if (extracted) {
        eventName = eventName || extracted.eventName;
        eventDate = eventDate || extracted.eventDate;
        venue = venue || extracted.venue;
        console.log("[ai] extracted:", extracted);
      }
    }

    const requestId = "REQ-" + Date.now();

    await createRequest({
      studentName,
      email,
      eventName: eventName || "",
      eventDate: eventDate || null,
      venue: venue || "",
      description,
      requestId,
    });

    await createRunLog({
      requestId,
      status: "Created",
      outcome: `Request submitted by ${studentName}${eventName ? ` for "${eventName}"` : ""}. Awaiting coordinator decision.`,
    });

    res.json({ success: true, requestId });
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).json({ success: false, message: "Failed to create request." });
  }
});
app.get("/api/requests/:requestId", async (req, res) => {
  try {
    const page = await getRequestByRequestId(req.params.requestId);

    if (!page) {
      return res.status(404).json({ found: false });
    }

    res.json({
      found: true,
      requestId: getText(page, "Request ID"),
      studentName: getText(page, "Student Name"),
      eventName: getText(page, "Event Name"),
      eventDate: getText(page, "Event Date"),
      venue: getText(page, "Venue"),
      status: page.properties["Status"]?.select?.name || "Pending",
      decisionReason: getText(page, "Decision Reason"),
    });
  } catch (error) {
    console.error("Error looking up request:", error);
    res.status(500).json({ found: false, error: "Lookup failed." });
  }
});
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});