import 'server-only';

export function siteUrl(path = '') {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  // Links in emails always use HTTPS, except for a local development server.
  const secure = /^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base) ? base : base.replace(/^http:\/\//, 'https://');
  return `${secure.replace(/\/$/, '')}${path}`;
}

/** "ola@example.com" → "o***@example.com", so logs never hold a full address. */
function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  return domain ? `${name.slice(0, 1)}***@${domain}` : '***';
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * Sends a transactional email through Resend when RESEND_API_KEY and EMAIL_FROM
 * are set (FR5). Without them the email is logged, so local development and
 * testing work with no email provider.
 */
export async function sendEmail({ to, subject, text, link }: { to: string; subject: string; text: string; link?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.info(`[email:dev] to=${maskEmail(to)} subject="${subject}"${link ? ` link=${link}` : ''}`);
    return;
  }

  const html = `<p>${escapeHtml(text)}</p>${link ? `<p><a href="${escapeHtml(link)}">Open in Yoruba Archives</a></p>` : ''}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, text: link ? `${text}\n\n${link}` : text, html }),
  });
  if (!res.ok) console.error(`[email] Resend responded ${res.status}: ${await res.text()}`);
}
