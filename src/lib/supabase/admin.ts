import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, assertSupabaseEnv } from './env';

/**
 * Service-role client for the API layer. It bypasses RLS, so only call it after
 * the route has authenticated the user and checked their role.
 */
export function createAdminClient() {
  assertSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY (see .env.example).');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
