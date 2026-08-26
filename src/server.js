require("dotenv").config();
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "RequestOps backend is alive" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const { notion, createRequest, getDecidedRequests } = require("./notion");
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