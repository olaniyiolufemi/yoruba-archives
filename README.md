# Yoruba Archives

A community-driven web archive where independent researchers contribute Yoruba cultural research, designated reviewers verify it, and anyone can search what has been verified.

Built for the BSc Software Engineering capstone *"Digitization of Yoruba Culture Research through Archival Technology for Contributing and Verifying Research"*.

| | |
|---|---|
| **Walkthrough video** | [Watch the walkthrough video (Loom)](https://www.loom.com/share/e6d4de5ff6d34975917c54d9ff341f76) |
| **Technical report** | [Read the technical report (PDF, Google Drive)](https://drive.google.com/file/d/1-4zqFMl50wWB3sM03f_h2eyrwtDJyArp/view?usp=sharing) |
| **Repository** | [github.com/olaniyiolufemi/yoruba-archives](https://github.com/olaniyiolufemi/yoruba-archives) |
| **Technical requirements** | [Software, frameworks, services and hardware](TECHNICAL.md#technical-requirements) |
| **Repository structure** | [What each folder and file is for](TECHNICAL.md#repository-structure) |

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

## Installation

Check the [technical requirements](TECHNICAL.md#technical-requirements) first.

Most commands are the same on every system. Where they differ, there is a block for each one:

- **macOS:** use the Terminal app.
- **Linux:** use any terminal.
- **Windows:** use PowerShell, the default terminal in Windows 10 and 11. Command Prompt (`cmd`) alternatives are given where they differ.

### 0. Install the tools

You need Git, Node.js 22 or newer, and the Supabase CLI. Skip anything you already have; check with `git --version`, `node --version` and `supabase --version`.

**macOS** (with [Homebrew](https://brew.sh)):

```bash
brew install git node supabase/tap/supabase
```

**Linux** (Debian or Ubuntu; [nvm](https://github.com/nvm-sh/nvm) installs a current Node.js):

```bash
sudo apt update && sudo apt install -y git curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
source ~/.bashrc
nvm install 22
```

For the Supabase CLI, download the `.deb` for your processor (`linux_amd64` for most PCs, `linux_arm64` for ARM) from the [Supabase CLI releases page](https://github.com/supabase/cli/releases/latest), then install it from the folder you saved it in:

```bash
sudo apt install ./supabase_*_linux_amd64.deb
```

On Fedora or other distributions, use the `.rpm` or `.apk` file from the same page instead.

**Windows** (PowerShell; [Scoop](https://scoop.sh) installs the Supabase CLI):

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Close and reopen the terminal afterwards so the new commands are found.

### 1. Clone and install

Same on macOS, Linux and Windows:

```bash
git clone https://github.com/olaniyiolufemi/yoruba-archives.git
cd yoruba-archives
npm install
```

### 2. Create a Supabase project

1. Create a new, empty project at [supabase.com/dashboard](https://supabase.com/dashboard) and note the database password.
2. Open **Project Settings → API** and copy the **Project URL**, the **anon** key and the **service_role** key.

### 3. Add environment variables

Copy the template to `.env.local`.

**macOS and Linux:**

```bash
cp .env.example .env.local
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env.local
```

**Windows (Command Prompt):**

```cmd
copy .env.example .env.local
```

Open `.env.local` in any text editor (for example `open -e .env.local` on macOS, `nano .env.local` on Linux, `notepad .env.local` on Windows) and fill it in:

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

Same on macOS, Linux and Windows:

```bash
supabase link --project-ref <project-ref>   # asks for the database password
supabase db push                            # applies supabase/migrations/*
```

Then, in the Supabase dashboard, open **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** add `http://localhost:3000/auth/confirm`

### 5. Load sample data (optional)

Same on macOS, Linux and Windows:

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

Same on macOS, Linux and Windows:

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

**macOS and Linux:**

```bash
DEMO_MODE=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=preview SUPABASE_SERVICE_ROLE_KEY=preview npm run dev
```

**Windows (PowerShell):**

```powershell
$env:DEMO_MODE = "1"
$env:NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:9"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "preview"
$env:SUPABASE_SERVICE_ROLE_KEY = "preview"
npm run dev
```

**Windows (Command Prompt):**

```cmd
set DEMO_MODE=1
set NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9
set NEXT_PUBLIC_SUPABASE_ANON_KEY=preview
set SUPABASE_SERVICE_ROLE_KEY=preview
npm run dev
```

On Windows these settings last until you close the terminal. On any system, you can instead put the same four lines in `.env.local` and run `npm run dev`.

---

## Running the tests

Same on macOS, Linux and Windows:

```bash
npm test            # unit tests (Node.js built-in test runner)
npm run typecheck   # route type generation + TypeScript
npm run lint        # ESLint
npm run build       # production build
```

The same four checks run on every push and pull request through GitHub Actions (`.github/workflows/ci.yml`). Test results against the evaluation metrics are in the [technical report](https://drive.google.com/file/d/1-4zqFMl50wWB3sM03f_h2eyrwtDJyArp/view?usp=sharing).

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
