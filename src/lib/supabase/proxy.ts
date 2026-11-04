import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { DEMO_COOKIE, readDemoSession } from '../demo-session';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

const PROTECTED = ['/dashboard', '/review', '/admin', '/notifications', '/reset-password', '/account'];

// Signed-in sessions end after this long without a request. The cookie holds the
// session id and the time of the last request, so a fresh sign-in starts a new clock.
const IDLE_COOKIE = 'last_active';
const IDLE_LIMIT_MS = 2 * 60 * 60 * 1000;

/** Refreshes the auth cookie on every request and bounces signed-out visitors. */
function redirectToLogin(request: NextRequest, path: string, error?: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  const params = new URLSearchParams({ next: path + request.nextUrl.search });
  if (error) params.set('error', error);
  url.search = `?${params}`;
  return NextResponse.redirect(url);
}

const isProtected = (path: string) => PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  if (process.env.DEMO_MODE === '1') {
    const signedIn = Boolean(readDemoSession(request.cookies.get(DEMO_COOKIE)?.value));
    return !signedIn && isProtected(path) ? redirectToLogin(request, path) : response;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return isProtected(path) ? redirectToLogin(request, path) : response;

  const sessionId = String(claims.session_id ?? '');
  const [lastSession, lastSeen] = (request.cookies.get(IDLE_COOKIE)?.value ?? '').split('.');
  if (lastSession === sessionId && Date.now() - Number(lastSeen) > IDLE_LIMIT_MS) {
    // Revoke the session in Supabase, and clear its cookies here too so the
    // visitor is signed out even if Supabase cannot be reached.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    const authCookies = request.cookies.getAll().map((c) => c.name).filter((name) => name.startsWith('sb-'));
    authCookies.forEach((name) => request.cookies.delete(name));
    const signedOut = isProtected(path)
      ? redirectToLogin(request, path, 'You were signed out after 2 hours of inactivity. Please sign in again.')
      : NextResponse.next({ request });
    [...authCookies, IDLE_COOKIE].forEach((name) => signedOut.cookies.delete(name));
    return signedOut;
  }

  response.cookies.set(IDLE_COOKIE, `${sessionId}.${Date.now()}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return response;
}
