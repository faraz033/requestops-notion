# RequestOps — Product Requirements Document

**Team:** Candor Compiler (team-B97617C1ECBB)
**College:** ABES Engineering College, Ghaziabad
**Track:** Notion Track
**Version:** 1.0
**Status:** In development

---

## 1. Summary

RequestOps automates one real, recurring job at the college — the **event permission request workflow** — and turns it into a running service with Notion as the sole human interface.

A student submits an event request. The backend structures it, creates a Pending page in Notion, and waits. A coordinator reviews and approves or rejects it **inside Notion** — no other tool, no separate dashboard. The moment that decision is made, the backend fires the real consequence (a confirmation or rejection email) and writes a timestamped, code-attributed row to a Run Log. No step in this loop is decorative: the approval genuinely gates the action, and the log genuinely proves what happened and when.

---

## 2. Problem Statement

### 2.1 What's broken today
Event permission requests currently move through informal, manual channels:
- Requests get typed into a WhatsApp group and quietly die there.
- Google Form submissions get manually retyped into a spreadsheet by an admin.
- Follow-ups never happen — nobody owns the loop back to the requester.
- There is no audit trail of what was approved, by whom, or when.

### 2.2 Who is affected
College department admins, club secretaries, and (per the track's audience framing) shop/small-agency operators who handle the same kind of repetitive intake-and-approval job by hand.

### 2.3 Why existing tools don't fix it
| Existing approach | Why it falls short |
|---|---|
| Spreadsheets | Manual re-entry, no trigger, no audit trail |
| Zapier / no-code chains | Conditional logic only; the "interesting part" lives in a no-code canvas, not in inspectable code |
| Heavy ERPs | Overkill for a single club/department; nobody adopts them |
| Chatbots | A doorway, not a system — no real state machine or audit trail behind them |

### 2.4 The actual gap
No running service exists whose **only human interface is Notion**, whose actions are backed by **code-written proof**, and whose human approval step **actually gates** a real-world action rather than just decorating a status field.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- G1: Fully automate intake, structuring, and routing of one real job (event permission requests) — no manual re-typing.
- G2: Make Notion the coordinator's entire workspace: they never touch code, a terminal, or a separate dashboard.
- G3: Ensure the human approval step blocks a real, consequential action (email dispatch), not a cosmetic UI state.
- G4: Produce an immutable, code-attributed Run Log with real timestamps that occur naturally throughout the event (not batch-generated before the demo).
- G5: Use AI only where deterministic rules genuinely cannot do the job (parsing messy free-text submissions).
- G6: Survive both judge tests:
  - **Delete-the-repo test** — with the backend removed, automation stops entirely. Proves the logic lives in code, not a no-code canvas with a Notion skin.
  - **Backend-off test** — with the backend merely turned off, the Notion workspace remains legible and independently useful to a human.

### 3.2 Non-goals (explicitly out of scope for this build)
- Not building a general-purpose form builder or workflow engine — this solves one specific job.
- Not replacing the college's official record-keeping system — this is an operational layer, not the system of record.
- Not building authentication/login for students — requests are submitted via a simple public form (v1 assumes a low-stakes, low-abuse environment typical of a single-department pilot).
- Not building a mobile app.
- Not supporting multi-step/multi-level approval chains in v1 (single coordinator approval only).

---

## 4. Users & Personas

| Persona | Role in the system | Primary need |
|---|---|---|
| **Student / requester** | Submits an event permission request via a simple web form | Fast submission, clear confirmation of outcome |
| **Coordinator / club secretary** | Reviews pending requests inside Notion, approves or rejects | A clean, readable queue; no tool outside Notion |
| **Judge / evaluator** (secondary) | Assesses whether the system meets track requirements | Clear proof of automation, human gating, and audit trail |

---

## 5. User Stories

1. **As a student**, I want to submit an event permission request in under a minute, so that I don't have to chase anyone on WhatsApp.
2. **As a student**, I want to be notified by email once a decision is made, so that I know whether my event is approved without having to follow up.
3. **As a coordinator**, I want to see all pending requests in one place inside Notion, so that I don't need any other tool to do my job.
4. **As a coordinator**, I want to approve or reject a request with a single field change, so that my part of the job takes seconds, not minutes.
5. **As a coordinator**, I want to give a reason when rejecting a request, so that the student knows what to fix.
6. **As a judge**, I want to delete the repository and see automation stop, so that I can confirm the logic isn't hidden inside a no-code tool.
7. **As a judge**, I want to turn the backend off and still browse a legible Notion workspace, so that I can confirm Notion is a real operational hub, not a decorative frontend.

---

## 6. Functional Requirements

### 6.1 Intake (Trigger)
- FR1: The system exposes a public endpoint (`POST /api/requests`) that accepts a student's event request.
- FR2: A minimal web form collects: student name, requester email, club/department, event name, event date, venue, and free-text details.
- FR3: If structured fields (event name, date, venue) are missing but free text is present, the system invokes an AI extraction step to fill them in. If structured fields are already filled, **no AI call is made**.
- FR4: Every submission creates exactly one Notion page in the **Requests** database with status `Pending`.
- FR5: Every submission writes one **Run Log** row with action `Created`.

### 6.2 Approval (Human Gate)
- FR6: The coordinator's only interface for decisions is the Notion **Requests** database.
- FR7: A decision is recorded by changing the `Status` field to `Approved` or `Rejected` (and optionally filling `Rejection Reason`).
- FR8: A background poller (cron, default every 2 minutes) checks for requests where `Status` has changed and `Processed` is still `false`.
- FR9: The system must not act on a request more than once (idempotency via the `Processed` checkbox).

### 6.3 Action (Real-World Consequence)
- FR10: On `Approved`, the system sends a confirmation email to the requester with event details.
- FR11: On `Rejected`, the system sends a rejection email to the requester including the coordinator's stated reason.
- FR12: If email sending fails, the system logs the error via a Run Log row with action `Error` and does **not** mark the request as processed, so it retries on the next poll cycle.

### 6.4 Audit (Run Log)
- FR13: Every state transition (`Created`, `Approved`, `Rejected`, `Error`) produces one Run Log row.
- FR14: Every Run Log row is written directly by the backend via the Notion API — never typed manually.
- FR15: Every Run Log row carries a real system timestamp (ISO 8601) captured at the moment the code executes.

### 6.5 AI Usage Policy
- FR16: AI extraction is invoked only when deterministic rules (checking whether structured fields are empty) determine the input is unstructured.
- FR17: AI output is constrained to a fixed JSON schema (event name, date, venue, one-line summary) and is validated before being written to Notion.
- FR18: AI-generated content is clearly separated in Notion (`AI Summary` field) from the student's original raw input (`Raw Details` field) — never silently overwriting it.

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Autonomy** | The system must run unattended once deployed — no manual script execution during a demo. |
| **Auditability** | Run Log entries must be attributable to the integration/service account, distinguishable from manually entered rows. |
| **Resilience** | Malformed or incomplete submissions must not crash the service or silently disappear; they should either be handled or surfaced as an error, never lost. |
| **Legibility** | The Notion workspace must be understandable by someone who has never seen the code. |
| **Cost** | Must run entirely on free tiers (Notion, hosting, LLM API) for the duration of the hackathon. |
| **Latency** | Coordinator decisions should be reflected in a real action within one polling cycle (≤ 2–5 minutes). |

---

## 8. System Architecture

```
Trigger (web form / POST /api/requests)
        │
        ▼
  Backend Service (Node.js / Express)
        │
        ├─▶ (if input is messy) Optional AI extraction
        │
        ▼
  Notion "Requests" DB  ──▶  Page created, Status = Pending
        │
        ▼
  Coordinator reviews & decides inside Notion
        │
        ▼
  Poller (cron, runs independently) detects decision
        │
        ├─▶ Real Action: email sent (Approved / Rejected)
        │
        └─▶ Run Log DB: row written (Action, Outcome, Timestamp, Actor)
```

**Components:**
- Backend service (Node.js / Express) — owns all logic; the only place decisions about *what happens* are made.
- Notion — two databases (`Requests`, `Run Log`) serving as database, control panel, and audit trail simultaneously.
- Optional LLM (Anthropic-compatible API) — invoked narrowly for free-text field extraction.
- SMTP provider — delivers the real external action (email).
- Host (Render / Railway free tier) — keeps the service running without a laptop.

---

## 9. Data Model

### 9.1 Notion — "Requests" database
| Property | Type | Notes |
|---|---|---|
| Name | Title | `{Event Name} — {Student Name}` |
| Student Name | Text | |
| Requester Email | Email | Used for the real action |
| Club / Dept | Text | |
| Event Name | Text | May be AI-filled |
| Event Date | Date | May be AI-filled |
| Venue | Text | May be AI-filled |
| Raw Details | Text | Original student input, never overwritten |
| AI Summary | Text | Populated only when AI extraction ran |
| Status | Select (Pending / Approved / Rejected) | The human gate |
| Rejection Reason | Text | Filled by coordinator on rejection |
| Processed | Checkbox | Poller idempotency flag |
| Request ID | Text | Correlates to Run Log rows |

### 9.2 Notion — "Run Log" database
| Property | Type | Notes |
|---|---|---|
| Name | Title | `{Request ID} — {Action}` |
| Request ID | Text | Correlates to originating request |
| Timestamp | Date (with time) | Written by code at execution time |
| Action | Select (Created / Approved / Rejected / Action Taken / Error) | |
| Outcome | Text | Human-readable description of what happened |
| Actor | Select (System / Coordinator) | Distinguishes automated vs. human-attributed events |

---

## 10. Success Metrics

| Metric | Target for demo |
|---|---|
| End-to-end cycle time (submit → decision → email + log) | Demonstrable within one polling cycle |
| Run Log rows with real, spread-out timestamps | ≥ 5, generated across multiple sessions, not one batch |
| AI calls made on clean structured input | 0 |
| AI calls made on messy free-text input | 1 per messy submission |
| Manual interventions required during demo | 0 |
| Notion workspace usable with backend off | Yes — verified by disabling the service and reviewing the workspace |

---

## 11. Milestones

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Pitch deck (7 slides, aligned to track brief) | ✅ Complete |
| 2 | Notion workspace setup (integration, both databases) | 🔄 In progress |
| 3 | Backend scaffold (intake endpoint, Notion client, email, AI, poller) | ✅ Complete (starter code delivered) |
| 4 | End-to-end local test (submit → approve → email + log) | ⬜ Pending |
| 5 | Deployment (Render/Railway) | ⬜ Pending |
| 6 | Demo rehearsal + Run Log natural accumulation across multiple days | ⬜ Pending |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Run Log rows look batch-generated at demo time | Submit and approve test requests across multiple separate sessions leading up to the event, not all at once |
| Coordinator forgets Notion is the only interface and asks for a separate dashboard | Reinforce in demo script: "there is no other tool — this is the tool" |
| AI step gets used even when unnecessary, undermining "load-bearing AI" claim | `looksMessy()` gate keeps AI calls conditional and auditable; log every AI invocation |
| Poller double-processes a request | `Processed` checkbox + not marking it on error until success, avoids double email/log |
| SMTP not configured before demo | Mock-mode logs the email content to console so the loop is still demoable without real SMTP |

---

## 13. Out of Scope for v1 (Future Work)

- Multi-level / multi-approver workflows
- Student-facing login and request history view
- PDF generation for approved permissions
- SMS notifications as an alternative to email
- Admin analytics dashboard (explicitly avoided — the brief warns against "a dashboard full of charts with no engine")
