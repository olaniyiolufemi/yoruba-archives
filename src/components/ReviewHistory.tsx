import { CHECKLIST, DECISION_LABELS } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';
import type { PeerReview } from '@/lib/types';

type ReviewWithName = PeerReview & { reviewer: { full_name: string } | null };

export function ReviewHistory({ reviews, showReviewer = true }: { reviews: ReviewWithName[]; showReviewer?: boolean }) {
  if (reviews.length === 0) return <p className="text-sm text-muted">No reviews yet.</p>;
  return (
    <ol className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="card space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{DECISION_LABELS[r.decision]}</p>
            <p className="text-xs text-muted">
              {formatDateTime(r.reviewed_at)}
              {showReviewer && r.reviewer ? ` · ${r.reviewer.full_name}` : ''}
            </p>
          </div>
          {r.comments && <p className="whitespace-pre-line text-sm text-ink-2">{r.comments}</p>}
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {CHECKLIST.map((c) => (
              <li key={c.key}>
                {r[c.key] ? '✓' : '✗'} {c.label}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
