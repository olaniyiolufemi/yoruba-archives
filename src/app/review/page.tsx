import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { LANGUAGE_LABELS, type Language } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Review queue' };

type QueueItem = {
  id: string;
  title: string;
  language: Language;
  created_at: string;
  updated_at: string;
  assigned_reviewer_id: string | null;
  categories: { name: string } | null;
  author: { full_name: string } | null;
};

// "View Assigned Submissions": reviewers see their own queue; admins see every
// pending item, including ones no reviewer could be assigned to.
export default async function ReviewQueuePage() {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const supabase = await createClient();
  let query = supabase
    .from('research_submissions')
    .select('id, title, language, created_at, updated_at, assigned_reviewer_id, categories(name), author:profiles!research_submissions_user_id_fkey(full_name)')
    .eq('status', 'pending')
    .order('updated_at', { ascending: true });
  if (viewer.role !== 'admin') query = query.eq('assigned_reviewer_id', viewer.id);
  const { data } = await query;
  const items = (data ?? []) as unknown as QueueItem[];

  return (
    <div className="container-page space-y-6">
      <div>
        <h1 className="page-title">Review queue</h1>
        <p className="mt-1 text-sm text-muted">
          {viewer.role === 'admin' ? 'All pending submissions.' : 'Submissions assigned to you, oldest first.'}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="card text-sm text-muted">Nothing is waiting for review.</p>
      ) : (
        <ul className="divide-y divide-hairline rounded-[3px] border border-hairline">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/review/${item.id}`} className="text-ink hover:underline">{item.title}</Link>
                <p className="text-xs text-muted">
                  {item.author?.full_name} · {item.categories?.name} · {LANGUAGE_LABELS[item.language]} · waiting since {formatDate(item.updated_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {viewer.role === 'admin' && item.assigned_reviewer_id !== viewer.id && (
                  <span className="text-xs text-muted">{item.assigned_reviewer_id ? 'Assigned to a reviewer' : 'Unassigned'}</span>
                )}
                <Link href={`/review/${item.id}`} className="btn-primary min-h-9">Review</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
