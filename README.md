# Yoruba Archives 

> A peer-reviewed digital repository for Yoruba cultural research — preserving oral traditions, art, linguistics, philosophy, and historical scholarship for future generations.

**GitHub Repository:** https://github.com/olaniyiolufemi/yoruba-archives

---

## Description

Yoruba Archives is a fullstack web application that serves as a centralized, verified digital archive for Yoruba cultural and academic research. It connects researchers, reviewers, and the public around a curated body of scholarship across six thematic categories:

**Key Features:**
- Public browsable archive with full-text search and category filters
- Researcher account registration and file upload (PDF, image, audio, video)
- Peer-review workflow (Reviewer/Admin decision: verify, revise, reject)
- Shareable links for individual submissions
- Research Needs board with community upvoting
- Aggregated external sources (AODL, AJOL, Internet Archive, British Museum)
- Admin dashboard: stats, review queue, user management, source tracking
- JWT-based authentication (custom, no external dependency)
- In-app notification system

---

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Vanilla HTML/CSS/JavaScript (SPA) |
| Backend  | Node.js + Express |
| Database | SQLite via better-sqlite3 |
| Auth     | Custom HMAC-SHA256 JWT (no jsonwebtoken library) |
| File Upload | Multer |
| Fonts | Google Fonts — Outfit + Cormorant Garamond |

---

## Environment Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
git clone https://github.com/olaniyiolufemi/yoruba-archives.git
cd yoruba-archives
npm install
```

### Seed the Database

```bash
npm run seed
```

This populates the database with:
- 5 users (admin, reviewer, 2 researchers, 1 public)
- 6 categories
- 6 research submissions (4 contributed, 2 aggregated)
- 3 peer reviews
- 3 research requests
- 4 external sources
- 2 notifications

### Generate Sample PDF Files

```bash
node server/generate_sample_files.js
```

### Start the Server

```bash
npm run dev
```

The app runs at **http://localhost:3001**

---

## Default Test Accounts

| Role       | Email                         | Password   |
|------------|-------------------------------|------------|
| Admin      | olufemi.o@alustudent.com      | admin123   |
| Reviewer   | wabimbola@oauife.edu.ng       | pass123    |
| Researcher | blawal@unilag.edu.ng          | pass123    |
| Researcher | sadeleke@ui.edu.ng            | pass123    |
| Public     | kbalogun@gmail.com            | pass123    |

---

## Project Structure

```
yoruba-archives/
├── client/
│   ├── index.html        # SPA shell — all pages, modals
│   ├── style.css         # Complete design system (dark, gold/terracotta palette)
│   └── app.js            # All frontend logic — routing, API calls, state
├── server/
│   ├── index.js          # Express app entry point
│   ├── db.js             # SQLite connector (auto-runs schema)
│   ├── schema.sql        # Full DB schema — 7 tables with indexes
│   ├── seed.js           # Seed data with authentic Yoruba research content
│   ├── generate_sample_files.js
│   ├── middleware/
│   │   └── auth.js       # JWT sign/verify + requireAuth/requireRole
│   ├── routes/
│   │   ├── auth.js       # POST /api/auth/login, /register
│   │   ├── submissions.js # CRUD + file upload + review endpoint
│   │   ├── requests.js   # Research needs + voting
│   │   ├── notifications.js
│   │   └── admin.js      # Stats, users, pending queue, sources
│   └── uploads/          # Uploaded files (gitignored)
├── package.json
├── .gitignore
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login, returns JWT |
| GET | /api/submissions | Optional | List/search submissions |
| GET | /api/submissions/categories | — | All categories |
| GET | /api/submissions/:id | — | Single submission |
| GET | /api/submissions/share/:link | — | By shareable link |
| POST | /api/submissions | Auth | Submit research + file |
| PATCH | /api/submissions/:id/review | Reviewer/Admin | Peer review decision |
| DELETE | /api/submissions/:id | Admin | Delete |
| GET | /api/requests | — | List research requests |
| POST | /api/requests | Auth | Create request |
| POST | /api/requests/:id/vote | Auth | Toggle vote |
| PATCH | /api/requests/:id/status | Reviewer/Admin | Update status |
| GET | /api/notifications | Auth | User notifications |
| PATCH | /api/notifications/:id/read | Auth | Mark read |
| PATCH | /api/notifications/mark-all-read | Auth | Mark all read |
| GET | /api/admin/stats | Admin | Dashboard statistics |
| GET | /api/admin/users | Admin | All users |
| PATCH | /api/admin/users/:id/role | Admin | Change user role |
| GET | /api/admin/pending | Admin/Reviewer | Review queue |
| GET | /api/admin/external-sources | Admin | External sources |

