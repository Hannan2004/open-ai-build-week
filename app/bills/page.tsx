import { format, isPast } from "date-fns";
import { ArrowLeft, Check, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveBill, updateBillStatus } from "./actions";

type Bill = {
  id: string;
  name: string;
  amount: number;
  due_at: string;
  assigned_member_id: string | null;
  status: string;
  notes: string | null;
};

type Member = {
  id: string;
  name: string;
};

export default async function BillsPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { household, membership } = await getCurrentHouseholdContext();
  const params = searchParams ? await searchParams : {};

  const [billsResult, membersResult] = await Promise.all([
    supabaseAdmin
      .from("bills")
      .select("id, name, amount, due_at, assigned_member_id, status, notes")
      .eq("household_id", household.id)
      .neq("status", "cancelled")
      .order("due_at", { ascending: true }),
    supabaseAdmin
      .from("household_members")
      .select("id, name")
      .eq("household_id", household.id)
      .order("name", { ascending: true }),
  ]);

  if (billsResult.error) throw new Error(billsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const bills = (billsResult.data ?? []) as Bill[];
  const members = (membersResult.data ?? []) as Member[];
  const editingBill = bills.find((bill) => bill.id === params.edit);

  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Household workflow</p>
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="mt-1 text-muted-foreground">
              Keep payment responsibility and deadlines visible to the household.
            </p>
          </div>
          <a
            href="#bill-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add bill
          </a>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Bills to watch</h2>
                <p className="text-sm text-muted-foreground">
                  {bills.filter((bill) => bill.status !== "paid").length} unpaid bills
                </p>
              </div>
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Dashboard
              </Link>
            </div>

            <div className="divide-y">
              {bills.map((bill) => {
                const assignee = members.find(
                  (member) => member.id === bill.assigned_member_id,
                );
                const isPaid = bill.status === "paid";
                const isOverdue = !isPaid && isPast(new Date(bill.due_at));

                return (
                  <div key={bill.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${isPaid ? "line-through text-muted-foreground" : ""}`}>
                          {bill.name}
                        </p>
                        <Badge variant={isPaid ? "secondary" : isOverdue ? "destructive" : "outline"}>
                          {isPaid ? "Paid" : isOverdue ? "Overdue" : "Upcoming"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        ${Number(bill.amount).toFixed(2)} · Due {format(new Date(bill.due_at), "MMM d, yyyy 'at' p")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignee ? `Assigned to ${assignee.name}` : "Unassigned"}
                      </p>
                      {bill.notes && <p className="mt-1 text-sm text-muted-foreground">{bill.notes}</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!isPaid && (
                        <form action={updateBillStatus}>
                          <input type="hidden" name="billId" value={bill.id} />
                          <input type="hidden" name="status" value="paid" />
                          <button
                            type="submit"
                            title="Mark bill paid"
                            aria-label={`Mark ${bill.name} paid`}
                            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/bills?edit=${bill.id}#bill-form`}
                        title="Edit bill"
                        aria-label={`Edit ${bill.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {bills.length === 0 && (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No bills yet. Add the first household bill using the form.
                </p>
              )}
            </div>
          </section>

          <section id="bill-form" className="rounded-lg border bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{editingBill ? "Edit bill" : "Add a bill"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a deadline and owner so the agent can prioritize reminders later.
                </p>
              </div>
              {editingBill && (
                <Link href="/bills" title="Cancel editing" aria-label="Cancel editing">
                  <ArrowLeft className="size-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              )}
            </div>

            <form action={saveBill} className="space-y-4">
              {editingBill && <input type="hidden" name="billId" value={editingBill.id} />}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Bill name</label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingBill?.name}
                  placeholder="Internet bill"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={editingBill?.amount}
                    placeholder="59.99"
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingBill?.status ?? "upcoming"}
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="dueAt" className="text-sm font-medium">Due date</label>
                <input
                  id="dueAt"
                  name="dueAt"
                  type="datetime-local"
                  required
                  defaultValue={
                    editingBill
                      ? format(new Date(editingBill.due_at), "yyyy-MM-dd'T'HH:mm")
                      : undefined
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignedMemberId" className="text-sm font-medium">Assign to</label>
                <select
                  id="assignedMemberId"
                  name="assignedMemberId"
                  defaultValue={editingBill?.assigned_member_id ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={editingBill?.notes ?? ""}
                  placeholder="Optional payment details"
                  className="flex min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {editingBill ? "Save changes" : "Add bill"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
