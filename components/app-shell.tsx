"use client";

import { UserButton } from "@clerk/nextjs";
import {
  Bot,
  CalendarDays,
  CheckSquare,
  Home,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: string;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, accent: "#8B92A6" },
  { href: "/chores", label: "Chores", icon: CheckSquare, accent: "#5FBFA0" },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart, accent: "#E3A857" },
  { href: "/bills", label: "Bills", icon: Receipt, accent: "#D97B6B" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, accent: "#7FA8E3" },
  { href: "/agent", label: "Agent Inbox", icon: Bot, accent: "#E3A857" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={mobile ? "flex gap-2 overflow-x-auto p-3" : "space-y-0.5"}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? `flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    active
                      ? "border-transparent bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`
                : `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
                  }`
            }
          >
            {!mobile && (
              <span
                className="absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: item.accent,
                  opacity: active ? 1 : 0,
                }}
                aria-hidden="true"
              />
            )}
            <Icon
              className="size-4 shrink-0 transition-colors"
              style={{ color: active ? item.accent : undefined }}
              aria-hidden="true"
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  householdName,
  memberName,
}: {
  children: ReactNode;
  householdName: string;
  memberName: string;
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background md:flex md:flex-col">
        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-[#E3A857]/15">
              <Bot className="size-4" style={{ color: "#E3A857" }} aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Household Ops</span>
          </div>
          <p className="mt-2 truncate text-sm text-muted-foreground">
            {householdName}
          </p>
        </div>

        <div className="flex-1 px-3 py-5">
          <Navigation />
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{memberName}</p>
            <p className="text-xs text-muted-foreground">Household member</p>
          </div>
          <UserButton />
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="flex items-center justify-between border-b bg-background px-4 py-4 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#E3A857]/15">
              <Bot className="size-4" style={{ color: "#E3A857" }} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">Household Ops</p>
              <p className="truncate text-xs text-muted-foreground">
                {householdName}
              </p>
            </div>
          </div>
          <UserButton />
        </header>

        <div className="border-b bg-background md:hidden">
          <Navigation mobile />
        </div>

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}