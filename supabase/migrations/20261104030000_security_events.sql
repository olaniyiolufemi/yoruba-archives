-- OWASP A09 (Logging & Alerting Failures): an append-only record of security
-- events (failed sign-ins, denied access, rate limits, rejected uploads and admin
-- actions). Rows are written by the API with the service role. Nobody can edit
-- or delete them through the API, including the service role: the trigger below
-- refuses every UPDATE and DELETE, so only the database owner could alter history.
create table public.security_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_type text not null check (char_length(event_type) between 1 and 60),
  -- The signed-in user the event is about, when known. Kept even if the account is deleted.
  user_id uuid,
  ip inet,
  user_agent text check (char_length(user_agent) <= 300),
  details jsonb not null default '{}'::jsonb
);

create index security_events_created_idx on public.security_events (created_at desc);
create index security_events_type_user_idx on public.security_events (event_type, user_id, created_at desc);
create index security_events_type_ip_idx on public.security_events (event_type, ip, created_at desc);

create or replace function public.security_events_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'security_events is append-only' using errcode = '42501';
end;
$$;

create trigger security_events_append_only
before update or delete on public.security_events
for each row execute function public.security_events_append_only();

create trigger security_events_no_truncate
before truncate on public.security_events
for each statement execute function public.security_events_append_only();

alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;
grant select on public.security_events to authenticated;

create policy "Admins read security events" on public.security_events
  for select to authenticated using ((select public.my_role()) = 'admin');
create policy "Second factor completed" on public.security_events
  as restrictive for all to authenticated using (not (select public.mfa_required()));
