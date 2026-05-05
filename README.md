# ExploreAll — modern travel community

A clean, Apple-style travel forum built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase** (auth, Postgres, storage, RLS).

Light + dark mode, mobile-first, real auth, image uploads, likes/comments/saves, country safety pages, search & filtering — all production-ready.

---

## 1. Project plan

### Pages
| Route | Purpose |
|---|---|
| `/` | Landing — hero, trending stories, popular countries |
| `/explore` | Browse all countries + search across countries, cities, posts |
| `/country/[code]` | Country profile: safety score, tips, scams, capital, cities, stories |
| `/forum` | Public feed with filters: recent / popular, country, tag, free-text search |
| `/forum/[id]` | Post detail with images, like/save/share/delete, comments, related posts |
| `/create` | Create post (title, story, country, city, dates, tags, up to 8 photos) |
| `/profile/[username]` | Profile: avatar, bio, home country, travel history, posts |
| `/settings` | Edit profile + account (email/password), photo upload, privacy, notifications, delete |
| `/login`, `/signup` | Auth + password reset |
| `/saved` | Bookmarked posts (auth required) |
| `/auth/callback` | Email confirmation / password-reset handler |

### Component structure (`src/components`)
- `nav.tsx` — sticky top bar + mobile bottom dock, async server component (reads session)
- `theme-provider.tsx`, `theme-toggle.tsx` — light/dark via `next-themes`, system default
- `search-box.tsx` — global search → `/explore?q=`
- `post-card.tsx` — card used on home, forum, profile, country, saved
- `post-actions.tsx` — like / save / share / delete (client; updates RLS-backed tables)
- `comments.tsx` — list + post + delete-own (client)
- `ui/` — `button`, `input` (+ `Textarea`, `Label`), `card` (+ `Badge`), `avatar`

### Design system
Apple-flavored: rounded-3xl cards, hairline 1px borders, soft shadows, glass nav, generous spacing, SF-style display font stack, subtle radial-gradient hero. CSS variables drive both themes from `globals.css`; Tailwind tokens map to them.

---

## 2. Database schema

All defined in [`supabase/schema.sql`](supabase/schema.sql). Tables:

| Table | Purpose |
|---|---|
| `countries` | Reference data: capital, continent, flag, summary, tips, scams, visa notes |
| `cities` | Cities under a country (capital flag + description) |
| `safety_ratings` | Score (0–10) + level (`safe…do_not_travel`) + summary, 1:1 with country |
| `profiles` | 1:1 with `auth.users`. Username, bio, avatar, home, travel history, prefs |
| `posts` | Travel posts: title, content, country, city, trip dates, tags, counters, soft-delete |
| `post_images` | Public-URL images linked to a post (ordered) |
| `comments` | Threadable (`parent_id`), soft-delete |
| `likes` | (user_id, post_id) PK; trigger keeps `posts.like_count` in sync |
| `saves` | (user_id, post_id) PK — user-private |
| `tags` | Curated tag list with `use_count` |
| `reports` | Moderation queue — `target_type` of `post`/`comment`/`user`, status flow |

Triggers:
- `handle_new_user` — auto-creates a profile (with unique username) on `auth.users` insert
- `bump_like_count`, `bump_comment_count` — denormalized counters

### Row Level Security (highlights)
- Reference data (`countries`, `cities`, `safety_ratings`, `tags`) — public read.
- `profiles` — public read unless `is_private`; user can only update/delete their own.
- `posts`, `comments` — public read (when not soft-deleted); user writes only their own.
- `post_images` — only the post's author can insert/delete; public read.
- `likes` — public read (for counts), only user can write/delete own row.
- `saves` — fully private to the user.
- `reports` — anyone authenticated can file, only reporter can read theirs.
- Storage `avatars` and `post-images` buckets — public read; users can write only inside `auth.uid()/...` prefix.

---

## 3. Setup (5 minutes)

### a) Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Once ready, open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   - Creates tables, RLS policies, two storage buckets (`avatars`, `post-images`), the auto-profile trigger, and seeds 12 countries with rich travel data + safety ratings + cities + tags.
3. **Run [`supabase/all-countries.sql`](supabase/all-countries.sql)** in a new SQL query.
   - Adds the remaining 230+ ISO 3166-1 countries and territories (basic info only — flag, capital, continent). Idempotent: leaves your seeded rich rows untouched.
4. **Run [`supabase/harden.sql`](supabase/harden.sql)** — adds RLS policies that require `email_verified` for any write (posts, comments, likes, saves, uploads). This is what stops bot signups from polluting your forum.
4b. **Run [`supabase/harden-warnings.sql`](supabase/harden-warnings.sql)** — clears Supabase Security Advisor warnings (function search_path, public EXECUTE on SECURITY DEFINER triggers, public bucket listing). Idempotent. Optional but recommended.
4c. **Dashboard toggle** — Authentication → Providers → Email → enable **"Leaked password protection"** (uses HaveIBeenPwned to refuse compromised passwords at signup). One click, no SQL.
5. **Authentication → Providers → Email**: turn **Confirm email = ON**. With `harden.sql` applied, unconfirmed users can browse but cannot post, like, or upload anything until they click the link in their inbox.
6. **Authentication → URL Configuration**: add `http://localhost:3000` (dev) and your production URL to the allowed redirect URLs.
7. **Authentication → Email Templates**: replace `{{ .SiteURL }}` references with your site URL if needed.

