import { AuthLink } from "@/components/common/AuthLink";
import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Flame,
  LayoutDashboard,
  GraduationCap,
  FolderGit2,
  Users,
  Trophy,
  Search,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Route as RouteIcon,
  Brain,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useLearner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/review", label: "Review", icon: Brain },
  { to: "/paths", label: "Career paths", icon: RouteIcon },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/community", label: "Community", icon: Users },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

const mobileNav = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/projects", label: "Projects", icon: FolderGit2 },
  { to: "/community", label: "Community", icon: Users },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function Wordmark({ tone = "ink" }: { tone?: "ink" | "light" }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-brand text-brand-foreground">
        <span className="font-display text-sm font-bold">A</span>
      </span>
      <span
        className={cn(
          "font-display text-[17px] font-bold tracking-tight",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        Ascent
      </span>
    </Link>
  );
}

function initialsOf(name?: string | null) {
  if (!name) return "AS";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function AppHeader() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Wordmark />

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-chalk hover:bg-secondary hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/learn"
            search={{ focus: true }}
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-chalk transition-colors hover:border-brand/40 hover:text-foreground md:flex"
          >
            <Search className="size-4" />
            <span className="pr-6">Search courses</span>
          </Link>

          {user ? (
            <>
              <span className="hidden items-center gap-1.5 rounded-full bg-ember/10 px-3 py-1.5 text-sm font-bold text-ember sm:flex">
                <Flame className="size-4" />
                {profile?.streak_current ?? 0}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Account menu">
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-ink text-xs font-bold text-white">
                        {initialsOf(profile?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-semibold">{profile?.display_name ?? "Learner"}</div>
                    <div className="text-xs font-normal text-chalk">
                      Level {profile?.level ?? 1} · {profile?.xp ?? 0} XP
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile & portfolio</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing">Plan & billing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={signOut}>
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <AuthLink mode="login">Log in</AuthLink>
              </Button>
              <Button asChild size="sm">
                <AuthLink mode="signup">Start free</AuthLink>
              </Button>
            </div>
          )}

          <button
            className="grid size-11 place-items-center rounded-full text-chalk lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="border-t border-border bg-card px-4 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                  active ? "text-brand" : "text-chalk",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children, bare }: { children: ReactNode; bare?: boolean }) {
  return (
    <div className="min-h-screen bg-canvas">
      <AppHeader />
      <main className={cn(bare ? "" : "mx-auto max-w-[1400px] px-4 pb-28 pt-8 sm:px-6 md:pb-16")}>
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
