import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CopyLinkButton } from '@/components/CopyLinkButton';
import { FileLinks } from '@/components/FileLinks';
import { FilePreview } from '@/components/FilePreview';
import { FlagForm } from '@/components/FlagForm';
import { VerifiedLabel } from '@/components/StatusBadge';
import { getViewer } from '@/lib/auth';
import { DEMO_ITEMS, isDemoMode } from '@/lib/demo-data';
import { LANGUAGE_LABELS } from '@/lib/constants';
import { siteUrl } from '@/lib/email';
import { formatDate } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { Submission } from '@/lib/types';

type PublicItem = Submission & {
  demo?: boolean;
  categories: { name: string } | null;
  author: { full_name: string; institution: string | null } | null;
  verifier: { full_name: string } | null;
};

async function getPublicItem(link: string) {
  if (isDemoMode()) {
    const d = DEMO_ITEMS.find((i) => i.public_link === link);
    if (!d) return null;
    return {
      ...d,
      status: 'verified',
      file_type: 'application/pdf',
      file_name: `${d.public_link}.pdf`,
      categories: { name: d.category_name },
      author: { full_name: d.author_name, institution: d.institution },
      verifier: { full_name: d.reviewer },
      demo: true,
    } as unknown as PublicItem;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from('research_submissions')
    .select('*, categories(name), author:profiles!research_submissions_user_id_fkey(full_name, institution), verifier:profiles!research_submissions_verified_by_fkey(full_name)')
    .eq('public_link', link)
    .eq('status', 'verified')
    .maybeSingle();
  return data as PublicItem | null;
}

export async function generateMetadata({ params }: PageProps<'/research/[link]'>): Promise<Metadata> {
  const item = await getPublicItem((await params).link);
  return item ? { title: item.title, description: item.abstract.slice(0, 160) } : { title: 'Not found' };
}

// FR6: the permanent public page for a verified submission.
export default async function ResearchPage({ params }: PageProps<'/research/[link]'>) {
  const { link } = await params;
  const [item, viewer] = await Promise.all([getPublicItem(link), getViewer()]);
  if (!item) notFound();

  const url = siteUrl(`/research/${item.public_link}`);

  return (
    <article className="container-page">
      <header className="max-w-4xl space-y-5 border-b border-hairline pb-10">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <VerifiedLabel date={item.verified_at} reviewer={item.verifier?.full_name} />
          {item.categories && <span className="badge bg-surface text-ink-2">{item.categories.name}</span>}
          <span>{LANGUAGE_LABELS[item.language]}</span>
        </div>
        <h1 className="page-title">{item.title}</h1>
        <p className="text-sm text-muted">
          {item.author?.full_name}
          {item.author?.institution ? `, ${item.author.institution}` : ''} · submitted {formatDate(item.created_at)}
        </p>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:gap-16">
        <div className="min-w-0 space-y-10">
          <section className="space-y-2">
            <h2 className="eyebrow">Abstract</h2>
            <p className="whitespace-pre-line text-[17px] leading-[1.7] text-ink-2">{item.abstract}</p>
          </section>

          {item.keywords.length > 0 && (
            <section className="space-y-2">
              <h2 className="eyebrow">Keywords</h2>
              <ul className="flex flex-wrap gap-1.5">
                {item.keywords.map((k) => (
                  <li key={k}>
                    <a href={`/search?q=${encodeURIComponent(k)}`} className="rounded-[3px] bg-surface px-2.5 py-1 text-sm hover:bg-surface-2">
                      {k}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!item.demo && (
            <section className="space-y-3">
              <h2 className="eyebrow">Research material</h2>
              <FilePreview id={item.id} fileName={item.file_name} fileType={item.file_type} />
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:border-l lg:border-hairline lg:pl-10">
          {item.demo ? (
            <p className="card text-sm text-muted">Sample item: file downloads work once the database is connected.</p>
          ) : (
            <FileLinks id={item.id} fileName={item.file_name} fileType={item.file_type} />
          )}

          <section className="card space-y-2">
            <h2 className="text-sm text-ink-2">Permanent link</h2>
            <div className="flex flex-col gap-2">
              <input readOnly value={url} className="input font-mono text-xs" aria-label="Permanent link" />
              <CopyLinkButton url={url} />
            </div>
          </section>

          <FlagForm submissionId={item.id} signedIn={Boolean(viewer)} />
        </aside>
      </div>
    </article>
  );
}
