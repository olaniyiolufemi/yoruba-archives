-- OWASP A05 (Injection / input validation): sign-up metadata comes straight from
-- the browser, so the profile trigger now trims and caps it, and the table
-- rejects oversized values written any other way. NOT VALID keeps existing rows
-- untouched while every new insert or update is checked.
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
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120),
    new.email,
    case when new.raw_user_meta_data ->> 'role' = 'public'
      then 'public'::public.user_role
      else 'researcher'::public.user_role
    end,
    left(nullif(trim(new.raw_user_meta_data ->> 'institution'), ''), 200)
  );
  return new;
end;
$$;

alter table public.profiles
  add constraint profiles_full_name_length check (char_length(full_name) between 1 and 120) not valid,
  add constraint profiles_institution_length check (institution is null or char_length(institution) <= 200) not valid;
