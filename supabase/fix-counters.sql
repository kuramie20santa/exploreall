-- Fix: like_count and comment_count on posts stay at 0
-- Cause: counter triggers ran in the caller's RLS context. When user A likes
-- user B's post, the trigger tries to UPDATE that post, but the posts UPDATE
-- policy only allows the author to update — so the UPDATE silently affects
-- 0 rows.
-- Fix: re-create the trigger functions as SECURITY DEFINER so they run with
-- the function owner's privileges and bypass RLS. Then backfill existing rows.
--
-- Run this once in Supabase → SQL Editor. Idempotent.

-- LIKES counter
create or replace function public.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists likes_count_trg on public.likes;
create trigger likes_count_trg
after insert or delete on public.likes
for each row execute function public.bump_like_count();

-- COMMENTS counter
create or replace function public.bump_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end; $$;

drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg
after insert or delete on public.comments
for each row execute function public.bump_comment_count();

-- BACKFILL: recompute counters from actual data so the existing posts
-- (which were stuck at 0) show the right numbers right away.
update public.posts p set
  like_count = coalesce((select count(*)::int from public.likes l where l.post_id = p.id), 0),
  comment_count = coalesce((select count(*)::int from public.comments c where c.post_id = p.id and not c.is_deleted), 0);
