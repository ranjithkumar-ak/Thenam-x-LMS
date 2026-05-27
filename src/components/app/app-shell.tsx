import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { AppSidebar, SidebarContent } from "./sidebar";
import { TopBar } from "./topbar";
import { RoleProvider } from "./role-context";
import { RealtimeSync } from "./realtime-sync";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sidebarWidth = collapsed ? 84 : 292;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_18%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_20%)]" />
      <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-80 w-80 rounded-full bg-success/10 blur-3xl" />

      <div className="relative flex min-h-screen">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

        <div
          className="flex min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ease-out"
          style={{ paddingLeft: sidebarWidth }}
        >
          <TopBar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto w-full max-w-[1520px] px-4 py-6 md:px-8 lg:px-10 md:py-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[90vw] max-w-sm border-r-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Open the workspace navigation drawer.</SheetDescription>
          </SheetHeader>
          <SidebarContent
            collapsed={false}
            mobile
            onToggle={() => setCollapsed((value) => !value)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <RealtimeSync />
      <Shell>{children}</Shell>
    </RoleProvider>
  );
}
