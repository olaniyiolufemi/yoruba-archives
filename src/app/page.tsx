import Link from 'next/link';
import { ResultCard } from '@/components/ResultCard';
import { getViewer } from '@/lib/auth';
import { CHECKLIST } from '@/lib/constants';
import { getCategories } from '@/lib/queries';
import { searchResearch } from '@/lib/search';
import { parseSearchFilters } from '@/lib/validation';

const OFFER = [
  {
    tag: '01 / Contributed',
    marker: 'bg-blue',
    art: '/art/ife-head.svg',
    alt: 'Line engraving of an Ife bronze head',
    title: 'Share your research',
    body: 'Upload a PDF or image with a title, abstract and keywords, in Yorùbá, English or both. You keep ownership of your work.',
  },
  {
    tag: '02 / Verified',
    marker: 'bg-yellow',
    art: '/art/ade.svg',
    alt: 'Line engraving of an adé, a beaded Yorùbá crown',
    title: 'Checked by a reviewer',
    body: 'Lecturers and experienced researchers check every submission for authorship, sources, cultural relevance and sensitivity.',
  },
  {
    tag: '03 / Open',
    marker: 'bg-green',
    art: '/art/dundun.svg',
    alt: 'Line engraving of a dùndún talking drum',
    title: 'Found by anyone',
    body: 'Verified work gets a permanent public link and appears in search by keyword, category, language and date.',
  },
];

const ROLES = [
  ['Researchers', 'Students, lecturers and independent historians who want their work seen and trusted.'],
  ['Reviewers', 'Lecturers and experienced researchers from partner departments who verify submissions.'],
  ['Readers', 'Anyone looking for Yorùbá research, with no account needed to search and read.'],
  ['Administrators', 'Keep the archive healthy: manage reviewers, categories and reported content.'],
];

const STEPS = [
  ['Submit', 'A researcher uploads their work.'],
  ['Review', 'A designated reviewer checks it.'],
  ['Revise', 'If needed, it comes back with comments.'],
  ['Publish', 'Approved work gets a permanent link.'],
];

