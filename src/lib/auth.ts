import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { logSecurityEvent } from './audit';
import { getDemoViewer } from './demo-auth';
import { isDemoMode } from './demo-data';
import { createClient } from './supabase/server';
import type { Role } from './constants';

export type Viewer = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  institution: string | null;
};

type Session = { viewer: Viewer | null; mfaPending: boolean };

/**
 * The signed-in user and whether they still owe their second factor. Someone
 * who has entered their password but not their authenticator code counts as
 * signed out everywhere. Memoised per request.
 */
const getSession = cache(async (): Promise<Session> => {
  if (isDemoMode()) return { viewer: await getDemoViewer(), mfaPending: false };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { viewer: null, mfaPending: false };

  const [{ data: profile }, { data: mfaRequired, error: mfaError }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, institution').eq('id', claims.sub).maybeSingle(),
    supabase.rpc('mfa_required'),
  ]);
  // Fail closed: if the check itself fails, treat the second factor as still owed.
  if (mfaError || mfaRequired !== false) return { viewer: null, mfaPending: true };
  if (!profile) return { viewer: null, mfaPending: false };

  return {
    viewer: { ...profile, email: typeof claims.email === 'string' ? claims.email : '' } as Viewer,
    mfaPending: false,
  };
});

/** The signed-in user and their profile, or null. Memoised per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => (await getSession()).viewer);

/** True when the visitor signed in with a password but has not entered their authenticator code yet. */
export const isMfaPending = cache(async (): Promise<boolean> => (await getSession()).mfaPending);

// A layout and its page can both check the role, so log each denied request once.
const logPageDenied = cache((userId: string, role: Role, required: string) =>
  logSecurityEvent('access_denied', { userId, details: { role, required: required.split(','), page: true } }),
);

/** For pages: redirects to sign-in, or home when the role is not allowed. */
export async function requireViewer(roles?: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect((await isMfaPending()) ? '/login/mfa' : '/login');
  if (roles && !roles.includes(viewer.role)) {
    await logPageDenied(viewer.id, viewer.role, roles.join(','));
    redirect('/');
  }
  return viewer;
}

export const canContribute = (role: Role) => role !== 'public';
