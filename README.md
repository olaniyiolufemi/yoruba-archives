# Yoruba Archives

A community-driven, full-stack web archive where independent researchers contribute Yoruba cultural research, designated reviewers verify it, and anyone can search what has been verified.

Built for the BSc Software Engineering capstone *"Digitization of Yoruba Culture Research through Archival Technology for Contributing and Verifying Research"*.

---

## What it does

| Who | Can |
|---|---|
| **Public user** | Search and filter verified research, open its permanent link, view or download the file, report a problem (signed in) |
| **Researcher** | Register, submit research (title, abstract, category, keywords, PDF/JPEG) in Yorùbá, English or both, track status, read reviewer comments, revise and resubmit |
| **Reviewer** | See only the submissions assigned to them, examine the file, complete the four-point checklist, then approve, reject or return for revision with comments |
| **Administrator** | Manage users and reviewer roles, (re)assign reviewers, manage categories, resolve flagged content, delete submissions |

### Requirements traceability (Chapter 4)

| Req. | Where it is implemented |
|---|---|
| **FR1** Upload title, abstract, category, keywords, PDF/JPEG | `src/components/SubmissionForm.tsx`, `POST /api/submissions`, storage bucket limited to `application/pdf` and `image/jpeg` |
| **FR2** Yorùbá, English or both | `language` field (`yoruba` / `english` / `both`); search ignores tone marks, so `orisa` finds `òrìṣà` |
| **FR3** Every submission goes to a designated reviewer first | `pick_reviewer()` assigns the reviewer with the fewest pending items (never the author); RLS keeps unverified items private |
| **FR4** Approve, reject or return with comments | `/review/[id]`, `POST /api/submissions/[id]/review`, `record_review()`. Approval requires all four checklist items; rejection or revision requires comments |
| **FR5** Email + dashboard notification on status change | `src/lib/notify.ts` writes a notification and emails via Resend (logged to the console when no key is set) |
| **FR6** Unique, public, shareable link once verified | `/research/[link]`, issued at approval and kept permanently, with a "Verified (date), reviewed by" label |
| **FR7** Search and filter by keyword, category, language, date | `/search` and `GET /api/search` → `search_research()` (verified content only) |
| **FR8** Admin: users, reviewers, categories, flagged content | `/admin/*` and `/api/admin/*` |
| **NFR1** Easy without training | Plain forms, inline hints, one primary action per page |
| **NFR2** Search < 3 s | Trigram-indexed search (`pg_trgm`); `/api/search` returns a `Server-Timing` header for load tests |
| **NFR4** Access-controlled storage | Private bucket, Postgres RLS on every table, 5-minute signed URLs from `/api/files/[id]`, passwords handled by Supabase Auth |
| **NFR5** Scalable search & storage | Managed Postgres + object storage; files upload straight from the browser to storage |
| **NFR6** Responsive | Tailwind, mobile-first layouts |

---

## Tech stack (Section 4.5)

| Tier (Figure 4.2) | Technology |
|---|---|
| Presentation | Next.js 16 (App Router, React 19) + Tailwind CSS 4 |
| Application | Next.js Route Handlers on Node.js (`src/app/api/*`): auth checks, review workflow, notifications, search |
| Data | Supabase: Postgres (schema, RLS, SQL functions), Auth, Storage |
| Email | Resend (optional) |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) + Vercel |

The database schema follows the ERD in Figure 4.3: `profiles` (USER), `categories`, `research_submissions`, `peer_reviews`, plus `notifications` and `content_flags`. See `supabase/migrations/`.

---

## Setup

### 1. Prerequisites
- Node.js 22 or newer
- A Supabase project (the free tier is enough)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for applying the migration

### 2. Install
```bash
npm install
cp .env.example .env.local   # then fill in the values
```

### 3. Create the database
```bash
supabase link --project-ref <your-project-ref>
supabase db push            # applies supabase/migrations/*
```

In the Supabase dashboard, open **Authentication → URL Configuration**. Set **Site URL** to your app URL and add `<your-app-url>/auth/confirm` to the redirect URLs.

### 4. Seed demo data (optional)
```bash
SEED_PASSWORD='choose-a-password' npm run seed           # first run
SEED_PASSWORD='choose-a-password' npm run seed -- --reset # wipe and reseed
```
This creates 6 demo accounts (`admin@`, `reviewer1@`, `reviewer2@`, `researcher1@`, `researcher2@`, `public@yoruba-archives.test`), 7 categories, and 13 sample items covering every state: verified, pending, revision requested and rejected.

### 5. Run
```bash
npm run dev      # http://localhost:3000
```

### Promote the first administrator
Self-registration only offers *researcher* or *public*. To create your first admin, run this in the Supabase SQL editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
After that, admins assign reviewer and admin roles from **Admin → Users & reviewers**.

---

## Testing

```bash
npm test          # unit tests for validation, search filters, slugs, review rules
npm run typecheck
npm run lint
npm run build
```

---

## Deployment (Vercel)

1. Import the GitHub repository into Vercel.
2. Add the environment variables from `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` is server-only.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL and add `<url>/auth/confirm` to Supabase's redirect URLs.
4. Every push to `main` runs CI and deploys.

---

## Project structure

```
src/
  app/
    page.tsx                    Home: search box, categories, recently verified
    search/                     FR7 search & filters
    research/[link]/            FR6 permanent public page
    login/ register/ auth/      Supabase Auth
    dashboard/                  Researcher: submissions, submit, edit & resubmit
    review/                     Reviewer queue and review form
    notifications/              Dashboard notifications
    admin/                      Users, reviewers, categories, submissions, flags
    api/                        Application layer (route handlers)
  components/                   UI components
  lib/                          Supabase clients, auth, validation, notifications, email
  proxy.ts                      Session refresh + sign-in redirect
supabase/migrations/            Schema, RLS, storage bucket, SQL functions
scripts/seed.mts                Demo data
```

---

## Changes from v1

v1 was a vanilla HTML/JS single-page app on Express + SQLite. v2 follows the final design document:

- Rebuilt on **Next.js + Tailwind + Supabase** (Postgres, Auth, Storage).
- Added **keywords**, **language** (Yorùbá / English / both) and **PDF/JPEG-only** uploads.
- Every submission is **assigned to a designated reviewer**. Reviewers complete a **four-point checklist**.
- Researchers can **edit, then revise and resubmit**. The status history and comments stay visible.
- **Email notifications** sit alongside the dashboard notifications.
- **Search filters** by language and date, and the search ignores Yorùbá diacritics.
- Admin can manage **categories** and **flagged content**, and **reassign reviewers**.
- Files are **private** and served by short-lived signed URLs. Passwords are handled by Supabase Auth (v1 used unsalted SHA-256).
- **Removed** the aggregated external sources (Section 3.4: search covers only content held on the platform) and the Research Needs voting board.

---

*Built by Olaniyi Olufemi. Supervisor: Simeon Nsabiyumva.*
