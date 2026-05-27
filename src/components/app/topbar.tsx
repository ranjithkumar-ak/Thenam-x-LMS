import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Command,
  History,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Settings2,
  Sparkles,
  Sun,
  UserCircle2,
  LogOut,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
import { useRole, ROLES, type Role } from "./role-context";
import { usePayments, useProfile, useProfileActivity, useStudents, useTeachers, useTimetable } from "@/hooks/api-hooks";
import { logout } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "./ui-bits";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "Open Admin Dashboard", to: "/admin", role: "admin" as Role },
  { label: "Open Student Overview", to: "/student", role: "student" as Role },
  { label: "Open Teacher Workspace", to: "/teacher", role: "teacher" as Role },
  { label: "Open Finance Ledger", to: "/accounts", role: "accounts" as Role },
  { label: "Open AI Assistant", to: "/assistant", role: "student" as Role },
];

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { role, setRole, current } = useRole();
  const navigate = useNavigate();
  const { data: profile } = useProfile(role);
  const { data: profileActivity } = useProfileActivity(role);
  const { data: students } = useStudents();
  const { data: teachers } = useTeachers();
  const { data: payments } = usePayments();
  const { data: timetable } = useTimetable();
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const displayName = profile?.display_name ?? current.person;
  const recentActivity = useMemo(
    () => (profileActivity?.length ? profileActivity : profile?.recent_activity ?? []).slice(0, 3),
    [profile?.recent_activity, profileActivity],
  );

  const liveSearch = useMemo(() => {
    return {
      students: (students ?? []).slice(0, 5).map((student) => ({
        label: student.name,
        detail: `${student.student_id} · Class ${student.class_id}`,
        to: "/admin/students",
        role: "admin" as Role,
      })),
      teachers: (teachers ?? []).slice(0, 5).map((teacher) => ({
        label: teacher.name,
        detail: `${teacher.teacher_id} · ${teacher.subject}`,
        to: "/admin/staff",
        role: "admin" as Role,
      })),
      payments: (payments ?? []).slice(0, 4).map((payment) => ({
        label: `${payment.student_id} · ${payment.amount.toLocaleString()}`,
        detail: `${payment.method} · ${new Date(payment.date).toLocaleDateString()}`,
        to: "/accounts/transactions",
        role: "accounts" as Role,
      })),
      timetable: (timetable ?? []).slice(0, 4).map((slot) => ({
        label: `${slot.class_id} · ${slot.subject}`,
        detail: `${slot.day} · ${slot.start_time} - ${slot.end_time}`,
        to: "/admin/timetable",
        role: "admin" as Role,
      })),
    };
  }, [payments, students, teachers, timetable]);

  function openRoute(to: string, nextRole?: Role) {
    if (nextRole && nextRole !== role) {
      setRole(nextRole);
    }
    setSearchOpen(false);
    navigate({ to: to as any });
  }

  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join(""),
    [displayName],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem("aether-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = saved ? saved === "dark" : prefersDark;
    setDark(initialDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    window.localStorage.setItem("aether-theme", dark ? "dark" : "light");
  }, [dark, mounted]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-20 max-w-[1520px] items-center justify-between gap-4 px-4 md:px-8 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenu}
            aria-label="Open navigation"
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition hover:border-brand-300 hover:text-foreground md:hidden"
          >
            <Menu className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 text-left text-sm text-muted-foreground shadow-sm transition hover:border-brand-300/70 hover:text-foreground md:flex lg:max-w-[640px]"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Search className="size-4 shrink-0" />
              <span className="truncate">Search students, classes, reports, payments, or AI actions</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-secondary/80 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              <Command className="size-3.5" />
              K
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-4 text-sm text-muted-foreground shadow-sm transition hover:border-brand-300 hover:text-foreground md:hidden"
          >
            <Search className="size-4" />
            Search
          </button>

          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground xl:flex">
            <Sparkles className="size-3.5 text-brand-600" />
            Smart school operations online
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground lg:flex">
            <span className="size-2 rounded-full bg-success shadow-[0_0_0_6px_rgba(16,185,129,0.14)]" />
            Operational
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-brand-300 md:inline-flex">
                <span className="inline-flex size-7 items-center justify-center rounded-xl bg-brand-50 text-[11px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                  {role.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-sm">{displayName}</span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Switch role</p>
                  <p className="text-xs font-normal text-muted-foreground">Preview each dashboard</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {ROLES.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      setRole(item.id);
                      navigate({ to: `/${item.id}` as any });
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.person}</p>
                    </div>
                    {role === item.id && <CheckCircle2 className="size-4 text-success" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setDark((value) => !value)}
            aria-label="Toggle theme"
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition hover:border-brand-300 hover:text-foreground"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative inline-flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-card/90 text-muted-foreground shadow-sm transition hover:border-brand-300 hover:text-foreground">
                <Bell className="size-4" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full border border-background bg-brand-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2">
              <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <p className="text-xs text-muted-foreground">Recent activity from the campus</p>
                </div>
                <Badge tone="brand">{recentActivity.length ? `${recentActivity.length} updates` : "0 updates"}</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentActivity.map((item) => (
                <DropdownMenuItem key={`${item.title}-${item.at}`} onSelect={() => navigate({ to: "/profile/activity" as any })} className="rounded-2xl px-3 py-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 flex size-9 items-center justify-center rounded-xl",
                      item.tone === "warning" && "bg-warning/15 text-warning",
                      item.tone === "brand" && "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
                      item.tone === "success" && "bg-success/10 text-success",
                      item.tone === "neutral" && "bg-secondary/80 text-muted-foreground",
                    )}>
                      <CircleAlert className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              {recentActivity.length === 0 && (
                <DropdownMenuItem disabled className="rounded-2xl px-3 py-3 text-muted-foreground">
                  No recent activity yet.
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/profile/activity" as any })} className="rounded-xl px-3 py-2.5">
                View full activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card/90 px-2.5 py-2 shadow-sm transition hover:border-brand-300">
                <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-brand-foreground">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-foreground xl:block">Profile</span>
                <ChevronDown className="hidden size-4 text-muted-foreground xl:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{current.person}</p>
                <p className="text-xs text-muted-foreground">{current.subtitle}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => navigate({ to: "/profile/account" as any })} className="rounded-xl px-3 py-2.5">
                  <UserCircle2 className="size-4" />
                  Account profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/profile/workspace" as any })} className="rounded-xl px-3 py-2.5">
                  <LayoutGrid className="size-4" />
                  Workspace settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate({ to: "/profile/preferences" as any })} className="rounded-xl px-3 py-2.5">
                  <Settings2 className="size-4" />
                  Preferences
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/profile/activity" as any })} className="rounded-xl px-3 py-2.5">
                <History className="size-4" />
                Recent activity
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  logout();
                  navigate({ to: "/" as any });
                }}
                className="rounded-xl px-3 py-2.5 text-danger focus:text-danger"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search dashboards, records, reports or actions..." />
        <CommandList>
          <CommandEmpty>No matching actions found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            {QUICK_ACTIONS.map((action) => (
              <CommandItem
                key={action.to}
                onSelect={() => {
                  openRoute(action.to, action.role);
                }}
              >
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Students">
            {liveSearch.students.map((item) => (
              <CommandItem key={`${item.label}-${item.detail}`} onSelect={() => openRoute(item.to, item.role)}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Open</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Teachers">
            {liveSearch.teachers.map((item) => (
              <CommandItem key={`${item.label}-${item.detail}`} onSelect={() => openRoute(item.to, item.role)}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Open</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Finance">
            {liveSearch.payments.map((item) => (
              <CommandItem key={`${item.label}-${item.detail}`} onSelect={() => openRoute(item.to, item.role)}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Open</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Schedule">
            {liveSearch.timetable.map((item) => (
              <CommandItem key={`${item.label}-${item.detail}`} onSelect={() => openRoute(item.to, item.role)}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{item.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Open</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="System">
            <CommandItem onSelect={() => setDark((value) => !value)}>
              Toggle {dark ? "light" : "dark"} theme
            </CommandItem>
            <CommandItem onSelect={() => onMenu()}>
              Open mobile navigation
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
