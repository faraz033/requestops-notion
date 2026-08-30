# RequestOps

A personal project automating the college event-permission workflow: a student submits a request through a live web form, a coordinator approves or rejects it **inside Notion**, and the system fires a real confirmation/rejection email plus writes a code-attributed audit log — fully autonomous, deployed, and running without any manual intervention.

**Live:** https://requestops.onrender.com

---

## Architecture

```
Trigger (styled web form, deployed)
        │
        ▼
  Backend Service (Node.js / Express, hosted on Render)
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
  Cron job (every 2 min, runs on the deployed server) detects the decision
        │
        ├─▶ Real Action: email sent via Resend (HTTP API)
        └─▶ Run Log: row written by code, real timestamp
```

Notion is the only interface the coordinator ever touches — no separate dashboard, no code, no terminal.

---

## Status: Complete

Every piece below has been built, tested, and verified running in production (not just locally):

- ✅ Live, deployed intake form — styled, hosted at the URL above
- ✅ Notion authentication and page creation
- ✅ AI extraction (Groq) — fills in event name/date/venue from free text only when those fields are left blank; zero AI calls when the form is filled in cleanly
- ✅ Coordinator decision detection — both Approved and Rejected branches, tested end-to-end
- ✅ Real email delivery via Resend's HTTP API, confirmed landing in a real inbox — switched from Gmail SMTP after discovering Render's free tier blocks outbound SMTP ports (25/465/587) as an anti-abuse measure
- ✅ Run Log — every row written by code with a real timestamp, never typed by hand
- ✅ Idempotency — a request is only ever processed once; a failed action retries automatically instead of silently dropping
- ✅ Fully autonomous — a cron job on the deployed server checks Notion every 2 minutes with zero manual triggers
- ✅ Deployed on Render, verified working end-to-end from a real submission through to a real email, with the server running independently of any local machine
- ✅ Status lookup page (`/status.html`) — students can check Pending/Approved/Rejected state by reference ID, linked directly from the post-submit confirmation screen
- ✅ Test/dev data cleaned out of both Notion databases

---

## Setup (to run your own copy)

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

```bash
cp .env.example .env
```

Fill in real values — see `.env.example` for the full list (Notion, Resend, AI).

### 4. Run locally

```bash
node src/server.js
```

Visit `http://localhost:3000`.

### 5. Deploy

Push to GitHub, connect the repo on [Render](https://render.com) as a Web Service:
- Build command: `npm install`
- Start command: `node src/server.js`
- Add every variable from `.env` as an environment variable in Render's dashboard (except `PORT` — Render sets that automatically)

---

## How each piece works

- **`src/notion.js`** — all Notion API calls: creating requests, querying for coordinator decisions, writing Run Log rows, locking a request as processed.
- **`src/email.js`** — sends the real action (approval/rejection email) via Resend's HTTP API. Originally used Gmail SMTP through `nodemailer`, but Render's free tier blocks outbound SMTP ports, so this was rewritten to use HTTPS instead — the two exported functions (`sendApprovalEmail`, `sendRejectionEmail`) kept the same signatures, so nothing else in the codebase needed to change.
- **`src/ai.js`** — the load-bearing AI step. `looksMessy()` decides deterministically whether AI is even needed; `extractFieldsFromText()` calls Groq's API and only fires when structured form fields were left blank.
- **`src/server.js`** — the public form route, the decision processor, and the cron schedule that runs it automatically.
- **`public/index.html`** — the student-facing form, including a proper confirmation state after submission, with a direct link through to the status page for the request just created.
- **`public/status.html`** — lets a student check their request's current state (Pending/Approved/Rejected) by reference ID, including the coordinator's rejection reason when applicable.

---

## Design principles this project follows

- **Notion is the only coordinator interface.** No separate dashboard was built.
- **AI is narrow and conditional, never decorative.** It only runs when structured fields are genuinely missing — never as a wrapper around something a simple `if` statement could already do.
- **The coordinator's own input is never overwritten.** `Decision Reason` is read by code, never written to, so a rejection reason typed by a human survives all the way into the email the student receives.
- **Failures don't fail silently.** If an email send fails, the request is not marked as processed — it retries automatically on the next cron cycle.

---

## Known considerations (not blockers, just honest notes)

- Render's free tier spins the server down after inactivity, adding a ~30-50 second delay to the first request after idle periods. This also means the cron scheduler stops entirely while the server is asleep — a decision made in Notion won't be acted on until something wakes the server back up.
- Resend's free tier, without a verified custom domain, only delivers to the email address the Resend account itself is signed up with — not to arbitrary addresses typed into the form. Fine for personal testing; would need domain verification to email real, distinct student inboxes.
- Running the server both locally and on Render at the same time can cause the same decision to be processed twice (two independent cron loops racing to claim the same unprocessed row before either finishes locking it) — occasionally results in a duplicate email. Low-stakes for a personal project; run only one instance at a time to avoid it.
- No automated test suite — every piece was manually verified end-to-end during development. Future changes should be re-tested manually the same way.
