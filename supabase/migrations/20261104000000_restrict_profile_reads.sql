-- OWASP A01 (Broken Access Control): profiles were readable by anyone holding
-- the public anon key, which listed every account's name, role and institution.
-- A profile is now visible only to its owner, to admins, and to people who can
-- already see a submission or review that person is attached to. The
-- research_submissions and peer_reviews subqueries run under their own RLS, so
-- this never widens what a visitor could reach before.
drop policy "Profiles are publicly readable" on public.profiles;

create policy "Profiles visible to self, admins and connected visitors" on public.profiles
  for select to anon, authenticated
  using (
    id = (select auth.uid())
    or (select public.my_role()) = 'admin'
    or exists (
      select 1 from public.research_submissions s
      where profiles.id in (s.user_id, s.assigned_reviewer_id, s.verified_by)
    )
    or exists (
      select 1 from public.peer_reviews r
      where r.reviewer_id = profiles.id
    )
  );

create index if not exists research_submissions_verified_by_idx on public.research_submissions (verified_by);
create index if not exists peer_reviews_reviewer_idx on public.peer_reviews (reviewer_id);