### Anti-bot defenses (already wired up)
1. **Email confirmation** — Supabase setting above + `harden.sql` enforce that no row gets written to `posts` / `comments` / `likes` / `saves` / `post_images` / storage buckets unless the JWT carries `email_verified = true`.
2. **Disposable-email blocklist** — [src/lib/validate.ts](src/lib/validate.ts) refuses ~250 temp-mail domains client-side at signup. Edit that file to grow or shrink the list.
3. **Pattern checks** — strict email regex, blocks `gmail+tag` aliases, blocks reserved usernames (admin, support, …), enforces 10+ char passwords with mixed character classes, blocks the top common passwords.
4. **Honeypot field** + **time-on-page check** — the signup form has an invisible "Website" input bots tend to fill; humans can't see it. Submissions in <2 s are also rejected as automated.
5. **Verify-email banner** — [src/components/verify-email-banner.tsx](src/components/verify-email-banner.tsx) shows a reminder on every page until the email is confirmed.

For higher-traffic sites also enable: Supabase **Auth → Rate limits** (default 30 signups/hour/IP), Cloudflare Turnstile / hCaptcha (drop-in via Supabase), and `auth.users` cleanup of `email_confirmed_at IS NULL` rows older than 7 days.

### b) Local
```bash
cp .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
# Supabase → Project Settings → API.

npm install
npm run dev
```
Open <http://localhost:3000>.

### c) First user
- Visit `/signup`. If you've turned off email confirmation in Supabase, you're logged in immediately. Otherwise click the link in your inbox — it returns to `/auth/callback`.
- A `profiles` row is created automatically with a unique username.

---

## 4. Tech stack
- **Next.js 14** App Router, React Server Components, server actions for mutations where possible
- **Supabase** with `@supabase/ssr` for cookie-based session sync between RSC + middleware + client
- **Tailwind CSS** with CSS variable–driven theme
- **next-themes** for system/light/dark toggle
- **lucide-react** icons

### Auth model
- `src/middleware.ts` runs on every request, refreshes the Supabase session cookie.
- Server components read the user via `createClient()` from `src/lib/supabase/server.ts`.
- Client components use `createClient()` from `src/lib/supabase/client.ts`.
- `/auth/callback` handles confirmation links and password-reset redirects.

### File uploads
- Avatars → bucket `avatars`, path `{userId}/avatar-...`
- Post images → bucket `post-images`, path `{userId}/{postId}/{i}-...`
- Both buckets are public-read; write is restricted by storage RLS to the user's own folder.

---

## 5. Moderation-ready architecture
- `posts.is_deleted` and `comments.is_deleted` flags + RLS hide soft-deleted rows from feeds while keeping them auditable.
- `reports` table is wired up at the schema level; you can add a `/admin` route later that uses a Supabase service role to triage.

To add a "Report post" button later, insert into `reports` with `target_type='post', target_id=<post.id>`.

---

## 6. Extending
- **Real safety data**: replace placeholder rows in `safety_ratings` and `countries.common_*` with sourced data (e.g. UK FCDO / US State Department). Schema is already final.
- **Real-time**: Supabase realtime subscriptions on `comments` / `likes` channels for live updates.
- **Server actions**: convert client mutations in `post-actions.tsx` and `comments.tsx` to server actions if you prefer.
- **Feature flags / experiments**: add a `feature_flags` table; gate components behind a server util.
- **Followers / DMs / notifications**: add `follows` table, `notifications` table; wire to existing triggers.

---

## 7. Scripts
| Command | What |
|---|---|
| `npm run dev` | Local dev on `:3000` |
| `npm run build` | Production build |
| `npm run start` | Run built app |
| `npm run typecheck` | TS check |
| `npm run lint` | Next lint |

---

## 8. File map

```
forum/
├── package.json, tsconfig.json, next.config.js, tailwind.config.ts, postcss.config.js
├── .env.local.example
├── supabase/schema.sql            # full schema + RLS + storage policies + seed data
└── src/
    ├── middleware.ts              # refreshes Supabase session cookie
    ├── lib/
    │   ├── supabase/{client,server,middleware}.ts
    │   ├── types.ts               # Profile, Post, PostWithMeta, Comment, Country, …
    │   └── utils.ts               # cn, formatDate, timeAgo, safetyColor/Label
    ├── components/
    │   ├── nav.tsx, search-box.tsx, theme-provider.tsx, theme-toggle.tsx
    │   ├── post-card.tsx, post-actions.tsx, comments.tsx
    │   └── ui/{button,input,card,avatar}.tsx
    └── app/
        ├── layout.tsx, page.tsx, globals.css, not-found.tsx
        ├── auth/callback/route.ts
        ├── login/{page,form}.tsx
        ├── signup/{page,form}.tsx
        ├── settings/{page,form}.tsx
        ├── create/{page,form}.tsx
        ├── explore/page.tsx
        ├── forum/page.tsx
        ├── forum/[id]/page.tsx
        ├── country/[code]/page.tsx
        ├── profile/[username]/page.tsx
        └── saved/page.tsx
```

That's it — `npm install && npm run dev`, paste the SQL once, drop in your Supabase keys, and you have a working travel community.
