-- Anti-bot hardening — run this AFTER schema.sql.
--
-- This requires every write to the public timeline (posts, comments, likes,
-- saves, post_images, tags) to come from a user whose email has been verified
-- by Supabase Auth. Read access is unchanged.
--
-- Pair this with: Dashboard → Authentication → Providers → Email →
-- "Confirm email" = ENABLED.
--
-- Without that toggle on, signing up gives an instant session, email_verified
-- stays false until the user clicks the link, and these policies will block
-- their writes — exactly what we want for spam prevention.

-- Helper: does the current JWT belong to a verified user?
create or replace function public.is_email_verified()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
    (auth.jwt() ->> 'email_verified')::boolean,
    false
  );
$$;

-- POSTS
drop policy if exists "posts insert author" on public.posts;
create policy "posts insert author" on public.posts
  for insert with check (
    auth.uid() = author_id
    and public.is_email_verified()
  );

-- COMMENTS
drop policy if exists "comments insert author" on public.comments;
create policy "comments insert author" on public.comments
  for insert with check (
    auth.uid() = author_id
    and public.is_email_verified()
  );

-- LIKES
drop policy if exists "likes write self" on public.likes;
create policy "likes write self" on public.likes
  for insert with check (
    auth.uid() = user_id
    and public.is_email_verified()
  );

-- SAVES
drop policy if exists "saves write self" on public.saves;
create policy "saves write self" on public.saves
  for insert with check (
    auth.uid() = user_id
    and public.is_email_verified()
  );

-- POST IMAGES
drop policy if exists "post_images insert author" on public.post_images;
create policy "post_images insert author" on public.post_images
  for insert with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
    and public.is_email_verified()
  );

-- TAGS (custom user-defined)
drop policy if exists "tags insert auth" on public.tags;
create policy "tags insert auth" on public.tags
  for insert with check (public.is_email_verified());
drop policy if exists "tags update auth" on public.tags;
create policy "tags update auth" on public.tags
  for update using (public.is_email_verified()) with check (public.is_email_verified());

-- REPORTS
drop policy if exists "reports insert auth" on public.reports;
create policy "reports insert auth" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and public.is_email_verified()
  );

-- Storage: same gate on uploads
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
