# Yoruba Archives: technical details

[← Back to the README](README.md)

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

## Repository structure

```
yoruba-archives/
├── .github/
│   ├── workflows/ci.yml          CI: supply chain checks, lint, typecheck, test, build, SBOM
│   └── dependabot.yml            Weekly dependency and GitHub Actions updates
├── public/
│   ├── logo.svg, icon.svg        Brand logo and browser icon
│   └── art/                      Line engravings (Ọpọ́n Ifá, Ife head, adé, dùndún)
├── scripts/
│   ├── seed.mts                  Sample accounts, categories and research
│   └── generate-art.mts          Generates the engravings in public/art
├── supabase/
│   ├── config.toml               Supabase CLI settings
│   └── migrations/               Schema, row-level security, storage, SQL functions, security log
├── src/
│   ├── app/
│   │   ├── page.tsx              Landing page
│   │   ├── error.tsx             Generic error page (global-error.tsx for the root layout)
│   │   ├── search/               Search and filters (FR7)
│   │   ├── research/[link]/      Permanent public page for verified work (FR6)
│   │   ├── login/, register/     Sign-in, two-step sign-in (login/mfa) and sign-up
│   │   ├── forgot-password/,
│   │   │   reset-password/       Password reset by email link
│   │   ├── account/security/     Turn two-step sign-in on or off
│   │   ├── auth/confirm/         Email confirmation and reset link callback
│   │   ├── dashboard/            Researcher: submissions, submit, edit, resubmit
│   │   ├── review/               Reviewer queue and review form (FR4)
│   │   ├── notifications/        Dashboard notifications (FR5)
│   │   ├── admin/                Users, reviewers, categories, submissions, reports, security log (FR8)
│   │   └── api/                  Application layer (route handlers)
│   ├── components/               Shared UI components, including the site header and footer
│   ├── lib/
│   │   ├── supabase/             Browser, server, admin and proxy clients
│   │   ├── auth.ts, api.ts       Sign-in, role and two-step checks; rate limits
│   │   ├── audit.ts              Security event log and admin alerts
│   │   ├── validation.ts         Input rules shared by the API and tests
│   │   ├── validation.test.ts    Unit and edge-case tests
│   │   ├── storage.ts            Checks uploaded files are real PDFs or JPEGs
│   │   ├── search.ts, queries.ts Data access
│   │   ├── notify.ts, email.ts   Notifications and email
│   │   └── demo-*.ts             Preview mode without Supabase
│   └── proxy.ts                  Session refresh, idle timeout and sign-in redirects
├── .env.example                  Environment variable template
├── .npmrc                        Disables package install scripts
├── next.config.ts                Next.js config and security headers
├── SECURITY.md                   Abuse cases, security controls and hosted settings
├── package.json
└── tsconfig.json
```
