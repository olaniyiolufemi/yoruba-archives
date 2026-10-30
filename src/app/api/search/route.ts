import type { NextRequest } from 'next/server';
import { searchResearch } from '@/lib/search';
import { parseSearchFilters } from '@/lib/validation';

// JSON search endpoint (FR7), also used for the NFR2 response-time checks.
export async function GET(request: NextRequest) {
  const filters = parseSearchFilters(Object.fromEntries(request.nextUrl.searchParams));
  const started = performance.now();
  const { rows, total, pageSize, error } = await searchResearch(filters);
  if (error) return Response.json({ error }, { status: 500 });
  return Response.json(
    { results: rows, total, page: filters.page, pages: Math.max(1, Math.ceil(total / pageSize)) },
    { headers: { 'Server-Timing': `db;dur=${(performance.now() - started).toFixed(1)}` } },
  );
}
