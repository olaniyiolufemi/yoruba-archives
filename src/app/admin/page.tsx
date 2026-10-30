import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminOverviewPage() {
  await requireViewer(['admin']);
  const admin = createAdminClient();
  const count = (table: string, filter?: [string, string]) => {
    let q = admin.from(table).select('id', { count: 'exact', head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return q.then((r) => r.count ?? 0);
  };
  const [total, pending, verified, revision, rejected, users, reviewers, flags, unassigned] = await Promise.all([
    count('research_submissions'),
    count('research_submissions', ['status', 'pending']),
    count('research_submissions', ['status', 'verified']),
    count('research_submissions', ['status', 'revision_requested']),
    count('research_submissions', ['status', 'rejected']),
    count('profiles'),
    count('profiles', ['role', 'reviewer']),
    count('content_flags', ['status', 'open']),
    admin
      .from('research_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('assigned_reviewer_id', null)
      .then((r) => r.count ?? 0),
  ]);

  const stats = [
    ['Submissions', total],
    ['Pending review', pending],
    ['Verified', verified],
    ['Needs revision', revision],
    ['Rejected', rejected],
    ['Users', users],
    ['Reviewers', reviewers],
    ['Open flags', flags],
  ] as const;

  return (
    <div className="space-y-6">
      {(unassigned > 0 || reviewers === 0) && (
        <p className="card border-ink text-sm" role="status">
          {reviewers === 0 ? 'There are no reviewers yet. ' : ''}
          {unassigned > 0 ? `${unassigned} pending submission(s) have no reviewer. ` : ''}
          <Link href={reviewers === 0 ? '/admin/users' : '/admin/submissions?status=pending'} className="underline">
            {reviewers === 0 ? 'Promote a user to reviewer' : 'Assign reviewers'}
          </Link>
        </p>
      )}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="card">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
