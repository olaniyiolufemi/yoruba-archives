-- Yoruba Archives — initial schema (Chapter 4, Figure 4.3 ERD)
-- USER (profiles) 1─* RESEARCH_SUBMISSION *─1 CATEGORY
-- RESEARCH_SUBMISSION 1─* PEER_REVIEW, plus NOTIFICATION and CONTENT_FLAG.
-- Passwords live in Supabase Auth (auth.users), so profiles carries no password_hash.

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type public.user_role as enum ('researcher', 'public', 'reviewer', 'admin');
create type public.submission_status as enum ('pending', 'verified', 'rejected', 'revision_requested');
create type public.review_decision as enum ('verified', 'rejected', 'revision_requested');
create type public.submission_language as enum ('yoruba', 'english', 'both');
create type public.flag_status as enum ('open', 'dismissed', 'actioned');

-- ─── Tables ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'researcher',
  institution text,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  description text,
  created_at timestamptz not null default now()
);

create table public.research_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  assigned_reviewer_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 3 and 300),
  abstract text not null check (char_length(abstract) between 20 and 5000),
  keywords text[] not null default '{}',
  language public.submission_language not null,
  -- Path of the file inside the private "research-files" bucket (ERD: file_url).
  file_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('application/pdf', 'image/jpeg')),
  status public.submission_status not null default 'pending',
  -- Permanent public slug, issued when the submission is verified (FR6).
  public_link text unique,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  -- Diacritic-free, lower-cased title + abstract + keywords, kept by trigger.
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.peer_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.research_submissions (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision public.review_decision not null,
  authorship_check boolean not null default false,
  source_check boolean not null default false,
  cultural_relevance_check boolean not null default false,
  sensitivity_check boolean not null default false,
  comments text,
  reviewed_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  submission_id uuid references public.research_submissions (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.content_flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.research_submissions (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status public.flag_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Search normalisation ────────────────────────────────────────────────────
-- Yoruba text carries tone marks and under-dots (ẹ̀, ọ́, ṣ). NFKD splits them into
-- base letter + combining mark; stripping the marks lets "orisa" match "òrìṣà".
create or replace function public.normalize_search(input text)
returns text
language sql
immutable
parallel safe
as $$
  select lower(regexp_replace(normalize(coalesce(input, ''), NFKD), '[̀-ͯ]', '', 'g'));
$$;

create or replace function public.research_submissions_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := public.normalize_search(
    new.title || ' ' || new.abstract || ' ' || array_to_string(new.keywords, ' ')
  );
  new.updated_at := now();
  return new;
end;
$$;

create trigger research_submissions_before_write
before insert or update on public.research_submissions
for each row execute function public.research_submissions_before_write();

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create extension if not exists pg_trgm with schema extensions;

create index research_submissions_status_idx on public.research_submissions (status);
create index research_submissions_category_idx on public.research_submissions (category_id);
create index research_submissions_user_idx on public.research_submissions (user_id);
create index research_submissions_reviewer_idx on public.research_submissions (assigned_reviewer_id, status);
create index research_submissions_verified_at_idx on public.research_submissions (verified_at desc) where status = 'verified';
create index research_submissions_search_idx on public.research_submissions using gin (search_text extensions.gin_trgm_ops);
create index peer_reviews_submission_idx on public.peer_reviews (submission_id, reviewed_at desc);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index content_flags_status_idx on public.content_flags (status, created_at desc);

-- ─── New auth user → profile ─────────────────────────────────────────────────
-- Self-registration may only choose researcher or public; reviewer/admin are
-- granted by an administrator (FR8).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role, institution)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data ->> 'role' = 'public'
      then 'public'::public.user_role
      else 'researcher'::public.user_role
    end,
    nullif(trim(new.raw_user_meta_data ->> 'institution'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ─── Helpers ─────────────────────────────────────────────────────────────────
create or replace function public.my_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Designated reviewer (FR3): the reviewer with the fewest pending assignments,
-- never the author. Returns null when no reviewer exists yet.
create or replace function public.pick_reviewer(p_author uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  left join public.research_submissions s
    on s.assigned_reviewer_id = p.id and s.status = 'pending'
  where p.role = 'reviewer' and p.id <> p_author
  group by p.id, p.created_at
  order by count(s.id) asc, p.created_at asc
  limit 1;
$$;

-- Records a review decision and moves the submission to its new state in one
-- transaction (FR4, FR6). Authorisation is checked by the API before calling.
create or replace function public.record_review(
  p_submission uuid,
  p_reviewer uuid,
  p_decision public.review_decision,
  p_authorship boolean,
  p_source boolean,
  p_cultural boolean,
  p_sensitivity boolean,
  p_comments text,
  p_public_link text
)
returns public.research_submissions
language plpgsql
security definer
set search_path = ''
as $$
declare
  sub public.research_submissions;
begin
  select * into sub from public.research_submissions where id = p_submission for update;
  if not found then
    raise exception 'Submission not found' using errcode = 'P0002';
  end if;
  if sub.status <> 'pending' then
    raise exception 'Only pending submissions can be reviewed' using errcode = 'P0001';
  end if;
  if p_decision = 'verified' and not (p_authorship and p_source and p_cultural and p_sensitivity) then
    raise exception 'All checklist items must pass before approval' using errcode = 'P0001';
  end if;
  if p_decision <> 'verified' and coalesce(trim(p_comments), '') = '' then
    raise exception 'Comments are required when rejecting or requesting revision' using errcode = 'P0001';
  end if;

  insert into public.peer_reviews (
    submission_id, reviewer_id, decision,
    authorship_check, source_check, cultural_relevance_check, sensitivity_check, comments
  ) values (
    p_submission, p_reviewer, p_decision,
    p_authorship, p_source, p_cultural, p_sensitivity, nullif(trim(p_comments), '')
  );

  update public.research_submissions
  set status = p_decision::text::public.submission_status,
      public_link = case when p_decision = 'verified' then coalesce(public_link, p_public_link) else public_link end,
      verified_at = case when p_decision = 'verified' then now() else verified_at end,
      verified_by = case when p_decision = 'verified' then p_reviewer else verified_by end
  where id = p_submission
  returning * into sub;

  return sub;
end;
$$;

-- Public search over verified content only (FR7). Keyword terms are ANDed and
-- matched diacritic-insensitively; filtering by Yoruba or English also returns
-- bilingual items.
create or replace function public.search_research(
  q text default null,
  p_category uuid default null,
  p_language public.submission_language default null,
  p_from date default null,
  p_to date default null,
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  abstract text,
  keywords text[],
  language public.submission_language,
  public_link text,
  verified_at timestamptz,
  category_id uuid,
  category_name text,
  author_name text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with terms as (
    select t
    from unnest(string_to_array(public.normalize_search(q), ' ')) as t
    where t <> ''
  ),
  matches as (
    select s.*
    from public.research_submissions s
    where s.status = 'verified'
      and (p_category is null or s.category_id = p_category)
      and (
        p_language is null
        or s.language = p_language
        or (p_language <> 'both' and s.language = 'both')
      )
      and (p_from is null or s.verified_at >= p_from)
      and (p_to is null or s.verified_at < p_to + 1)
      and not exists (
        select 1 from terms where s.search_text not like '%' || terms.t || '%'
      )
  )
  select
    m.id, m.title, m.abstract, m.keywords, m.language, m.public_link, m.verified_at,
    m.category_id, c.name, p.full_name,
    count(*) over () as total_count
  from matches m
  join public.categories c on c.id = m.category_id
  join public.profiles p on p.id = m.user_id
  order by
    (q is not null and public.normalize_search(m.title) like '%' || public.normalize_search(q) || '%') desc,
    m.verified_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.pick_reviewer(uuid) from public, anon, authenticated;
revoke execute on function public.record_review(uuid, uuid, public.review_decision, boolean, boolean, boolean, boolean, text, text) from public, anon, authenticated;
grant execute on function public.search_research(text, uuid, public.submission_language, date, date, integer, integer) to anon, authenticated;

-- ─── Row Level Security (NFR4) ───────────────────────────────────────────────
-- Reads go through RLS with the visitor's session. Every write goes through the
-- API layer, which authorises the request and uses the service role.
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.research_submissions enable row level security;
alter table public.peer_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.content_flags enable row level security;

-- Author names are public (they appear on verified research); emails are not.
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, role, institution, created_at) on public.profiles to anon, authenticated;
create policy "Profiles are publicly readable" on public.profiles
  for select to anon, authenticated using (true);

create policy "Categories are publicly readable" on public.categories
  for select to anon, authenticated using (true);

create policy "Verified research is public; drafts visible to author, reviewer, admin"
  on public.research_submissions for select to anon, authenticated
  using (
    status = 'verified'
    or user_id = (select auth.uid())
    or assigned_reviewer_id = (select auth.uid())
    or (select public.my_role()) = 'admin'
  );

create policy "Reviews visible to author, reviewer and admin" on public.peer_reviews
  for select to authenticated
  using (
    reviewer_id = (select auth.uid())
    or (select public.my_role()) = 'admin'
    or exists (
      select 1 from public.research_submissions s
      where s.id = submission_id
        and (s.user_id = (select auth.uid()) or s.assigned_reviewer_id = (select auth.uid()))
    )
  );

create policy "Users read their own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
revoke update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;
create policy "Users mark their own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Admins read flags" on public.content_flags
  for select to authenticated using ((select public.my_role()) = 'admin');

-- ─── File storage (private bucket, PDF/JPEG only) ────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('research-files', 'research-files', false, 20971520, array['application/pdf', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Contributors upload into a folder named after their own user id. Downloads
-- are served through short-lived signed URLs issued by the API.
create policy "Contributors upload to their own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'research-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.my_role()) in ('researcher', 'reviewer', 'admin')
  );
