-- OWASP A07 (Authentication Failures): once someone turns on an authenticator
-- app, a password alone is no longer enough. Until the session is upgraded to
-- aal2 with a one-time code, RLS hides their data, the app treats them as
-- signed out, and the API refuses their writes. People without a verified factor
-- are unaffected.

-- True when the current session still needs its second factor. Reads the
-- factor list from auth.mfa_factors, never from the client's session cookie.
create or replace function public.mfa_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2'
    and exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    );
$$;

revoke execute on function public.mfa_required() from public, anon;
grant execute on function public.mfa_required() to authenticated;

-- Restrictive policies are ANDed with the existing ones, so they only narrow access.
create policy "Second factor completed" on public.profiles
  as restrictive for all to authenticated using (not (select public.mfa_required()));
create policy "Second factor completed" on public.research_submissions
  as restrictive for all to authenticated using (not (select public.mfa_required()));
create policy "Second factor completed" on public.peer_reviews
  as restrictive for all to authenticated using (not (select public.mfa_required()));
create policy "Second factor completed" on public.notifications
  as restrictive for all to authenticated using (not (select public.mfa_required()));
create policy "Second factor completed" on public.content_flags
  as restrictive for all to authenticated using (not (select public.mfa_required()));
create policy "Second factor completed" on storage.objects
  as restrictive for insert to authenticated with check (not (select public.mfa_required()));
