/** Client-side helper for calling the API routes. */
export async function sendJson<T = Record<string, unknown>>(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error ?? 'Something went wrong. Please try again.' };
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Network error. Check your connection and try again.' };
  }
}
