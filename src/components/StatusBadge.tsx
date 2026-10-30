import { STATUS_LABELS, type SubmissionStatus } from '@/lib/constants';
import { formatDate } from '@/lib/format';

// Colour is a marker only: blue for verified, yellow for needs revision.
const DOT: Record<SubmissionStatus, string> = {
  verified: 'bg-blue',
  pending: 'bg-soft',
  revision_requested: 'bg-yellow ring-1 ring-[#e0c92f]',
  rejected: 'bg-line',
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`badge bg-surface text-ink-2 ${status === 'rejected' ? 'text-soft line-through' : ''}`}>
      <span aria-hidden className={`size-1.5 rounded-full ${DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** The "verified" label with review date shown on public research (Section 3.4). */
export function VerifiedLabel({ date, reviewer }: { date: string | null; reviewer?: string | null }) {
  return (
    <span className="badge bg-blue/10 text-[#1d4fa8]">
      <svg aria-hidden viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8.5l3 3 7-7" />
      </svg>
      Verified {formatDate(date)}
      {reviewer ? ` · reviewed by ${reviewer}` : ''}
    </span>
  );
}
