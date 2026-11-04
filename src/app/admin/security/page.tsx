import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Security log' };

type EventRow = {
  id: number;
  created_at: string;
  event_type: string;
  user_id: string | null;
  ip: string | null;
  details: Record<string, unknown>;
};

const TYPES = [
  'login_failed',
  'access_denied',
  'rate_limited',
  'upload_rejected',
  'role_changed',
  'reviewer_assigned',
  'submission_deleted',
  'flag_resolved',
  'category_changed',
];

// OWASP A09: the append-only security log. Repeated patterns also raise an
// admin notification (see src/lib/audit.ts).
export default async function AdminSecurityPage({ searchParams }: PageProps<'/admin/security'>) {
  await requireViewer(['admin']);
  const type = (await searchParams).type;
  const filter = typeof type === 'string' && TYPES.includes(type) ? type : null;

  const admin = createAdminClient();
  let query = admin.from('security_events').select('id, created_at, event_type, user_id, ip, details').order('created_at', { ascending: false }).limit(200);
  if (filter) query = query.eq('event_type', filter);
  const events = ((await query).data ?? []) as EventRow[];

  const userIds = [...new Set(events.map((e) => e.user_id).filter(Boolean))] as string[];
  const { data: people } = userIds.length ? await admin.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] };
  const names = new Map((people ?? []).map((p) => [p.id as string, `${p.full_name} (${p.email})`]));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">The most recent 200 events. Entries cannot be edited or deleted.</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <Link href="/admin/security" className={filter ? 'underline' : 'font-medium'}>All</Link>
        {TYPES.map((t) => (
          <Link key={t} href={`/admin/security?type=${t}`} className={filter === t ? 'font-medium' : 'underline'}>
            {t.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>
      {events.length === 0 ? (
        <p className="card text-sm text-muted">No events recorded.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="card space-y-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">{e.event_type.replace(/_/g, ' ')}</span>
                <span className="text-xs text-muted">{formatDateTime(e.created_at)}</span>
              </div>
              <p className="text-xs text-muted">
                {e.user_id ? names.get(e.user_id) ?? `Deleted user ${e.user_id}` : 'Not signed in'}
                {e.ip ? ` · IP ${e.ip}` : ''}
              </p>
              {Object.keys(e.details).length > 0 && (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-xs text-ink-2">{JSON.stringify(e.details)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
