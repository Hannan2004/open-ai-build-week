import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Receipt, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Chore = {
  id: string;
  title: string;
  due_at: string;
  status: string;
  assigned_member_id: string | null;
};

type GroceryItem = {
  id: string;
  name: string;
  quantity: string | null;
  needed_by: string | null;
  status: string;
  priority: string;
};

type Bill = {
  id: string;
  name: string;
  amount: number;
  due_at: string;
  status: string;
};

type Member = {
  id: string;
  name: string;
};

type AgentRun = {
  id: string;
  status: string;
  completed_at: string | null;
};

const ACCENT = {
  chores: "#5FBFA0",
  groceries: "#E3A857",
  bills: "#D97B6B",
  agent: "#7FA8E3",
} as const;

function formatDueDate(value: string) {
  const date = new Date(value);

  if (isToday(date)) {
    return `Today at ${format(date, "p")}`;
  }

  return format(date, "MMM d, p");
}

function getDueTone(value: string) {
  return isPast(new Date(value)) ? "text-destructive" : "text-muted-foreground";
}

export default async function DashboardPage() {
  const { household, membership } = await getCurrentHouseholdContext();

  const [choresResult, groceriesResult, billsResult, membersResult, runsResult] =
    await Promise.all([
      supabaseAdmin
        .from("chores")
        .select("id, title, due_at, status, assigned_member_id")
        .eq("household_id", household.id)
        .neq("status", "completed")
        .order("due_at", { ascending: true }),
      supabaseAdmin
        .from("grocery_items")
        .select("id, name, quantity, needed_by, status, priority")
        .eq("household_id", household.id)
        .eq("status", "needed")
        .order("priority", { ascending: false })
        .order("needed_by", { ascending: true }),
      supabaseAdmin
        .from("bills")
        .select("id, name, amount, due_at, status")
        .eq("household_id", household.id)
        .neq("status", "paid")
        .neq("status", "cancelled")
        .order("due_at", { ascending: true }),
      supabaseAdmin
        .from("household_members")
        .select("id, name")
        .eq("household_id", household.id)
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("agent_runs")
        .select("id, status, completed_at")
        .eq("household_id", household.id)
        .order("started_at", { ascending: false })
        .limit(1),
    ]);

  const queryError = [
    choresResult.error,
    groceriesResult.error,
    billsResult.error,
    membersResult.error,
    runsResult.error,
  ].find(Boolean);

  if (queryError) {
    throw new Error(queryError.message);
  }

  const chores = (choresResult.data ?? []) as Chore[];
  const groceries = (groceriesResult.data ?? []) as GroceryItem[];
  const bills = (billsResult.data ?? []) as Bill[];
  const members = (membersResult.data ?? []) as Member[];
  const lastAgentRun = (runsResult.data?.[0] ?? null) as AgentRun | null;
  const memberNames = new Map(members.map((member) => [member.id, member.name]));

  const workload = members.map((member) => ({
    ...member,
    count: chores.filter(
      (chore) => chore.assigned_member_id === member.id,
    ).length,
  }));

  const overdueChores = chores.filter((chore) => isPast(new Date(chore.due_at)));
  const urgentBills = bills.filter((bill) => {
    const dueDate = new Date(bill.due_at);
    return isPast(dueDate) || isToday(dueDate);
  });

  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Good to see you, {membership.name}
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-tight">Household overview</h1>
            <p className="mt-1.5 text-muted-foreground">
              Keep the next household decisions visible and manageable.
            </p>
          </div>
          <Link
            href="/agent"
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
          >
            <Bot className="size-4" aria-hidden="true" />
            <span>Open Agent Inbox</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Household summary">
          <SummaryCard
            label="Open chores"
            value={chores.length}
            detail={`${overdueChores.length} overdue`}
            icon={CheckCircle2}
            href="/chores"
            accent={ACCENT.chores}
            alert={overdueChores.length > 0}
          />
          <SummaryCard
            label="Grocery items"
            value={groceries.length}
            detail="Still needed"
            icon={ShoppingCart}
            href="/groceries"
            accent={ACCENT.groceries}
          />
          <SummaryCard
            label="Unpaid bills"
            value={bills.length}
            detail={`${urgentBills.length} need attention`}
            icon={Receipt}
            href="/bills"
            accent={ACCENT.bills}
            alert={urgentBills.length > 0}
          />
          <SummaryCard
            label="Agent status"
            value={lastAgentRun ? "Ready" : "New"}
            detail={
              lastAgentRun?.completed_at
                ? `Last run ${formatDistanceToNow(new Date(lastAgentRun.completed_at), { addSuffix: true })}`
                : "No run yet"
            }
            icon={Bot}
            href="/agent"
            accent={ACCENT.agent}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Next up</h2>
                <p className="text-sm text-muted-foreground">Tasks that need a household decision.</p>
              </div>
              <Link href="/chores" className="text-sm font-medium text-primary hover:underline">
                View chores
              </Link>
            </div>

            <div className="divide-y">
              {chores.slice(0, 5).map((chore) => {
                const overdue = isPast(new Date(chore.due_at));
                return (
                  <div
                    key={chore.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: overdue ? "#D97B6B" : ACCENT.chores }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{chore.title}</p>
                      <p className={`text-sm ${getDueTone(chore.due_at)}`}>
                        {formatDueDate(chore.due_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {chore.assigned_member_id
                        ? memberNames.get(chore.assigned_member_id) ?? "Assigned"
                        : "Unassigned"}
                    </Badge>
                  </div>
                );
              })}
              {chores.length === 0 && (
                <EmptyState message="No open chores. The household is caught up." />
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Member workload</h2>
                <p className="text-sm text-muted-foreground">Open chores by person.</p>
              </div>
              <Link href="/calendar" className="text-sm font-medium text-primary hover:underline">
                View calendar
              </Link>
            </div>

            <div className="space-y-4 px-5 py-5">
              {workload.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{member.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(member.count * 25, 100)}%`,
                          backgroundColor: ACCENT.chores,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-sm text-muted-foreground">
                      {member.count} {member.count === 1 ? "chore" : "chores"}
                    </span>
                  </div>
                </div>
              ))}
              {workload.length === 0 && <EmptyState message="No household members yet." />}
            </div>
          </section>
        </div>

        <section className="rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Household pulse</h2>
              <p className="text-sm text-muted-foreground">Groceries and bills worth keeping in view.</p>
            </div>
          </div>

          <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <ShoppingCart className="size-3.5" style={{ color: ACCENT.groceries }} aria-hidden="true" />
                  Groceries needed
                </h3>
                <Link href="/groceries" className="text-sm text-primary hover:underline">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {groceries.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{item.name}</span>
                    <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                      {item.quantity || item.priority}
                    </Badge>
                  </div>
                ))}
                {groceries.length === 0 && <EmptyState message="No groceries needed." />}
              </div>
            </div>

            <div className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Receipt className="size-3.5" style={{ color: ACCENT.bills }} aria-hidden="true" />
                  Bills to watch
                </h3>
                <Link href="/bills" className="text-sm text-primary hover:underline">
                  Manage
                </Link>
              </div>
              <div className="space-y-3">
                {bills.slice(0, 4).map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{bill.name}</p>
                      <p className={`text-xs ${getDueTone(bill.due_at)}`}>
                        Due {formatDueDate(bill.due_at)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">${Number(bill.amount).toFixed(2)}</span>
                  </div>
                ))}
                {bills.length === 0 && <EmptyState message="No unpaid bills." />}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  accent,
  alert = false,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof CheckCircle2;
  href: string;
  accent: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{ borderColor: undefined }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accent}1F` }}
        >
          <Icon className="size-4" style={{ color: accent }} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        {alert && <AlertTriangle className="size-3 text-destructive" aria-hidden="true" />}
        {detail}
      </p>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-4 text-sm text-muted-foreground">{message}</p>;
}