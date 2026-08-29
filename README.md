# RequestOps

A personal project automating the college event-permission workflow: a student submits a request through a simple web form, a coordinator approves or rejects it **inside Notion**, and the system fires a real confirmation/rejection email plus writes a code-attributed audit log — with no manual intervention once running.

---

## Architecture

```
Trigger (styled web form)
        │
        ▼
  Backend Service (Node.js / Express)
        │
        ├─▶ (if structured fields are left blank) AI extraction fills them in from free text
        │
        ▼
  Notion "Requests" DB  ──▶  Page created, Status = Pending
        │
        ▼
  Coordinator reviews & decides inside Notion (Approved / Rejected)
        │
        ▼
  Cron job (every 2 min, fully autonomous) detects the decision
        │
        ├─▶ Real Action: email sent via Gmail SMTP
        └─▶ Run Log: row written by code, real timestamp
```

Notion is the only human interface for the coordinator — they never touch code, a terminal, or a separate dashboard.

---

## Status

Everything below has been built and manually tested end-to-end:

- ✅ Styled intake form (student-facing trigger)
- ✅ Notion authentication and page creation
- ✅ AI extraction — fills in event name/date/venue from free text, only when those fields are left blank (no AI call at all if the form is filled in cleanly)
- ✅ Coordinator decision detection (both Approved and Rejected branches)
- ✅ Real email delivery via Gmail SMTP
- ✅ Run Log — every row written by code with a real timestamp, never typed by hand
- ✅ Idempotency — a request is only ever processed once (`Processed At` lock), and a failed action retries automatically instead of being silently dropped
- ✅ Fully autonomous scheduling — a cron job checks Notion every 2 minutes with no manual trigger required

**Not yet done:**
- ⬜ Deployment (currently only runs locally)
- ⬜ Cleanup of early test/dev data in the Notion databases

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Notion setup

Create an integration at [notion.so/my-integrations](https://notion.so/my-integrations) and copy its access token. Create two full-page databases and connect the integration to both (`···` menu → Connections).

#### "Requests" database

| Property | Type |
|---|---|
| Request ID | Title |
| Student Name | Text |
| Email | Email |
| Event Name | Text |
| Event Date | Date |
| Venue | Text |
| Description | Text |
| Status | Select — `Pending`, `Approved`, `Rejected` |
| Decision Reason | Text — coordinator-owned, code only reads this, never overwrites it |
| Processed At | Date — set by code once the real action has fired |

#### "Run Log" database

| Property | Type |
|---|---|
| Run ID | Title |
| Request ID | Text |
| Status | Select — `Created`, `Success`, `Failed` |
| Timestamp | Date (with time) |
| Outcome | Text |
| Error | Text |

### 3. Environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

See `.env.example` for the full list of required variables (Notion, SMTP, AI).

### 4. Run it

```bash
node src/server.js
```

Visit `http://localhost:3000` to see the live intake form.

---

## How each piece works

- **`src/notion.js`** — all Notion API calls: creating requests, querying for coordinator decisions, writing Run Log rows, and locking a request as processed.
- **`src/email.js`** — sends the real action (approval/rejection email) via Gmail SMTP through `nodemailer`.
- **`src/ai.js`** — the load-bearing AI step. `looksMessy()` decides deterministically whether AI is even needed; `extractFieldsFromText()` calls Groq's API and only fires when the structured form fields were left blank.
- **`src/server.js`** — wires it all together: the public form route, the manual test routes used during development, the decision processor, and the cron schedule that runs it automatically.
- **`public/index.html`** — the actual student-facing form, including a proper confirmation state after submission.

---

## Design principles this project follows

- **Notion is the only coordinator interface.** No separate dashboard was built — the brief for projects like this consistently warns against a UI that "gives the human nothing" while Notion sits there decorative and unused.
- **AI is narrow and conditional, never decorative.** It only runs when structured fields are genuinely missing and free text needs interpreting — never as a wrapper around something a simple `if` statement could already do.
- **The coordinator's own input is never overwritten.** `Decision Reason` is read by code, never written to, so what a coordinator types when rejecting a request survives all the way into the email the student receives.
- **Failures don't fail silently.** If an email send fails, the request is not marked as processed — it retries automatically on the next cron cycle instead of the failure disappearing.
