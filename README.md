# Yoruba Archives

A community-driven web archive where independent researchers contribute Yoruba cultural research, designated reviewers verify it, and anyone can search what has been verified.

Built for the BSc Software Engineering capstone *"Digitization of Yoruba Culture Research through Archival Technology for Contributing and Verifying Research"*.

| | |
|---|---|
| **Walkthrough video** | *Link coming soon* |
| **Technical report** | [Read the technical report (PDF, Google Drive)](https://drive.google.com/file/d/1-4zqFMl50wWB3sM03f_h2eyrwtDJyArp/view?usp=sharing) |
| **Repository** | [github.com/olaniyiolufemi/yoruba-archives](https://github.com/olaniyiolufemi/yoruba-archives) |

---

## Contents

1. [Project overview](#project-overview)
2. [Technical requirements](#technical-requirements)
3. [Installation](#installation)
4. [Running the tests](#running-the-tests)
5. [Repository structure](#repository-structure)
6. [Requirements traceability](#requirements-traceability)
7. [Deployment](#deployment)

---

## Project overview

Yoruba research is scattered across university repositories, private collections and social media, and very little of it is checked. Yoruba Archives gives that work one open, reviewed home.

### Who uses it

| Role | What they can do |
|---|---|
| **Public user** | Search and filter verified research, open its permanent link, read or download the file, report a problem (when signed in) |
| **Researcher** | Register, submit research (title, abstract, category, keywords, PDF or JPEG) in Yorùbá, English or both, track its status, read reviewer comments, revise and resubmit |
| **Reviewer** | See only the submissions assigned to them, read the file, complete the four-point checklist, then approve, reject or return for revision with comments |
| **Administrator** | Manage users and reviewer roles, reassign reviewers, manage categories, resolve reported content, remove submissions |

### How a submission moves through the system

1. A researcher uploads their work. The file goes to private storage.
2. The system assigns the reviewer with the fewest pending items (never the author).
3. The reviewer checks **authorship**, **sources**, **cultural relevance** and **cultural sensitivity**.
4. The reviewer approves, rejects, or returns the work with comments. The researcher gets an email and a dashboard notification.
5. Approved work gets a permanent public page with a "Verified" label, the reviewer's name, and the file shown inline.

### Key features

- Search that ignores Yorùbá tone marks, so `orisa` finds `òrìṣà`, with filters for category, language and date.
- Row-level security in Postgres on every table. Unverified work is visible only to its author, its reviewer and admins.
- Files kept in a private bucket and served through signed links that expire after five minutes.
- Responsive layout for phones and desktops.

---

## Technical requirements

### Software

| Tool | Version used | Notes |
|---|---|---|
| Node.js | 22 or newer (CI uses 24, developed on 25.8) | Required to install, run and test |
| npm | 10 or newer (developed on 11.11) | Comes with Node.js |
| Supabase CLI | 2.75 or newer | Applies the database migration |
| Git | Any recent version | To clone the repository |
| Web browser | Any current Chrome, Firefox, Safari or Edge | Mobile browsers are supported |

### Frameworks and SDKs

| Package | Version | Purpose |
|---|---|---|
| Next.js | 16.4.3 | App Router, server rendering and API route handlers |
| React | 19.3.0 | User interface |
| Tailwind CSS | 4.3.3 | Styling |
| TypeScript | 5.9.3 | Type-checked code |
| @supabase/supabase-js | 2.118.0 | Database, auth and storage client |
| @supabase/ssr | 0.12.7 | Cookie-based Supabase sessions in Next.js |
| ESLint | 9.39.5 | Linting with the Next.js rule set |

### Services

| Service | Needed for | Plan |
|---|---|---|
| [Supabase](https://supabase.com) | Postgres database, authentication, file storage | Free tier is enough |
| [Resend](https://resend.com) | Notification emails | Optional; without a key, emails are printed to the server log |
| [Vercel](https://vercel.com) | Hosting | Optional; free tier is enough |

### Hardware

Any machine that runs Node.js 22 will work. A minimum of 4 GB RAM and 1 GB of free disk space is recommended for installing dependencies and running the development server. An internet connection is needed to reach Supabase.

---

## Installation

### 1. Clone and install

```bash
git clone https://github.com/olaniyiolufemi/yoruba-archives.git
cd yoruba-archives
npm install
```

### 2. Create a Supabase project

1. Create a new, empty project at [supabase.com/dashboard](https://supabase.com/dashboard) and note the database password.
2. Open **Project Settings → API** and copy the **Project URL**, the **anon** key and the **service_role** key.

### 3. Add environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SEED_PASSWORD=<password for the demo accounts, 8+ characters>
RESEND_API_KEY=            # optional
EMAIL_FROM=                # optional, e.g. "Yoruba Archives <noreply@yourdomain>"
```

`SUPABASE_SERVICE_ROLE_KEY` is used only on the server. Never commit `.env.local`.

### 4. Create the database

```bash
supabase link --project-ref <project-ref>   # asks for the database password
supabase db push                            # applies supabase/migrations/*
```

Then, in the Supabase dashboard, open **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/confirm`

### 5. Load sample data (optional)

```bash
npm run seed              # first run
npm run seed -- --reset   # wipe and reseed
```

This creates 7 categories, 13 research items in every state (verified, pending, revision requested, rejected), and these accounts, all using `SEED_PASSWORD`:

| Role | Email |
|---|---|
| Admin | admin@yoruba-archives.test |
| Reviewer | reviewer1@yoruba-archives.test |
| Reviewer | reviewer2@yoruba-archives.test |
| Researcher | researcher1@yoruba-archives.test |
| Researcher | researcher2@yoruba-archives.test |
| Public user | public@yoruba-archives.test |

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Making your own account an admin

Sign-up only offers the researcher and public roles. To promote an account, run this in the Supabase **SQL Editor**:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Admins can then assign reviewer and admin roles from **Admin → Users**.

### Preview without Supabase

To look around without a database, set `DEMO_MODE=1` with placeholder Supabase values. The site then uses built-in sample research and stores demo accounts on the local machine only.

```bash
DEMO_MODE=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=preview SUPABASE_SERVICE_ROLE_KEY=preview npm run dev
```

---

## Running the tests

```bash
npm test            # unit tests (Node.js built-in test runner)
npm run typecheck   # route type generation + TypeScript
npm run lint        # ESLint
npm run build       # production build
```

The same four checks run on every push and pull request through GitHub Actions (`.github/workflows/ci.yml`). Test results against the evaluation metrics are in the [technical report](https://drive.google.com/file/d/1-4zqFMl50wWB3sM03f_h2eyrwtDJyArp/view?usp=sharing).

---

## Repository structure

```
yoruba-archives/
├── .github/workflows/ci.yml      CI: lint, typecheck, test, build
├── public/
│   ├── logo.svg, icon.svg        Brand logo and browser icon
│   └── art/                      Line engravings (Ọpọ́n Ifá, Ife head, adé, dùndún)
├── scripts/
│   ├── seed.mts                  Sample accounts, categories and research
│   └── generate-art.mts          Generates the engravings in public/art
├── supabase/
│   ├── config.toml               Supabase CLI settings
│   └── migrations/               Schema, row-level security, storage, SQL functions
├── src/
│   ├── app/
│   │   ├── page.tsx              Landing page
│   │   ├── search/               Search and filters (FR7)
│   │   ├── research/[link]/      Permanent public page for verified work (FR6)
│   │   ├── login/, register/     Sign-in and sign-up
│   │   ├── auth/confirm/         Email confirmation callback
│   │   ├── dashboard/            Researcher: submissions, submit, edit, resubmit
│   │   ├── review/               Reviewer queue and review form (FR4)
│   │   ├── notifications/        Dashboard notifications (FR5)
│   │   ├── admin/                Users, reviewers, categories, submissions, reports (FR8)
│   │   └── api/                  Application layer (route handlers)
│   ├── components/               Shared UI components
│   ├── lib/
│   │   ├── supabase/             Browser, server, admin and proxy clients
│   │   ├── validation.ts         Input rules shared by the API and tests
│   │   ├── validation.test.ts    Unit tests
│   │   ├── search.ts, queries.ts Data access
│   │   ├── notify.ts, email.ts   Notifications and email
│   │   └── demo-*.ts             Preview mode without Supabase
│   └── proxy.ts                  Session refresh and sign-in redirects
├── .env.example                  Environment variable template
├── next.config.ts                Next.js config and security headers
├── package.json
└── tsconfig.json
```

---

## Requirements traceability

| Req. | Where it is implemented |
|---|---|
| **FR1** Upload title, abstract, category, keywords, PDF/JPEG | `src/components/SubmissionForm.tsx`, `POST /api/submissions`, storage bucket limited to PDF and JPEG |
| **FR2** Yorùbá, English or both | `language` field; search ignores tone marks |
| **FR3** Designated reviewer before publication | `pick_reviewer()` balances load and skips the author; row-level security keeps unverified work private |
| **FR4** Approve, reject or return with comments | `/review/[id]`, `POST /api/submissions/[id]/review`, `record_review()` |
| **FR5** Email and dashboard notification | `src/lib/notify.ts`, `src/lib/email.ts`, `/notifications` |
| **FR6** Unique, public, shareable link | `/research/[link]`, issued on approval, with inline file viewer |
| **FR7** Search by keyword, category, language, date | `/search`, `GET /api/search`, `search_research()` |
| **FR8** Admin management | `/admin/*`, `/api/admin/*` |
| **NFR1** Easy without training | Plain forms, inline hints, one main action per page |
| **NFR2** Search under 3 seconds | Trigram index; `Server-Timing` header on `/api/search` |
| **NFR4** Access-controlled storage | Private bucket, row-level security, signed links, Supabase Auth |
| **NFR5** Scalable search and storage | Managed Postgres and object storage; direct browser uploads |
| **NFR6** Responsive | Mobile-first Tailwind layouts |

---

## Deployment

1. Import the repository into [Vercel](https://vercel.com/new).
2. Add the variables from `.env.example` in the Vercel project settings.
3. Set `NEXT_PUBLIC_SITE_URL` to the production URL.
4. In Supabase, add the production URL as the Site URL and `<production-url>/auth/confirm` as a redirect URL.

---

*Olaniyi Olufemi · Supervisor: Simeon Nsabiyumva*
