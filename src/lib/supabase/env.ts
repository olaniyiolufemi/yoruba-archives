export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export function assertSupabaseEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).');
  }
  // Sessions and research data travel to Supabase, so refuse plain HTTP outside local development.
  if (!/^https:\/\//.test(SUPABASE_URL) && !/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(SUPABASE_URL)) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use https:// (plain http is only allowed for localhost).');
  }
}
