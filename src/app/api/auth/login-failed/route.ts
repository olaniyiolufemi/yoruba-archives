import { readJson } from '@/lib/api';
import { logSecurityEvent } from '@/lib/audit';
import { isDemoMode } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';

// Sign-in runs in the browser against Supabase Auth, so the sign-in pages report
// failures here for the security log and alerts. Supabase keeps its own auth logs
// too; this copy is what lets the app spot repeated failures and alert admins.
export async function POST(request: Request) {
  if (isDemoMode()) return new Response(null, { status: 204 });
  const body = await readJson(request);

  if (body.stage === 'code') {
    // Wrong authenticator code: the password step already passed, so the user id
    // comes from the verified session rather than from the request body.
    const { data } = await (await createClient()).auth.getClaims();
    const userId = data?.claims?.sub;
    if (userId) await logSecurityEvent('login_failed', { userId, details: { stage: 'code' } });
    return new Response(null, { status: 204 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : '';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await logSecurityEvent('login_failed', { details: { stage: 'password', email }, alertKey: { field: 'email', value: email } });
  }
  return new Response(null, { status: 204 });
}