---

## Database Schema

```
users ──────────────────────────────────────┐
  user_id, name, email, password_hash,       │
  role (researcher/public/reviewer/admin),   │
  institution, created_at                    │
                                             │
research_submissions ─────────────────────── ┤
  submission_id (TEXT PK), user_id, title,   │
  abstract, category_id, file_url,           │
  source_type (contributed/aggregated),       │
  status (pending/verified/rejected/         │
          revision_requested),              │
  shareable_link UNIQUE, created_at          │
                                             │
peer_reviews ────────────────────────────────┤
  review_id, submission_id, reviewer_id,     │
  decision, comments, reviewed_at            │
                                             │
categories ─────────────────────────────────┤
  category_id, category_name UNIQUE         │
                                             │
research_requests ──────────────────────────┤
  request_id, user_id, topic, description,  │
  vote_count, status, created_at            │
                                             │
votes ──────────────────────────────────────┤
  vote_id, request_id, user_id             │
  UNIQUE(request_id, user_id)              │
                                             │
notifications ──────────────────────────────┘
  notification_id, user_id, title, message,
  submission_id, is_read, created_at
```

---

## Designs

### UI Overview

The interface uses a rich dark design system inspired by Yoruba visual heritage:

- **Color palette:** Deep charcoal background (#0b0a0f), gold (#d4a843), terracotta (#c4623a), jade (#3a9c8e)
- **Typography:** Cormorant Garamond (headings, culturally resonant serif) + Outfit (UI sans-serif)
- **Motifs:** Adinkra-pattern dividers, radial gold gradients, glassmorphism nav
- **Interactions:** Card hover lift, smooth modal animations, skeleton loading states, toast notifications

### Pages

1. **Home** — Hero with live stats, featured research strip, category tiles, top research requests
2. **Archive** — Searchable, filterable grid with pagination (category, source type, full-text)
3. **Detail** — Full abstract, file download, shareable link copy, reviewer action panel
4. **Research Needs** — Upvotable community requests board with status filters
5. **Admin Dashboard** — Stats overview, bar charts, review queue, user role management, external sources
6. **My Submissions** — Researcher's personal submission history

---

## Deployment Plan

### Local (Current)
```
Express server serves both API (/api/*) and static frontend (client/)
SQLite file database — no external DB dependency
```

### Production Target — Railway / Render

1. Push to GitHub (repo already initialized)
2. Connect Railway or Render to the GitHub repo
3. Set environment variables:
   - `PORT=3001`
   - `JWT_SECRET=<your-secret>`
   - `DB_PATH=/data/data.db` (persistent volume)
4. Add build command: `npm install && npm run seed`
5. Start command: `npm start`
6. Attach persistent disk for `/data` and `/server/uploads`

### Alternative — Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run seed
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t yoruba-archives .
docker run -p 3001:3001 yoruba-archives
```

---

## Video Demo Notes

Cover these flows in the demo:
1. Home page — hero, stats, featured research
2. Browse archive — search, category filter, source filter
3. View a research detail with shareable link copy
4. Register as a researcher → submit research with file
5. Login as reviewer → navigate to admin review queue → make decision
6. Research Needs board — browse, vote, submit new request
7. Admin dashboard — stats, user role management, external sources

---

*Built by Olaniyi Olufemi — African Leadership University Capstone 2026*
