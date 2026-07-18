import { UserButton } from "@clerk/nextjs";
import {
  Bot,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Home,
  Receipt,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/groceries", label: "Groceries", icon: ShoppingCart },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/agent", label: "Agent Inbox", icon: Bot },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label="Main navigation"
      className={mobile ? "flex gap-2 overflow-x-auto p-3" : "space-y-1"}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              mobile
                ? "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                : "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{item.label}</span>
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
            <ClipboardList className="size-5" aria-hidden="true" />
            <span className="font-semibold">Household Ops</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">
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
            <ClipboardList className="size-5 shrink-0" aria-hidden="true" />
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
