import type { Metadata } from 'next';
import Link from 'next/link';
import { ReviewerSelect } from '@/components/admin/ReviewerSelect';
import { StatusBadge } from '@/components/StatusBadge';
import { WithdrawButton } from '@/components/WithdrawButton';
import { requireViewer } from '@/lib/auth';
import { STATUSES, STATUS_LABELS, type SubmissionStatus } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Submissions' };

type Row = {
  id: string;
  title: string;
  status: SubmissionStatus;
  user_id: string;
  public_link: string | null;
  assigned_reviewer_id: string | null;
  created_at: string;
  author: { full_name: string } | null;
};

export default async function AdminSubmissionsPage({ searchParams }: PageProps<'/admin/submissions'>) {
  await requireViewer(['admin']);
  const raw = (await searchParams).status;
  const status = STATUSES.includes(raw as SubmissionStatus) ? (raw as SubmissionStatus) : null;
  const admin = createAdminClient();

  let query = admin
    .from('research_submissions')
    .select('id, title, status, user_id, public_link, assigned_reviewer_id, created_at, author:profiles!research_submissions_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  const [{ data }, { data: reviewers }] = await Promise.all([
    query,
    admin.from('profiles').select('id, full_name, role').in('role', ['reviewer', 'admin']).order('full_name'),
  ]);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-4">
      <nav aria-label="Filter by status" className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/submissions" className={status ? 'underline' : 'font-medium'}>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/submissions?status=${s}`} className={status === s ? 'font-medium' : 'underline'}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="card text-sm text-muted">No submissions.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-[3px] border border-hairline">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={r.status} />
                  <Link href={r.status === 'verified' && r.public_link ? `/research/${r.public_link}` : `/review/${r.id}`} className="text-ink hover:underline">
                    {r.title}
                  </Link>
                </div>
                <p className="text-xs text-muted">{r.author?.full_name} · {formatDate(r.created_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {r.status === 'pending' && (
                  <ReviewerSelect
                    submissionId={r.id}
                    current={r.assigned_reviewer_id}
                    options={(reviewers ?? []).filter((p) => p.id !== r.user_id)}
                  />
                )}
                <WithdrawButton id={r.id} label="Delete" redirectTo="/admin/submissions" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
