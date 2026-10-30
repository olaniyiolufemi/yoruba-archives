import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileLinks } from '@/components/FileLinks';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewHistory } from '@/components/ReviewHistory';
import { StatusBadge } from '@/components/StatusBadge';
import { requireViewer } from '@/lib/auth';
import { LANGUAGE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { getSubmissionDetail } from '@/lib/queries';
import { isUuid } from '@/lib/validation';

export const metadata: Metadata = { title: 'Review submission' };

// "Examine Research": the reviewer reads the item and file, then decides.
export default async function ReviewSubmissionPage({ params }: PageProps<'/review/[id]'>) {
  const viewer = await requireViewer(['reviewer', 'admin']);
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { submission: s, reviews } = await getSubmissionDetail(id);
  if (!s) notFound();
  if (viewer.role !== 'admin' && s.assigned_reviewer_id !== viewer.id) notFound();

  const canDecide = s.status === 'pending' && s.user_id !== viewer.id;

  return (
    <div className="container-page grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="min-w-0 space-y-6">
        <Link href="/review" className="text-sm text-muted hover:underline">← Review queue</Link>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <StatusBadge status={s.status} />
            <span>{s.categories?.name}</span>
            <span>· {LANGUAGE_LABELS[s.language]}</span>
          </div>
          <h1 className="page-title">{s.title}</h1>
          <p className="text-sm text-ink-2">
            {s.author?.full_name}
            {s.author?.institution ? `, ${s.author.institution}` : ''} · submitted {formatDate(s.created_at)}
            {reviews.length > 0 ? ` · revised ${formatDate(s.updated_at)}` : ''}
          </p>
        </header>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Abstract</h2>
          <p className="whitespace-pre-line leading-relaxed text-ink-2">{s.abstract}</p>
          <p className="text-sm text-muted">Keywords: {s.keywords.join(', ')}</p>
        </section>
        <FileLinks id={s.id} fileName={s.file_name} fileType={s.file_type} />
        <section className="space-y-2">
          <h2 className="display text-2xl">Earlier reviews</h2>
          <ReviewHistory reviews={reviews} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        {canDecide ? (
          <ReviewForm submissionId={s.id} />
        ) : (
          <p className="card text-sm text-muted">
            {s.user_id === viewer.id ? 'You cannot review your own submission.' : 'This submission is no longer awaiting review.'}
          </p>
        )}
      </aside>
    </div>
  );
}
