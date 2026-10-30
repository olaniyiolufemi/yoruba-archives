import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { requireViewer } from '@/lib/auth';
import { STATUSES } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { Submission } from '@/lib/types';

export const metadata: Metadata = { title: 'My research' };

// Researcher dashboard: track submission status (FR5) and reach review comments.
export default async function DashboardPage() {
  const viewer = await requireViewer(['researcher', 'reviewer', 'admin']);
  const supabase = await createClient();
  const { data } = await supabase
    .from('research_submissions')
    .select('id, title, status, public_link, created_at, updated_at, verified_at, categories(name)')
    .eq('user_id', viewer.id)
    .order('updated_at', { ascending: false });
  const items = (data ?? []) as unknown as (Submission & { categories: { name: string } | null })[];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, items.filter((i) => i.status === s).length]));

  return (
    <div className="container-page space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">My research</h1>
          <p className="mt-1 text-sm text-muted">Signed in as {viewer.full_name}</p>
        </div>
        <Link href="/dashboard/submit" className="btn-primary">Submit research</Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Pending review', counts.pending],
          ['Needs revision', counts.revision_requested],
          ['Verified', counts.verified],
          ['Not accepted', counts.rejected],
        ].map(([label, value]) => (
          <div key={label} className="card">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {items.length === 0 ? (
        <div className="card space-y-2 text-sm">
          <p>You have not submitted anything yet.</p>
          <Link href="/dashboard/submit" className="underline">Submit your first piece of research</Link>
        </div>
      ) : (
        <ul className="divide-y divide-hairline rounded-[3px] border border-hairline">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/dashboard/submissions/${item.id}`} className="text-ink hover:underline">{item.title}</Link>
                <p className="text-xs text-muted">
                  {item.categories?.name} · submitted {formatDate(item.created_at)} · updated {formatDate(item.updated_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {item.status === 'revision_requested' && (
                  <Link href={`/dashboard/submissions/${item.id}/edit`} className="text-sm underline">Revise</Link>
                )}
                <StatusBadge status={item.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
