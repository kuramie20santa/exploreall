import Link from "next/link";
import { Compass, Globe2, Home, PenSquare, User, Bookmark, LogIn } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "./ui/avatar";
import { SearchBox } from "./search-box";

export async function Nav() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let profile: { username: string; avatar_url: string | null; full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url, full_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  return (
    <>
      {/* Desktop top bar — hidden on mobile */}
      <header className="hidden md:block sticky top-0 z-40 glass border-b border-border/60">
        <div className="container flex h-14 items-center gap-4">
          <Link
            href="/"
            className="flex items-center font-display text-[17px] font-semibold tracking-tight shrink-0"
            aria-label="ExploreAll home"
          >
            ExploreAll<span className="text-rose-500">.eu</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-2">
            <NavLink href="/" icon={<Home className="h-4 w-4" />}>Home</NavLink>
            <NavLink href="/explore" icon={<Compass className="h-4 w-4" />}>Explore</NavLink>
            <NavLink href="/forum" icon={<Globe2 className="h-4 w-4" />}>Forum</NavLink>
          </nav>

          <div className="flex-1 max-w-xl mx-auto">
            <SearchBox />
          </div>

          <div className="flex items-center gap-1">
            <Link
              href="/create"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition press"
            >
              <PenSquare className="h-4 w-4" /> Post
            </Link>
            <Link href="/saved" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition press" aria-label="Saved">
              <Bookmark className="h-[18px] w-[18px]" />
            </Link>
            <ThemeToggle />
            {profile ? (
              <Link href={`/profile/${profile.username}`} className="ml-1" aria-label="Profile">
                <Avatar url={profile.avatar_url} name={profile.full_name || profile.username} size={32} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full hairline text-sm hover:bg-muted transition"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile floating theme toggle (top-right) */}
      <div className="md:hidden fixed top-3 right-3 z-50">
        <div className="glass hairline rounded-full shadow-soft">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile bottom dock */}
      <nav
        className="md:hidden fixed bottom-3 inset-x-3 z-50 animate-slideUp"
        aria-label="Primary navigation"
      >
        <div className="glass hairline rounded-full shadow-glow flex items-center justify-around h-14 px-2">
          <MobileNav href="/" icon={<Home className="h-5 w-5" />} label="Home" />
          <MobileNav href="/explore" icon={<Compass className="h-5 w-5" />} label="Explore" />
          <MobileNav href="/create" icon={<PenSquare className="h-5 w-5" />} label="Post" />
          <MobileNav href="/forum" icon={<Globe2 className="h-5 w-5" />} label="Forum" />
          {profile ? (
            <MobileNav
              href={`/profile/${profile.username}`}
              icon={
                <Avatar
                  url={profile.avatar_url}
                  name={profile.full_name || profile.username}
                  size={22}
                />
              }
              label="You"
            />
          ) : (
            <MobileNav href="/login" icon={<LogIn className="h-5 w-5" />} label="Sign in" />
          )}
        </div>
      </nav>
    </>
  );
}

function NavLink({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
    >
      {icon} {children}
    </Link>
  );
}

function MobileNav({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center text-[10px] font-medium text-muted-foreground hover:text-foreground gap-0.5 px-3 py-1 press transition"
    >
      {icon}
      {label}
    </Link>
  );
}
