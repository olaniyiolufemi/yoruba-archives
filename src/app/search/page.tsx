import type { Metadata } from 'next';
import Link from 'next/link';
import { ResultCard } from '@/components/ResultCard';
import { SearchForm } from '@/components/SearchForm';
import { getCategories } from '@/lib/queries';
import { searchResearch } from '@/lib/search';
import { parseSearchFilters } from '@/lib/validation';

export const metadata: Metadata = { title: 'Search' };

export default async function SearchPage({ searchParams }: PageProps<'/search'>) {
  const filters = parseSearchFilters(await searchParams);
  const [categories, { rows, total, pageSize, error }] = await Promise.all([
    getCategories(),
    searchResearch(filters),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.language) params.set('language', filters.language);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    params.set('page', String(page));
    return `/search?${params}`;
  };

  return (
    <div className="container-page space-y-10">
      <div className="grid gap-6 border-b border-hairline pb-10 lg:grid-cols-2 lg:items-end">
        <div>
          <h1 className="page-title">Browse verified research</h1>
        </div>
        <p className="max-w-md text-muted lg:justify-self-end">
          Only research that has passed review appears here. Search in Yorùbá or English; tone marks are optional.
        </p>
      </div>
      <SearchForm categories={categories} filters={filters} />

      <section aria-live="polite" className="space-y-5">
        <p className="text-sm text-muted">
          {error ?? `${total} ${total === 1 ? 'result' : 'results'}${pages > 1 ? ` · page ${filters.page} of ${pages}` : ''}`}
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => <ResultCard key={item.id} item={item} />)}
        </div>
        {!error && rows.length === 0 && (
          <p className="card text-sm text-muted">No verified research matches these filters. Try fewer keywords or clear a filter.</p>
        )}
      </section>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
          {filters.page > 1 ? <Link href={pageHref(filters.page - 1)} className="btn-secondary">Previous</Link> : <span />}
          {filters.page < pages ? <Link href={pageHref(filters.page + 1)} className="btn-secondary">Next</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
