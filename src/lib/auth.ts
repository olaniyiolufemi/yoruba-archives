import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
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

/** The signed-in user and their profile, or null. Memoised per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (isDemoMode()) return getDemoViewer();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, institution')
    .eq('id', claims.sub)
    .maybeSingle();
  if (!profile) return null;

  return { ...profile, email: typeof claims.email === 'string' ? claims.email : '' } as Viewer;
});

/** For pages: redirects to sign-in, or home when the role is not allowed. */
export async function requireViewer(roles?: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  if (roles && !roles.includes(viewer.role)) redirect('/');
  return viewer;
}

export const canContribute = (role: Role) => role !== 'public';
