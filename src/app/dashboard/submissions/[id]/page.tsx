import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileLinks } from '@/components/FileLinks';
import { ReviewHistory } from '@/components/ReviewHistory';
import { StatusBadge } from '@/components/StatusBadge';
import { WithdrawButton } from '@/components/WithdrawButton';
import { requireViewer } from '@/lib/auth';
import { LANGUAGE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { getSubmissionDetail } from '@/lib/queries';
import { isUuid } from '@/lib/validation';

export const metadata: Metadata = { title: 'Submission' };

const NEXT_STEP = {
  pending: 'A reviewer is checking this submission. You will get an email and a notification when they decide.',
  revision_requested: 'The reviewer asked for changes. Read their comments below, then revise and resubmit.',
  verified: 'This research is verified and public.',
  rejected: 'This submission was not accepted. The reviewer’s reasons are below.',
} as const;

export default async function MySubmissionPage({ params, searchParams }: PageProps<'/dashboard/submissions/[id]'>) {
  const viewer = await requireViewer();
  const { id } = await params;
  const saved = (await searchParams).saved === '1';
  if (!isUuid(id)) notFound();
  const { submission: s, reviews } = await getSubmissionDetail(id);
  if (!s || s.user_id !== viewer.id) notFound();

  const editable = s.status === 'pending' || s.status === 'revision_requested';

  return (
    <div className="container-page max-w-3xl space-y-6">
      <Link href="/dashboard" className="text-sm text-muted hover:underline">← My research</Link>
      {saved && <p className="card text-sm" role="status">Saved. {NEXT_STEP[s.status]}</p>}

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <StatusBadge status={s.status} />
          <span>{s.categories?.name}</span>
          <span>· {LANGUAGE_LABELS[s.language]}</span>
        </div>
        <h1 className="page-title">{s.title}</h1>
        <p className="text-sm text-muted">
          Submitted {formatDate(s.created_at)} · reviewer: {s.reviewer?.full_name ?? 'awaiting assignment'}
        </p>
        {!saved && <p className="text-sm text-ink-2">{NEXT_STEP[s.status]}</p>}
        <div className="flex flex-wrap gap-2">
          {s.status === 'verified' && s.public_link && (
            <Link href={`/research/${s.public_link}`} className="btn-primary">Open public page</Link>
          )}
          {editable && (
            <Link href={`/dashboard/submissions/${s.id}/edit`} className={s.status === 'revision_requested' ? 'btn-primary' : 'btn-secondary'}>
              {s.status === 'revision_requested' ? 'Revise and resubmit' : 'Edit'}
            </Link>
          )}
          {s.status !== 'verified' && <WithdrawButton id={s.id} />}
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="display text-2xl">Review comments</h2>
        <ReviewHistory reviews={reviews} />
      </section>

      <section className="space-y-2">
        <h2 className="display text-2xl">Abstract</h2>
        <p className="whitespace-pre-line text-ink-2">{s.abstract}</p>
        <p className="text-sm text-muted">Keywords: {s.keywords.join(', ')}</p>
      </section>

      <FileLinks id={s.id} fileName={s.file_name} fileType={s.file_type} />
    </div>
  );
}
