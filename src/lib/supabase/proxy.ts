import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { DEMO_COOKIE, readDemoSession } from '../demo-session';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

const PROTECTED = ['/dashboard', '/review', '/admin', '/notifications'];

/** Refreshes the auth cookie on every request and bounces signed-out visitors. */
function redirectToLogin(request: NextRequest, path: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
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
  const signedIn = Boolean(data?.claims?.sub);
  return !signedIn && isProtected(path) ? redirectToLogin(request, path) : response;
}
