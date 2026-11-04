import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logSecurityEvent } from './audit';
import { getViewer, isMfaPending, type Viewer } from './auth';
import type { Role } from './constants';

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** For route handlers: authenticates and authorises, or returns an error response. */
export async function authorize(
  roles?: Role[],
): Promise<{ viewer: Viewer; error?: never } | { viewer?: never; error: Response }> {
  const viewer = await getViewer();
  if (!viewer) return { error: jsonError(401, (await isMfaPending()) ? 'Enter the code from your authenticator app to finish signing in.' : 'Please sign in.') };
  if (roles && !roles.includes(viewer.role)) {
    await logSecurityEvent('access_denied', { userId: viewer.id, details: { role: viewer.role, required: roles } });
    return { error: jsonError(403, 'You do not have permission to do that.') };
  }
  return { viewer };
}

/**
 * Rate limit for writes, counted from the user's own recent rows so it needs no
 * extra infrastructure. Fails closed: if the count cannot be read, the write is refused.
 */
export async function overLimit(
  admin: SupabaseClient,
  { table, column, userId, max, windowMinutes }: { table: string; column: string; userId: string; max: number; windowMinutes: number },
): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error } = await admin
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, userId)
    .gte('created_at', since);
  const limited = Boolean(error) || (count ?? 0) >= max;
  if (limited) await logSecurityEvent('rate_limited', { userId, details: { table, max, window_minutes: windowMinutes } });
  return limited;
}

/** Parses a JSON object body. Non-JSON content types are ignored, which also blocks cross-site form posts. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) return {};
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  } catch {
    return {};
  }
}
