import 'server-only';
import { headers } from 'next/headers';
import { isDemoMode } from './demo-data';
import { adminIds, notify } from './notify';
import { createAdminClient } from './supabase/admin';

export type SecurityEventType =
  | 'login_failed'
  | 'access_denied'
  | 'rate_limited'
  | 'upload_rejected'
  | 'role_changed'
  | 'reviewer_assigned'
  | 'submission_deleted'
  | 'flag_resolved'
  | 'category_changed';

// Admins are alerted when one account, email or IP triggers the same event this
// many times within the window. The alert fires once, when the count first
// reaches the threshold.
const WINDOW_MINUTES = 15;
const ALERTS: Partial<Record<SecurityEventType, { threshold: number; title: string }>> = {
  login_failed: { threshold: 5, title: 'Repeated failed sign-ins' },
  access_denied: { threshold: 10, title: 'Repeated access-denied errors' },
  rate_limited: { threshold: 3, title: 'Rate limit hit repeatedly' },
  upload_rejected: { threshold: 3, title: 'Repeated disguised file uploads' },
};
// Events from signed-out visitors are capped per IP, so the log cannot be flooded.
const ANONYMOUS_CAP = 100;

async function clientInfo() {
  const h = await headers();
  // Set by the hosting platform (Vercel overwrites it); only trust it behind such a proxy.
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
  return {
    ip: ip && /^[0-9a-f:.]{2,45}$/i.test(ip) ? ip : null,
    userAgent: h.get('user-agent')?.slice(0, 300) ?? null,
  };
}

const since = () => new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

/**
 * Records a security event in the append-only security_events table and alerts
 * admins when a pattern repeats. Never throws, so logging can't break a request.
 * `alertKey` groups events for alerting when there is no user id (e.g. the email
 * a failed sign-in was for).
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  { userId = null, details = {}, alertKey }: { userId?: string | null; details?: Record<string, unknown>; alertKey?: { field: string; value: string } } = {},
) {
  try {
    const { ip, userAgent } = await clientInfo();
    // Platform logs get the event without its details, which may hold personal data.
    console.warn(JSON.stringify({ security_event: type, user_id: userId, ip }));
    if (isDemoMode()) return;

    const admin = createAdminClient();
    const count = async (column: string, value: string) =>
      (await admin.from('security_events').select('id', { count: 'exact', head: true }).eq('event_type', type).eq(column, value).gte('created_at', since())).count ?? 0;

    if (!userId && ip && (await count('ip', ip)) >= ANONYMOUS_CAP) return;

    const { error } = await admin.from('security_events').insert({ event_type: type, user_id: userId, ip, user_agent: userAgent, details });
    if (error) return console.error('[security] could not record event', error.message);

    const rule = ALERTS[type];
    const key = alertKey ? { column: `details->>${alertKey.field}`, value: alertKey.value, label: `${alertKey.field} ${alertKey.value}` }
      : userId ? { column: 'user_id', value: userId, label: `user ${userId}` }
        : ip ? { column: 'ip', value: ip, label: `IP ${ip}` }
          : null;
    if (!rule || !key || (await count(key.column, key.value)) !== rule.threshold) return;

    await notify(
      admin,
      (await adminIds(admin)).map((id) => ({
        user_id: id,
        type: 'security_alert',
        title: rule.title,
        message: `${rule.threshold} "${type}" events in ${WINDOW_MINUTES} minutes for ${key.label}${ip ? ` (last from IP ${ip})` : ''}. Review them in the security log.`,
        link: '/admin/security',
      })),
    );
  } catch (e) {
    console.error('[security] logging failed', e instanceof Error ? e.message : e);
  }
}
