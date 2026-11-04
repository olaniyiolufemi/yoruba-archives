# Security

## Abuse cases

How each key feature could be misused, and what stops it.

| Feature | Abuse case | Control |
|---|---|---|
| Sign-up | Register with someone else's email | Email confirmation is required before the first sign-in. |
| Sign-up | Give yourself the reviewer or admin role | The profile trigger only accepts `researcher` or `public`; other roles are granted by an admin. |
| Sign-up | Oversized name or institution | Capped at 120 / 200 characters by the trigger and table constraints. |
| Sign-in | Guess passwords | Supabase Auth limits sign-in and sign-up to 30 requests per 5 minutes per IP. New passwords need 10+ characters with letters and numbers. |
| Sign-in | Use a stolen or leaked password | Anyone can turn on two-step sign-in with an authenticator app (`/account/security`). Until the code is entered, the app treats them as signed out and RLS hides their data. |
| Sessions | Use a device someone left signed in | Sessions end after 2 hours without activity. Signing out revokes every session for the account. |
| Password reset | Take over an account by resetting its password | The reset link goes only to the account's inbox, works once and expires within an hour. The form gives the same reply for unknown emails, so it cannot reveal who is registered. |
| Password reset | Flood an inbox with reset emails | Supabase sends at most one email per address per 60 seconds, within its hourly email limit. |
| Submit research | Spam the review queue | 10 submissions per user per hour (`/api/submissions`). |
| Submit research | Attach another user's file | The file path must sit in the uploader's own storage folder, checked by the API and by the storage policy. |
| Submit research | Upload malware or huge files | The bucket is private, accepts only PDF and JPEG up to 20 MB, and files are served from Supabase's domain through 5-minute signed links. |
| Submit research | Disguise another kind of file as a PDF or JPEG | The API reads the file's first bytes and rejects (and deletes) anything that is not really a PDF or JPEG. |
| Review | Approve your own work, or work assigned to someone else | The API refuses both; only the assigned reviewer or an admin can decide. |
| Review | Approve without checking | Approval requires all four checklist items, enforced again in the database function. |
| Flag content | Harass an author or flood admins with reports | One open flag per person per item, and 20 reports per user per day. |
| Read data | Use the public anon key to read drafts, emails or other users' profiles | Row-level security limits drafts to their author, reviewer and admins, hides email columns, and shows profiles only to related users. |
| Admin | Reach admin pages or APIs without the role | Every admin page and API route checks the role itself; the service-role key never reaches the browser. |
| Links | Redirect people to another site via `?next=` | Only same-site paths are accepted. |

## Logging and alerts

- Security events go to the `security_events` table: failed sign-ins (password and authenticator code), access denied, rate limits hit, rejected uploads, and admin actions (role changes, reviewer assignments, deletions, flag decisions, category changes). Admins read them at **Admin → Security log**.
- The table is append-only. A database trigger refuses every update, delete and truncate, including from the service-role key, so entries cannot be altered through the app or the API.
- Admins get a notification and an email when one account, email or IP repeats the same event within 15 minutes: 5 failed sign-ins, 10 access-denied errors, 3 rate-limit hits or 3 rejected uploads.
- Each event also goes to the platform logs as a one-line JSON entry, without its details.
- Failed sign-ins are reported by the sign-in pages, because sign-in runs between the browser and Supabase Auth. Someone scripting directly against Supabase skips this report, but Supabase still records the attempt in **Logs → Auth** in its dashboard.
- IP addresses come from the `x-forwarded-for` header set by the hosting platform. Behind a host that does not overwrite that header, the IP can be spoofed.

## Dependencies

- `.npmrc` sets `ignore-scripts=true`, so packages cannot run install scripts on your machine or in CI. If a future package genuinely needs one, run it explicitly (for example `npm rebuild <package>`).
- CI checks registry signatures (`npm audit signatures`) and fails on high-severity production vulnerabilities. Dependabot updates arrive as pull requests that go through the same checks.

## Known gaps

- Files can be uploaded to your own storage folder without finishing a submission. Each file is limited to 20 MB, but the number of uploads is not.
- The public search API has no per-IP rate limit in the app. Add a rate-limit rule in the hosting firewall (for example Vercel Firewall) for `/api/search`.

## Hosted Supabase settings

`supabase/config.toml` only configures the local stack. In the hosted project's dashboard, check:

- **Authentication → Sign In / Providers → Email:** "Confirm email" is on.
- **Authentication → URL Configuration:** the redirect URLs include `https://<your-domain>/auth/confirm**`, so reset and confirmation links can return to the site.
- **Authentication → Rate Limits:** the defaults are kept or tightened.
- **Authentication → Multi-Factor:** "Authenticator app (TOTP)" is enabled.
- **Authentication → Sign In / Providers → Email:** minimum password length is 10, password requirements are "Letters and digits", and "Secure password change" is on. On a paid plan, also turn on "Prevent use of leaked passwords".
- **Optional:** turn on CAPTCHA protection (Cloudflare Turnstile or hCaptcha) under **Authentication → Attack Protection** to slow down password guessing from many IPs.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting (the repository's **Security** tab) rather than opening a public issue.
