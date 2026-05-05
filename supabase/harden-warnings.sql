-- ===========================================================================
-- ExploreAll — addresses Supabase Security Advisor warnings.
-- Run once in the SQL editor.  Idempotent.
--
-- Covers (in this order):
--   1. is_email_verified — switch to SECURITY INVOKER, lock search_path.
--   2. bump_like_count / bump_comment_count / handle_new_user —
--      keep SECURITY DEFINER (they need to bypass RLS), but revoke EXECUTE
--      from anon/authenticated/public so callers can't invoke them via the
--      REST API. Triggers still execute them because they run as the table
--      owner. Lock search_path on each.
--   3. Storage public-bucket listing — drop the public SELECT policies on
--      storage.objects for avatars and post-images. Direct URL access still
--      works because the buckets have public=true; files are no longer
--      listable via the Storage API.
--
-- Two warnings remain that are dashboard-toggles, not SQL:
--   * Leaked Password Protection — Auth → Providers → Email → enable
--     "Leaked password protection" (uses HaveIBeenPwned).
--   * Extension in Public (citext) — see the optional "extensions schema"
--     section at the bottom; treat as advisory.
-- ===========================================================================


-- =====================================================================
-- 1.  is_email_verified  →  SECURITY INVOKER + locked search_path
-- =====================================================================
-- The function only reads the caller's JWT, so SECURITY INVOKER is safe and
-- removes the "callable by signed-in users" advisor warning. Locking
-- search_path silences "Function Search Path Mutable".
create or replace function public.is_email_verified()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
    (auth.jwt() ->> 'email_verified')::boolean,
    false
  );
$$;


-- =====================================================================
-- 2.  Counter triggers + new-user trigger
--    Keep SECURITY DEFINER (they MUST bypass RLS on posts/profiles),
--    but lock down EXECUTE so they can only run from the trigger context.
-- =====================================================================
create or replace function public.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return null;
end; $$;

create or replace function public.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end; $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username',
                                        split_part(new.email,'@',1)),
                                '[^a-z0-9_]', '', 'g'));
  if base is null or base = '' then base := 'traveler'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;
  insert into public.profiles (id, username, full_name)
  values (new.id, candidate, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Revoke EXECUTE from API roles. Triggers still run because they execute as
-- the table owner, not the calling user.
revoke execute on function public.is_email_verified()    from public, anon, authenticated;
revoke execute on function public.bump_like_count()      from public, anon, authenticated;
revoke execute on function public.bump_comment_count()   from public, anon, authenticated;
revoke execute on function public.handle_new_user()      from public, anon, authenticated;

-- Re-grant EXECUTE on is_email_verified to authenticated since RLS policies
-- call it. Without this, every policy that uses public.is_email_verified()
-- would silently fail for signed-in users.
grant execute on function public.is_email_verified() to authenticated;


-- =====================================================================
-- 3.  Storage: stop public-listing of bucket contents
-- =====================================================================
-- Direct URL access (https://...supabase.co/storage/v1/object/public/...)
-- still works because the buckets have public=true. Dropping these policies
-- only stops the database SELECT, which removes the "list all files" leak.

drop policy if exists "avatars read"      on storage.objects;
drop policy if exists "post-images read"  on storage.objects;


-- =====================================================================
-- OPTIONAL — move citext extension out of public
-- =====================================================================
-- This silences the "Extension in Public" warning. It moves the extension's
-- types into a separate `extensions` schema. The profiles.username column
-- (typed citext) keeps working because PostgreSQL stores type references by
-- OID, not name.
--
-- If anything in your app explicitly references `public.citext`, update it
-- after this runs. Comment out the block below if you'd rather skip it.

create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;
do $$
begin
  if exists (select 1 from pg_extension where extname = 'citext'
             and extnamespace = 'public'::regnamespace) then
    execute 'alter extension citext set schema extensions';
  end if;
end $$;
