-- =====================================================================
-- ExploreAll — Travel Community schema
-- Run in Supabase SQL editor in order. Idempotent where possible.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =====================================================================
-- COUNTRIES & CITIES (reference data)
-- =====================================================================
create table if not exists public.countries (
  code text primary key,                    -- ISO 3166-1 alpha-2, e.g. "JP"
  name text not null unique,
  capital text,
  continent text,
  flag_emoji text,
  best_time_to_visit text,
  travel_summary text,
  common_tips text[] default '{}',
  common_scams text[] default '{}',
  visa_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  name text not null,
  is_capital boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  unique (country_code, name)
);

create table if not exists public.safety_ratings (
  country_code text primary key references public.countries(code) on delete cascade,
  score numeric(3,1) not null check (score >= 0 and score <= 10),
  level text not null check (level in ('safe','mostly_safe','caution','high_risk','do_not_travel')),
  summary text,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- PROFILES (1:1 with auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique not null,
  full_name text,
  bio text,
  avatar_url text,
  home_country text references public.countries(code) on delete set null,
  travel_history text[] default '{}',       -- array of country codes
  is_private boolean not null default false,
  notify_email boolean not null default true,
  notify_comments boolean not null default true,
  notify_likes boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- POSTS, IMAGES, TAGS, COMMENTS, LIKES, SAVES
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 160),
  content text not null check (char_length(content) between 1 and 20000),
  country_code text references public.countries(code) on delete set null,
  city text,
  trip_start date,
  trip_end date,
  tags text[] default '{}',
  like_count int not null default 0,
  comment_count int not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_country_idx on public.posts (country_code);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_tags_idx on public.posts using gin (tags);

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null,                -- path inside the 'post-images' bucket
  url text not null,                         -- public url
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists post_images_post_idx on public.post_images (post_id, position);

create table if not exists public.tags (
  slug text primary key,
  label text not null,
  use_count int not null default 0
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 4000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Counter triggers — SECURITY DEFINER so they bypass RLS on posts.
-- Without security definer, when user A likes user B's post, the trigger's
-- UPDATE on posts is blocked by the posts-update RLS policy (author-only).
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

-- =====================================================================
-- REPORTS (moderation)
-- =====================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','user')),
  target_id uuid not null,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles       enable row level security;
alter table public.posts          enable row level security;
alter table public.post_images    enable row level security;
alter table public.comments       enable row level security;
alter table public.likes          enable row level security;
alter table public.saves          enable row level security;
alter table public.reports        enable row level security;
alter table public.countries      enable row level security;
alter table public.cities         enable row level security;
alter table public.safety_ratings enable row level security;
alter table public.tags           enable row level security;

-- Reference data: read-only public
drop policy if exists "countries readable" on public.countries;
create policy "countries readable" on public.countries for select using (true);
drop policy if exists "cities readable" on public.cities;
create policy "cities readable" on public.cities for select using (true);
drop policy if exists "safety readable" on public.safety_ratings;
create policy "safety readable" on public.safety_ratings for select using (true);
drop policy if exists "tags readable" on public.tags;
create policy "tags readable" on public.tags for select using (true);
drop policy if exists "tags insert auth" on public.tags;
create policy "tags insert auth" on public.tags
  for insert with check (auth.uid() is not null);
drop policy if exists "tags update auth" on public.tags;
create policy "tags update auth" on public.tags
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- Profiles
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles
  for select using (not is_private or id = auth.uid());
drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles insert self" on public.profiles;
create policy "profiles insert self" on public.profiles
  for insert with check (id = auth.uid());
drop policy if exists "profiles delete self" on public.profiles;
create policy "profiles delete self" on public.profiles
  for delete using (id = auth.uid());

-- Posts
drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts for select using (not is_deleted);
drop policy if exists "posts insert author" on public.posts;
create policy "posts insert author" on public.posts
  for insert with check (auth.uid() = author_id);
drop policy if exists "posts update author" on public.posts;
create policy "posts update author" on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "posts delete author" on public.posts;
create policy "posts delete author" on public.posts
  for delete using (auth.uid() = author_id);

-- Post images
drop policy if exists "post_images readable" on public.post_images;
create policy "post_images readable" on public.post_images for select using (true);
drop policy if exists "post_images insert author" on public.post_images;
create policy "post_images insert author" on public.post_images
  for insert with check (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );
drop policy if exists "post_images delete author" on public.post_images;
create policy "post_images delete author" on public.post_images
  for delete using (
    exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- Comments
drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments for select using (not is_deleted);
drop policy if exists "comments insert author" on public.comments;
create policy "comments insert author" on public.comments
  for insert with check (auth.uid() = author_id);
drop policy if exists "comments update author" on public.comments;
create policy "comments update author" on public.comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "comments delete author" on public.comments;
create policy "comments delete author" on public.comments
  for delete using (auth.uid() = author_id);

-- Likes / Saves: each user manages their own rows
drop policy if exists "likes readable" on public.likes;
create policy "likes readable" on public.likes for select using (true);
drop policy if exists "likes write self" on public.likes;
create policy "likes write self" on public.likes
  for insert with check (auth.uid() = user_id);
drop policy if exists "likes delete self" on public.likes;
create policy "likes delete self" on public.likes
  for delete using (auth.uid() = user_id);

drop policy if exists "saves readable self" on public.saves;
create policy "saves readable self" on public.saves
  for select using (auth.uid() = user_id);
drop policy if exists "saves write self" on public.saves;
create policy "saves write self" on public.saves
  for insert with check (auth.uid() = user_id);
drop policy if exists "saves delete self" on public.saves;
create policy "saves delete self" on public.saves
  for delete using (auth.uid() = user_id);

-- Reports: anyone authenticated can file; only reporter can read theirs
drop policy if exists "reports insert auth" on public.reports;
create policy "reports insert auth" on public.reports
  for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports read self" on public.reports;
create policy "reports read self" on public.reports
  for select using (auth.uid() = reporter_id);

-- =====================================================================
-- STORAGE: avatars (public) + post-images (public)
-- Run after creating buckets in Storage UI, or via the snippet below.
-- =====================================================================
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

drop policy if exists "avatars read" on storage.objects;
create policy "avatars read" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatars write own" on storage.objects;
create policy "avatars write own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects
  for delete using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "post-images read" on storage.objects;
create policy "post-images read" on storage.objects
  for select using (bucket_id = 'post-images');
drop policy if exists "post-images write own" on storage.objects;
create policy "post-images write own" on storage.objects
  for insert with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
drop policy if exists "post-images delete own" on storage.objects;
create policy "post-images delete own" on storage.objects
  for delete using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================================
-- SEED DATA — countries / safety / cities (placeholder, edit freely)
-- =====================================================================
insert into public.countries (code,name,capital,continent,flag_emoji,best_time_to_visit,travel_summary,common_tips,common_scams,visa_notes) values
('JP','Japan','Tokyo','Asia','🇯🇵','Mar–May, Sep–Nov',
  'Japan is widely regarded as one of the safest destinations in the world. Excellent infrastructure, low crime, and a culture of respect.',
  array['Carry cash — many places are still card-shy','Get a Suica/Pasmo IC card','Bow lightly when greeting'],
  array['Touts in nightlife districts (Kabukicho)','Overpriced taxis from unmarked drivers'],
  'Most Western passports get 90 days visa-free.'),
('IT','Italy','Rome','Europe','🇮🇹','Apr–Jun, Sep–Oct',
  'Italy is generally safe; biggest risk is petty theft in tourist hubs.',
  array['Validate train tickets before boarding','Carry small change for restrooms','Beware of fake "free" bracelets in Rome'],
  array['Pickpockets on Rome Metro Line A','Restaurant cover-charge surprises'],
  'Schengen — 90 days visa-free for many passports.'),
('TH','Thailand','Bangkok','Asia','🇹🇭','Nov–Feb',
  'Thailand is welcoming and easy to travel. Stay alert in nightlife and on rented scooters.',
  array['Use metered taxis or Grab','Dress modestly at temples','Drink bottled water'],
  array['Tuk-tuk gem-shop scam','Jet-ski "damage" scam in Phuket','Closed-temple scam'],
  'Most passports get 30 days visa-exempt entry.'),
('FR','France','Paris','Europe','🇫🇷','May–Jun, Sep',
  'France is safe overall. Petty theft is the main concern in Paris and on trains.',
  array['Keep bags zipped on the Métro','Validate regional train tickets','Tip is included but rounding up is nice'],
  array['Petition / ring-drop scams near the Eiffel Tower','Friendship-bracelet scam in Montmartre'],
  'Schengen — 90 days visa-free for many passports.'),
('US','United States','Washington, D.C.','North America','🇺🇸','varies by region',
  'The US is vast — safety varies enormously by city and neighborhood.',
  array['Tip 18–22% at restaurants','Rent a car outside major cities','Check state-specific rules'],
  array['Times Square costumed-character tips','Rideshare overcharges from non-app drivers'],
  'ESTA required for visa-waiver countries.'),
('MX','Mexico','Mexico City','North America','🇲🇽','Nov–Apr',
  'Tourist zones are generally safe; avoid certain regions and travel by day on highways.',
  array['Use Uber/Didi in CDMX','Drink bottled water','Carry small pesos for tips'],
  array['ATM skimmers','Taxi overcharging from the airport'],
  'Most passports get 180 days FMM permit.'),
('ID','Indonesia','Jakarta','Asia','🇮🇩','Apr–Oct (Bali)',
  'Indonesia is friendly to visitors. Watch traffic on scooters and be mindful at religious sites.',
  array['Helmet on every scooter ride','Carry cash for warungs','Respect ceremony processions'],
  array['Money-changer short-changing in Bali','Scooter "scratch" damage claims'],
  '30-day visa-on-arrival for many passports.'),
('PT','Portugal','Lisbon','Europe','🇵🇹','Apr–Jun, Sep–Oct',
  'Portugal is one of Europe''s safest countries.',
  array['Buy a Viva Viagem card in Lisbon','Try pastéis de nata everywhere','Validate train tickets'],
  array['Hashish street vendors in Lisbon (it''s fake)','Pickpockets on tram 28'],
  'Schengen — 90 days visa-free for many passports.'),
('IS','Iceland','Reykjavík','Europe','🇮🇸','Jun–Aug or Feb–Mar (auroras)',
  'Iceland is extremely safe; nature is the main hazard.',
  array['Check road.is before driving','Never turn your back on the ocean','Layer clothing always'],
  array['Rental-car gravel-damage charges'],
  'Schengen — 90 days visa-free for many passports.'),
('AU','Australia','Canberra','Oceania','🇦🇺','varies by region',
  'Australia is safe and well-organised. Respect wildlife, sun, and surf.',
  array['Slip-slop-slap sunscreen','Swim between the flags','Driving distances are huge'],
  array['Backpacker hostel deposit scams'],
  'eVisitor / ETA required for most passports.'),
('GR','Greece','Athens','Europe','🇬🇷','May–Jun, Sep',
  'Greece is safe for travelers; usual big-city pickpocket caution applies.',
  array['Ferry early in summer to avoid heat','Carry cash on islands','Try the local wine'],
  array['Taxi meter "broken" in Athens'],
  'Schengen — 90 days visa-free for many passports.'),
('VN','Vietnam','Hanoi','Asia','🇻🇳','Oct–Apr',
  'Vietnam is a friendly destination; watch traffic and bag-snatching in HCMC.',
  array['Cross the road slowly and steadily','Use Grab for taxis','Try egg coffee in Hanoi'],
  array['Drive-by bag snatching in HCMC','Shoeshine "free fix" scam'],
  'eVisa available for 80+ countries.')
on conflict (code) do nothing;

insert into public.safety_ratings (country_code, score, level, summary) values
('JP', 9.4, 'safe', 'Extremely low crime, excellent emergency services.'),
('IS', 9.6, 'safe', 'Among the safest countries on Earth.'),
('PT', 8.8, 'safe', 'Low violent crime, watch for pickpockets in Lisbon.'),
('IT', 7.6, 'mostly_safe', 'Petty theft in tourist zones; otherwise calm.'),
('FR', 7.2, 'mostly_safe', 'Pickpocketing in Paris is the main concern.'),
('GR', 7.8, 'mostly_safe', 'Generally calm; usual urban caution.'),
('TH', 7.0, 'mostly_safe', 'Watch nightlife and scooter rentals.'),
('AU', 8.6, 'safe', 'Very safe; nature is the main risk.'),
('US', 6.4, 'caution', 'Varies dramatically by city and neighborhood.'),
('MX', 5.8, 'caution', 'Tourist zones generally fine; check state advisories.'),
('ID', 7.2, 'mostly_safe', 'Friendly; scooter and surf hazards are real.'),
('VN', 7.0, 'mostly_safe', 'Friendly; bag-snatching in HCMC.')
on conflict (country_code) do update set
  score = excluded.score, level = excluded.level, summary = excluded.summary, updated_at = now();

insert into public.cities (country_code, name, is_capital) values
('JP','Tokyo',true),('JP','Kyoto',false),('JP','Osaka',false),('JP','Hokkaido',false),
('IT','Rome',true),('IT','Florence',false),('IT','Venice',false),('IT','Milan',false),
('TH','Bangkok',true),('TH','Chiang Mai',false),('TH','Phuket',false),
('FR','Paris',true),('FR','Nice',false),('FR','Lyon',false),
('US','Washington, D.C.',true),('US','New York',false),('US','San Francisco',false),('US','Los Angeles',false),
('MX','Mexico City',true),('MX','Oaxaca',false),('MX','Tulum',false),
('ID','Jakarta',true),('ID','Bali (Ubud)',false),('ID','Yogyakarta',false),
('PT','Lisbon',true),('PT','Porto',false),('PT','Sintra',false),
('IS','Reykjavík',true),('IS','Akureyri',false),
('AU','Canberra',true),('AU','Sydney',false),('AU','Melbourne',false),
('GR','Athens',true),('GR','Santorini',false),('GR','Crete',false),
('VN','Hanoi',true),('VN','Ho Chi Minh City',false),('VN','Da Nang',false)
on conflict (country_code, name) do nothing;

insert into public.tags (slug,label) values
('beach','Beach'),('food','Food'),('hiking','Hiking'),('city','City'),('budget','Budget'),
('luxury','Luxury'),('solo','Solo'),('family','Family'),('culture','Culture'),
('nightlife','Nightlife'),('roadtrip','Roadtrip'),('history','History'),('nature','Nature'),
('photography','Photography'),('adventure','Adventure')
on conflict (slug) do nothing;