export default async function HomePage() {
  const [viewer, categories, latest] = await Promise.all([getViewer(), getCategories(), searchResearch(parseSearchFilters({}))]);
  const contributeHref = !viewer ? '/register' : viewer.role === 'public' ? '/search' : '/dashboard/submit';

  return (
    <div className="relative -mt-8 overflow-x-clip sm:-mt-12">
      {/* Backdrop: dot grid. */}
      <div aria-hidden className="dot-grid art-fade-down absolute inset-x-0 -top-[76px] h-[1000px]" />

      {/* Hero: the Ọpọ́n Ifá engraving beside the copy, never under it. */}
      <section className="container-page relative z-10 grid items-center gap-12 pb-24 pt-20 sm:pt-28 lg:grid-cols-2 lg:gap-16 lg:pb-32">
        <div className="flex flex-col items-center text-center lg:order-2 lg:items-start lg:text-left">
          <h1 className="display reveal max-w-[15ch] text-[44px] text-ink [animation-delay:60ms] sm:text-[64px] lg:text-[68px] xl:text-[76px]">
            <span className="text-muted">Keep</span> Yorùbá knowledge lasting.
          </h1>
          <p className="reveal mt-8 max-w-[440px] text-base text-muted [animation-delay:140ms]">
            A community archive where researchers share work on Yorùbá art, history, language and belief. Reviewers verify
            it, and anyone can find it.
          </p>
          <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 [animation-delay:220ms] lg:justify-start">
            <Link href="/search" className="btn-primary px-6">Browse the archive</Link>
            <Link href={contributeHref} className="text-sm text-ink-2 underline-offset-4 hover:underline">
              Contribute research
            </Link>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none relative mx-auto w-full max-w-[420px] lg:order-1 lg:max-w-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/opon-ifa.svg" alt="" className="block w-full opacity-75" />
          {/* The one blue "selection" over the artwork. */}
          <div className="absolute left-[74%] top-[50%] hidden h-[13%] w-[17%] bg-blue/90 mix-blend-multiply sm:block" />
        </div>
      </section>

      {/* What we offer */}
      <section className="relative z-10 bg-white">
        <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="#f0f0f0" strokeWidth="1" />
        </svg>
        <div className="relative grid border-b border-hairline lg:grid-cols-2">
          <div className="flex min-h-[220px] flex-col justify-end px-5 pb-10 pt-14 sm:px-8 lg:min-h-[300px] lg:border-r lg:border-hairline lg:px-12">
            <h2 className="display max-w-[14ch] text-4xl sm:text-5xl">Research the community can trust</h2>
          </div>
          <div className="flex items-end px-5 pb-10 sm:px-8 lg:px-12">
            <p className="max-w-md text-muted">
              Yorùbá scholarship is scattered across university repositories, private collections and social media, and
              very little of it is checked. Yorùbá Archives gives it one open, reviewed home.
            </p>
          </div>
        </div>
        <div className="relative grid gap-5 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
          {OFFER.map((o) => (
            <article key={o.tag} className="flex flex-col rounded-[3px] sm:min-h-[460px] bg-surface p-5 transition-colors hover:bg-surface-2 sm:p-6">
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <span aria-hidden className={`size-2 ${o.marker}`} />
                {o.tag}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={o.art} alt={o.alt} className="mx-auto my-8 h-52 w-auto mix-blend-multiply lg:h-60" />
              <h3 className="display mt-auto text-2xl">{o.title}</h3>
              <p className="mt-2 text-sm text-muted">{o.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How review works */}
      <section className="container-page relative z-10 bg-white py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr]">
          <div>
            <h2 className="display max-w-[13ch] text-4xl sm:text-5xl">Four checks before anything is shared</h2>
            <p className="mt-6 max-w-sm text-muted">
              Every submission goes to one designated reviewer. Nothing becomes public until it passes all four.
            </p>
          </div>
          <ol className="grid gap-x-10 sm:grid-cols-2">
            {CHECKLIST.map((c, i) => (
              <li key={c.key} className="border-t border-hairline py-6">
                <p className="text-sm text-ink-2">
                  {String(i + 1).padStart(2, '0')} / {c.label}
                </p>
                <p className="mt-2 text-sm text-muted">{c.hint}</p>
              </li>
            ))}
          </ol>
        </div>
        <ol className="mt-20 grid border-t border-hairline sm:grid-cols-4">
          {STEPS.map(([title, body], i) => (
            <li key={title} className={`py-6 sm:px-6 sm:first:pl-0 ${i > 0 ? 'border-t border-hairline sm:border-l sm:border-t-0' : ''}`}>
              <p className="display text-3xl text-soft">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-4 text-ink">{title}</p>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Who it is for */}
      <section className="relative z-10 bg-surface">
        <div className="container-page py-24 sm:py-28">
          <h2 className="display max-w-[18ch] text-4xl sm:text-5xl">Built with the people who keep the record</h2>
          <ul className="mt-14 grid gap-px overflow-hidden rounded-[3px] bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(([title, body], i) => (
              <li key={title} className="bg-surface p-6 lg:min-h-[220px]">
                <p className="text-sm text-ink-2">
                  {String(i + 1).padStart(2, '0')} / {title}
                </p>
                <p className="mt-10 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The archive */}
      <section className="container-page relative z-10 bg-white py-24 sm:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-4xl sm:text-5xl">Explore by theme</h2>
          </div>
          <Link href="/search" className="btn-secondary">Browse all {latest.total} verified items</Link>
        </div>

        {categories.length > 0 && (
          <ul className="mt-12 grid border-t border-hairline md:grid-cols-2 md:gap-x-12">
            {categories.map((c, i) => (
              <li key={c.id} className="border-b border-hairline">
                <Link href={`/search?category=${c.id}`} className="group flex items-baseline gap-5 py-5">
                  <span className="w-6 shrink-0 text-xs text-soft">{String(i + 1).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="block text-ink group-hover:underline group-hover:underline-offset-4">{c.name}</span>
                    {c.description && <span className="mt-0.5 block text-sm text-muted">{c.description}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-20">
          <p className="mb-6 text-sm text-ink-2">Recently verified</p>
          {latest.rows.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {latest.rows.slice(0, 3).map((item) => <ResultCard key={item.id} item={item} />)}
            </div>
          ) : (
            <p className="card text-sm text-muted">Nothing has been verified yet. Verified research will appear here.</p>
          )}
        </div>
      </section>

      {/* Closing */}
      <section className="relative z-10 overflow-hidden border-t border-hairline bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/art/ade.svg"
          alt=""
          aria-hidden
          className="art-fade-left pointer-events-none absolute -right-16 top-6 hidden h-[130%] w-auto opacity-80 md:block"
        />
        <div className="container-page relative py-28 sm:py-36">
          <h2 className="display max-w-[16ch] text-[40px] sm:text-[56px]">
            <span className="text-muted">Our knowledge,</span> our history.
          </h2>
          <p className="mt-6 max-w-md text-muted">Add your research to the record, or start exploring what others have shared.</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href={contributeHref} className="btn-primary px-6">{viewer ? 'Contribute research' : 'Create an account'}</Link>
            <Link href="/search" className="text-sm text-ink-2 underline-offset-4 hover:underline">Browse the archive</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
