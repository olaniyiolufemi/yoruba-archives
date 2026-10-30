import 'server-only';
import { isDemoMode, searchDemo } from './demo-data';
import { createClient } from './supabase/server';
import type { SearchRow } from './types';
import type { SearchFilters } from './validation';

export const SEARCH_PAGE_SIZE = 10;

/** Runs the verified-only search RPC (FR7) with the visitor's session. */
export async function searchResearch(filters: SearchFilters) {
  if (isDemoMode()) return { ...searchDemo(filters, SEARCH_PAGE_SIZE), pageSize: SEARCH_PAGE_SIZE, error: null };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_research', {
    q: filters.q || null,
    p_category: filters.category,
    p_language: filters.language,
    p_from: filters.from,
    p_to: filters.to,
    p_limit: SEARCH_PAGE_SIZE,
    p_offset: (filters.page - 1) * SEARCH_PAGE_SIZE,
  });
  if (error) console.error('[search] failed', error.message);
  const rows = (data ?? []) as SearchRow[];
  return {
    rows,
    total: rows.length ? Number(rows[0].total_count) : 0,
    pageSize: SEARCH_PAGE_SIZE,
    error: error ? 'Search is unavailable right now.' : null,
  };
}
