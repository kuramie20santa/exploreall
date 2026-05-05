-- ===========================================================================
-- ExploreAll — final security-advisor cleanup.
-- Run AFTER harden-warnings.sql. Idempotent.
--
-- Targets the 4 remaining warnings:
--   1. is_email_verified — search_path warning persisted (likely the previous
--      run's CREATE OR REPLACE didn't bake the SET. Force a clean recreate.)
--   2. citext extension still in public — force the schema move.
--   3+4. rls_auto_enable — Supabase-managed function, but we still own it,
--      so we can revoke EXECUTE from anon/authenticated.
-- ===========================================================================


-- =====================================================================
-- 1.  is_email_verified — drop + recreate so SET clause is rebound
-- =====================================================================
-- The advisor reads pg_proc.proconfig to decide whether search_path is set.
-- A bare CREATE OR REPLACE sometimes doesn't refresh proconfig if the
-- previous version was created without it. Drop + recreate forces it.
-- We use plpgsql instead of sql to be belt-and-braces — both are valid,
-- but plpgsql functions always honor SET clauses.

drop function if exists public.is_email_verified() cascade;

create function public.is_email_verified()
returns boolean
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  return coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
    (auth.jwt() ->> 'email_verified')::boolean,
    false
  );
end;
$$;

-- DROP ... CASCADE wiped any RLS policies that referenced this function.
-- Re-create them. (Same definitions as supabase/harden.sql.)

drop policy if exists "posts insert author" on public.posts;
create policy "posts insert author" on public.posts
  for insert with check (
    auth.uid() = author_id
    and public.is_email_verified()
  );

drop policy if exists "comments insert author" on public.comments;
create policy "comments insert author" on public.comments
  for insert with check (
    auth.uid() = author_id
    and public.is_email_verified()
  );

drop policy if exists "likes write self" on public.likes;
create policy "likes write self" on public.likes
  for insert with check (
    auth.uid() = user_id
    and public.is_email_verified()
  );

drop policy if exists "saves write self" on public.saves;
create policy "saves write self" on public.saves
  for insert with check (
    auth.uid() = user_id
    and public.is_email_verified()
  );

drop policy if exists "post_images insert author" on public.post_images;
create policy "post_images insert author" on public.post_images
  for insert with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
    and public.is_email_verified()
  );

drop policy if exists "tags insert auth" on public.tags;
create policy "tags insert auth" on public.tags
  for insert with check (public.is_email_verified());

drop policy if exists "tags update auth" on public.tags;
create policy "tags update auth" on public.tags
  for update using (public.is_email_verified()) with check (public.is_email_verified());

drop policy if exists "reports insert auth" on public.reports;
create policy "reports insert auth" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and public.is_email_verified()
  );

drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_email_verified()
  );

drop policy if exists "post-images write own" on storage.objects;
create policy "post-images write own" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_email_verified()
  );

-- Lock the function down again
revoke execute on function public.is_email_verified() from public, anon;
grant  execute on function public.is_email_verified() to authenticated;


-- =====================================================================
-- 2.  citext — force the schema move
-- =====================================================================
-- Either the previous run's IF EXISTS guard skipped it, or the user
-- commented it out. Run unconditionally; will raise NOTICE rather than
-- ERROR if already moved.

create schema if not exists extensions;
grant usage on schema extensions to postgres, anon, authenticated, service_role;

do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on e.extnamespace = n.oid
  where e.extname = 'citext';

  if v_schema = 'public' then
    execute 'alter extension citext set schema extensions';
    raise notice 'Moved citext from public to extensions';
  elsif v_schema is null then
    raise notice 'citext extension not installed — nothing to move';
  else
    raise notice 'citext is in schema "%", no move needed', v_schema;
  end if;
end $$;


-- =====================================================================
-- 3.  rls_auto_enable — revoke EXECUTE
-- =====================================================================
-- This function was created automatically (likely by a Supabase migration
-- helper). We still own it, so we can lock it down. Skip silently if it
-- doesn't exist anymore.

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
    raise notice 'Revoked EXECUTE on public.rls_auto_enable from public/anon/authenticated';
  else
    raise notice 'public.rls_auto_enable() not found — nothing to do';
  end if;
exception
  when others then
    raise notice 'Could not revoke EXECUTE on rls_auto_enable: %', sqlerrm;
end $$;
