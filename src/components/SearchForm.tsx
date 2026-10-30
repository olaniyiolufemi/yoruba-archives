import { LANGUAGES, LANGUAGE_LABELS } from '@/lib/constants';
import type { Category } from '@/lib/types';
import type { SearchFilters } from '@/lib/validation';

/** Plain GET form so search works without JavaScript and results are linkable. */
export function SearchForm({ categories, filters }: { categories: Category[]; filters: SearchFilters }) {
  return (
    <form action="/search" method="get" role="search" className="card grid gap-5 sm:grid-cols-6">
      <div className="sm:col-span-6">
        <label htmlFor="q" className="label">Keyword</label>
        <input id="q" name="q" type="search" defaultValue={filters.q} className="input" placeholder="e.g. Ifá, oríkì, Ile-Ife bronze" />
        <p className="hint">Tone marks are optional: “orisa” also finds “òrìṣà”.</p>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="category" className="label">Category</label>
        <select id="category" name="category" defaultValue={filters.category ?? ''} className="input">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="language" className="label">Language</label>
        <select id="language" name="language" defaultValue={filters.language ?? ''} className="input">
          <option value="">Any language</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2">
        <div>
          <label htmlFor="from" className="label">Verified from</label>
          <input id="from" name="from" type="date" defaultValue={filters.from ?? ''} className="input" />
        </div>
        <div>
          <label htmlFor="to" className="label">to</label>
          <input id="to" name="to" type="date" defaultValue={filters.to ?? ''} className="input" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-6">
        <button type="submit" className="btn-primary">Search</button>
        <a href="/search" className="btn-secondary">Clear filters</a>
      </div>
    </form>
  );
}
