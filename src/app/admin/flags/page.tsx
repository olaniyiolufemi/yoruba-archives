import type { Metadata } from 'next';
import Link from 'next/link';
import { FlagActions } from '@/components/admin/FlagActions';
import { requireViewer } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Flagged content' };

type FlagRow = {
  id: string;
  reason: string;
  status: 'open' | 'dismissed' | 'actioned';
  created_at: string;
  research_submissions: { id: string; title: string; public_link: string | null; status: string } | null;
  reporter: { full_name: string; email: string } | null;
};

// FR8: manage flagged content.
export default async function AdminFlagsPage({ searchParams }: PageProps<'/admin/flags'>) {
  await requireViewer(['admin']);
  const showAll = (await searchParams).all === '1';
  let query = createAdminClient()
    .from('content_flags')
    .select('id, reason, status, created_at, research_submissions(id, title, public_link, status), reporter:profiles!content_flags_reporter_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (!showAll) query = query.eq('status', 'open');
  const flags = ((await query).data ?? []) as unknown as FlagRow[];

  return (
    <div className="space-y-4">
      <div className="flex gap-3 text-sm">
        <Link href="/admin/flags" className={showAll ? 'underline' : 'font-medium'}>Open</Link>
        <Link href="/admin/flags?all=1" className={showAll ? 'font-medium' : 'underline'}>All</Link>
      </div>
      {flags.length === 0 ? (
        <p className="card text-sm text-muted">No {showAll ? '' : 'open '}flags.</p>
      ) : (
        <ul className="space-y-3">
          {flags.map((f) => (
            <li key={f.id} className="card space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                {f.research_submissions?.public_link && f.research_submissions.status === 'verified' ? (
                  <Link href={`/research/${f.research_submissions.public_link}`} className="text-ink hover:underline">
                    {f.research_submissions.title}
                  </Link>
                ) : (
                  <span className="font-medium">{f.research_submissions?.title ?? 'Deleted submission'}</span>
                )}
                <span className="text-xs text-muted">{formatDateTime(f.created_at)}</span>
              </div>
              <p className="text-sm text-ink-2">“{f.reason}”</p>
              <p className="text-xs text-muted">Reported by {f.reporter ? `${f.reporter.full_name} (${f.reporter.email})` : 'a deleted user'}</p>
              {f.status === 'open' ? <FlagActions flagId={f.id} /> : <p className="text-xs font-medium capitalize">{f.status}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
