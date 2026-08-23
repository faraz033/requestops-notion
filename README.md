# RequestOps

> **Student Event Request Management System**

RequestOps is a lightweight, full-stack web application designed to streamline student event approval workflows in educational institutions. Built with Node.js, Express, Vanilla JavaScript, and integrated directly with the Notion API, RequestOps provides an end-to-end management workflow where Notion serves as both the backend database and administrative dashboard.

[![GitHub Repository](https://img.shields.io/badge/GitHub-requestops--notion-blue?logo=github)](https://github.com/faraz033/requestops-notion)
---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Purpose of RequestOps](#purpose-of-requestops)
- [How the System Works](#how-the-system-works)
- [Workflow Diagram](#workflow-diagram)
- [Main Features](#main-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Notion Database Setup](#notion-database-setup)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Example API Usage](#example-api-usage)
- [Current Implementation Status](#current-implementation-status)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Problem Statement

In educational institutions, managing student requests for organizing events, booking venues, and seeking approvals is often plagued by:
- **Manual & Paper-based Processes**: Physical forms lead to slow processing and lost records.
- **Lack of Visibility**: Students have no clear way to check the current approval status of their requests.
- **Administrative Friction**: Administrators lack a central database to review, approve, and track execution logs.
- **Missing Audit Trails**: Processing events and administrative actions lack automated timestamping and system logging.

---

## Purpose of RequestOps

RequestOps addresses these challenges by connecting a clean web submission frontend to Notion. It enables:
1. **Students** to submit event proposals through a web form and track status on-demand using a unique Request ID.
2. **Administrators** to review and approve event requests inside a Notion database.
3. **Automated Processor** background service that periodically (every 10 seconds) checks for approved requests, updates Notion records, and generates operational run logs.

---

## How the System Works

1. **Submission**: A student completes the event request form on the web frontend (`public/index.html`).
2. **Database Ingestion**: The Express server (`src/server.js`) validates inputs, generates a unique `Request ID` (e.g., `REQ-1787462392492`), and creates a page in the Notion **Requests Database** with `Status = Pending`.
3. **Admin Review**: An administrator inspects the request in Notion and manually changes `Status` from `Pending` to `Approved` (or `Rejected`).
4. **Automated Background Loop**: Every 10 seconds, a background timer (`setInterval`) calls `processApprovedRequests()`, querying Notion for requests where `Status = Approved` and `Processed At` is empty.
5. **Processing & Audit Logging**:
   - Creates a log entry in the Notion **Run Log Database** with `Status = Started`.
   - Executes processing logic (simulated in MVP).
   - Updates the request in Notion: sets `Processed At` timestamp and `Decision Reason`.
   - Creates a final entry in the Notion **Run Log Database** with `Status = Success` (or `Status = Failed`).
6. **Request Status Tracking**: Students can enter their `Request ID` into the "Track Your Request" section on the frontend to retrieve current request status and administrator feedback.

---

## Workflow Diagram

```
┌─────────────────┐       POST /api/requests       ┌─────────────────────┐
│  Student Web    │───────────────────────────────►│  Express Backend    │
│  Submission     │                                │  (src/server.js)    │
└─────────────────┘                                └──────────┬──────────┘
         ▲                                                    │
         │ GET /api/requests/:requestId                       │ Create Page
         │ (Status Tracking)                                  ▼
┌────────┴────────┐                                ┌─────────────────────┐
│  Student Track  │                                │ Notion Requests DB  │
│  Status Form    │                                │ (Status: Pending)   │
└─────────────────┘                                └──────────┬──────────┘
                                                              │
                                                              │ Admin Review
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ Notion Requests DB  │
                                                   │ (Status: Approved)  │
                                                   └──────────┬──────────┘
                                                              │
                                                              │ Polling Loop (10s)
                                                              ▼
┌─────────────────┐      Create Run Log & Update   ┌─────────────────────┐
│ Notion Run Log  │◄───────────────────────────────│ Background Processor│
│ Database        │      Processed At / Reason     │ (processApproved)   │
└─────────────────┘                                └─────────────────────┘
```

---

## Main Features

- 📝 **Event Request Submission**: Web form for students to submit student name, email, event title, date, venue, and description.
- 🔍 **Request Status Tracking**: On-demand status lookup using the unique Request ID.
- 📊 **Notion Admin Workflow**: Uses Notion databases for administration, status management, and data storage.
- 🔄 **Automated Polling Processor**: Background worker running every 10 seconds (`setInterval`) to process approved requests.
- 📜 **Audit Run Logging**: Maintains an operational execution history in a dedicated Notion **Run Log Database**.
- 🧪 **Manual Processing Endpoint**: `POST /api/process-approved` endpoint for manually triggering batch processing during testing.

---

## System Architecture

```
┌─────────────────────────┐
│     Web Frontend        │
│  (HTML / CSS / JS)      │
└───────────┬─────────────┘
            │
            │ HTTP (REST API)
            ▼
┌─────────────────────────┐          ┌────────────────────────────────┐
│   Node.js / Express     │          │         Notion Workspace       │
│     Backend Server      │─────────►│ ┌────────────────────────────┐ │
│                         │  Notion  │ │     Requests Database      │ │
│  • REST Endpoints       │   API    │ └────────────────────────────┘ │
│  • 10s Polling Loop     │          │ ┌────────────────────────────┐ │
│  • Processing Logic     │─────────►│ │    Run Log Database        │ │
└─────────────────────────┘          │ └────────────────────────────┘ │
                                     └────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Web interface for submission & tracking |
| **Backend** | Node.js, Express.js | REST API server & background polling loop |
| **Database Integration** | Notion API (`@notionhq/client`) | Database storage & execution run logging |
| **Environment Config** | `dotenv` | Secret management for tokens and database IDs |
| **Development** | `nodemon` | Auto-restarting development server |
| **Middleware** | `cors` | Cross-Origin Resource Sharing middleware |

---

## Project Structure

```
RequestOps/
├── public/
│   ├── index.html       # Web interface structure (Submission & Tracking forms)
│   ├── style.css        # Frontend styling
│   └── app.js           # Frontend JavaScript (API calls & DOM handling)
├── src/
│   ├── server.js        # Express server, routes, and background polling loop
│   └── notion.js        # Notion Client wrapper & database query helper functions
├── .env                 # Local environment configuration (ignored by git)
├── .gitignore           # Git ignore rules (node_modules, .env)
├── package.json         # Dependencies and npm scripts
└── package-lock.json    # Dependency lockfile
```

---

## API Endpoints

### 1. Health Check
- **Endpoint**: `GET /`
- **Description**: Verifies backend server availability.
- **Response (200 OK)**:
  ```json
  {
    "message": "RequestOps backend is running"
  }
  ```

### 2. Submit Event Request
- **Endpoint**: `POST /api/requests`
- **Description**: Creates a new event request entry in the Notion Requests Database.
- **Request Body**:
  ```json
  {
    "studentName": "John Doe",
    "email": "john@example.com",
    "eventName": "Annual Tech Symposium",
    "eventDate": "2026-09-15",
    "venue": "Main Auditorium",
    "description": "A 1-day technology conference and project showcase."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Request created successfully",
    "requestId": "REQ-1787462392492",
    "notionPageId": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d"
  }
  ```
- **Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "All fields are required"
  }
  ```

### 3. Get Request Status by ID
- **Endpoint**: `GET /api/requests/:requestId`
- **Description**: Retrieves request status and details by Request ID.
- **URL Parameter**: `requestId` (e.g. `REQ-1787462392492`)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "requestId": "REQ-1787462392492",
      "studentName": "John Doe",
      "email": "john@example.com",
      "eventName": "Annual Tech Symposium",
      "eventDate": "2026-09-15",
      "venue": "Main Auditorium",
      "description": "A 1-day technology conference and project showcase.",
      "status": "Approved",
      "decisionReason": "Request approved and processed successfully.",
      "createdAt": "2026-08-23T12:00:00.000Z",
      "processedAt": "2026-08-23T12:05:10.123Z"
    }
  }
  ```
- **Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "message": "Request not found"
  }
  ```

### 4. Process Approved Requests (Manual Trigger)
- **Endpoint**: `POST /api/process-approved`
- **Description**: Manually triggers batch processing of approved requests.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Approved requests processed",
    "processedCount": 1
  }
  ```

---

## Notion Database Setup

RequestOps relies on two Notion databases connected via an Internal Integration token.

### 1. Requests Database
Stores student requests and administrative decisions.

| Property Name | Property Type | Description |
|---|---|---|
| `Request ID` | Title | Generated Request ID (`REQ-<timestamp>`) |
| `Student Name` | Rich Text | Full name of applicant |
| `Email` | Email | Contact email |
| `Event Name` | Rich Text | Event title |
| `Event Date` | Date | Scheduled date |
| `Venue` | Rich Text | Requested venue |
| `Description` | Rich Text | Details about event |
| `Status` | Select | Options: `Pending`, `Approved`, `Rejected` |
| `Processed At` | Date | Set when processing completes |
| `Decision Reason` | Rich Text | Admin notes/feedback |

### 2. Run Log Database
Stores execution logs created by the processor loop.

| Property Name | Property Type | Description |
|---|---|---|
| `Run ID` | Title | Generated log ID (`RUN-<timestamp>`) |
| `Request ID` | Rich Text | Target Request ID |
| `Status` | Select | Options: `Started`, `Success`, `Failed` |
| `Timestamp` | Date | Timestamp of execution |
| `Outcome` | Rich Text | Log message |
| `Error` | Rich Text | Error message (if applicable) |

---

## Environment Variables

Create a `.env` file in the project root. The `.env` file contains sensitive API credentials and is strictly excluded from version control via `.gitignore`.

```env
NOTION_TOKEN=your_notion_integration_token
REQUESTS_DATABASE_ID=your_requests_database_id
RUN_LOG_DATABASE_ID=your_run_log_database_id
PORT=3000
```

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- A Notion account with an active Integration Token and shared access to the two databases.

### Setup Instructions (Windows)

1. **Clone the Repository**:
   ```cmd
   git clone https://github.com/faraz033/requestops-notion.git
   cd requestops-notion
   ```

2. **Install Dependencies**:
   ```cmd
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```cmd
   type nul > .env
   ```
   Populate `.env` with your Notion credentials as shown in [Environment Variables](#environment-variables).

4. **Connect Notion Integration**:
   In Notion, open both databases and invite your Integration via *Add connections*.

---

## Running the Project

### Development Mode (via `nodemon`)
```cmd
npm run dev
```

### Production Mode
```cmd
npm start
```

Access the frontend in your browser at:
`http://localhost:3000`

---

## Example API Usage

### Submit Request (PowerShell / cURL)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/requests" -Method Post -ContentType "application/json" -Body '{
  "studentName": "Alice Smith",
  "email": "alice@university.edu",
  "eventName": "AI Workshop",
  "eventDate": "2026-10-10",
  "venue": "Lab 3",
  "description": "Hands-on workshop."
}'
```

### Track Request (PowerShell / cURL)
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/requests/REQ-1787462392492" -Method Get
```

---

## Current Implementation Status

RequestOps is a **working MVP (Minimum Viable Product)** featuring:
- [x] REST API for submitting requests and querying request status by ID.
- [x] Web frontend for submission and request status tracking.
- [x] Integration with Notion API using `@notionhq/client`.
- [x] Background polling loop (`10s` interval) to process approved requests.
- [x] Run logging database in Notion for audit history.
- [x] Simulated post-approval processing execution logic.

---

## Known Limitations

- **Simulated Business Action**: Processing after approval is simulated in backend code (`src/server.js`) and does not connect to external physical booking or ticketing infrastructure.
- **Fixed Polling**: Background processor runs on a 10-second timer loop (`setInterval`) instead of real-time Notion webhooks.
- **No User Authentication**: Frontend endpoints operate without login/authentication controls.

---

## Future Improvements

- 🔒 **Student & Admin Authentication**: User login and role-based access control (RBAC).
- 📧 **Notification Integration**: Automated Email and SMS notifications on request status updates.
- 🤖 **AI Conflict Resolution**: Automated venue and schedule conflict checking using AI models.
- 📅 **Calendar Synchronization**: Automated event creation in Google Calendar or Outlook Calendar.
- 📈 **Analytics Dashboard**: Graphical insights into event volume, venue utilization, and approval metrics.