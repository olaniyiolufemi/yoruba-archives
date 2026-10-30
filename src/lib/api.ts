import 'server-only';
import { getViewer, type Viewer } from './auth';
import type { Role } from './constants';

export function jsonError(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** For route handlers: authenticates and authorises, or returns an error response. */
export async function authorize(
  roles?: Role[],
): Promise<{ viewer: Viewer; error?: never } | { viewer?: never; error: Response }> {
  const viewer = await getViewer();
  if (!viewer) return { error: jsonError(401, 'Please sign in.') };
  if (roles && !roles.includes(viewer.role)) return { error: jsonError(403, 'You do not have permission to do that.') };
  return { viewer };
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
