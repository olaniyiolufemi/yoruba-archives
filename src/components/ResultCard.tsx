import Link from 'next/link';
import { LANGUAGE_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import type { SearchRow } from '@/lib/types';

export function ResultCard({ item }: { item: SearchRow }) {
  return (
    <article className="group relative flex h-full flex-col rounded-[3px] bg-surface p-5 transition-colors hover:bg-surface-2 sm:p-6">
      <p className="text-xs text-muted">
        {item.category_name} <span className="text-line">/</span> {LANGUAGE_LABELS[item.language]}
      </p>
      <h3 className="display mt-3 text-xl text-ink sm:text-[22px]">
        <Link href={`/research/${item.public_link}`} className="after:absolute after:inset-0">
          {item.title}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted">{item.abstract}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-xs text-muted">
        <span>{item.author_name}</span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-blue" />
          Verified {formatDate(item.verified_at)}
        </span>
      </div>
    </article>
  );
}
