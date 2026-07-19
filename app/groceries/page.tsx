import { format } from "date-fns";
import { ArrowLeft, Check, Pencil, Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { AppShell } from "@/components/app-shell";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveGroceryItem, updateGroceryStatus } from "./actions";

type GroceryItem = {
  id: string;
  name: string;
  quantity: string | null;
  needed_by: string | null;
  assigned_member_id: string | null;
  status: string;
  priority: string;
};

type Member = {
  id: string;
  name: string;
};

const ACCENT = "#E3A857";

const PRIORITY_DOT: Record<string, string> = {
  high: "#D97B6B",
  medium: ACCENT,
  low: "#5FBFA0",
};

export default async function GroceriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { household, membership } = await getCurrentHouseholdContext();
  const params = searchParams ? await searchParams : {};

  const [groceriesResult, membersResult] = await Promise.all([
    supabaseAdmin
      .from("grocery_items")
      .select(
        "id, name, quantity, needed_by, assigned_member_id, status, priority",
      )
      .eq("household_id", household.id)
      .neq("status", "cancelled")
      .order("needed_by", { ascending: true, nullsFirst: false }),
    supabaseAdmin
      .from("household_members")
      .select("id, name")
      .eq("household_id", household.id)
      .order("name", { ascending: true }),
  ]);

  if (groceriesResult.error) throw new Error(groceriesResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const groceries = (groceriesResult.data ?? []) as GroceryItem[];
  const members = (membersResult.data ?? []) as Member[];
  const editingItem = groceries.find((item) => item.id === params.edit);
  const neededCount = groceries.filter((item) => item.status === "needed").length;

  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Household workflow
            </p>
            <h1 className="mt-1.5 flex items-center gap-2.5 text-3xl font-semibold tracking-tight">
              <ShoppingCart className="size-6" style={{ color: ACCENT }} aria-hidden="true" />
              Groceries
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Keep the shared shopping list useful, current, and assigned.
            </p>
          </div>
          <a
            href="#grocery-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add item
          </a>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Shopping list</h2>
                <p className="text-sm text-muted-foreground">
                  {neededCount} {neededCount === 1 ? "item" : "items"} still needed
                </p>
              </div>
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Dashboard
              </Link>
            </div>

            <div className="divide-y">
              {groceries.map((item) => {
                const assignee = members.find(
                  (member) => member.id === item.assigned_member_id,
                );
                const isPurchased = item.status === "purchased";

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: isPurchased ? undefined : PRIORITY_DOT[item.priority] ?? ACCENT }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-medium ${isPurchased ? "line-through text-muted-foreground" : ""}`}>
                            {item.name}
                          </p>
                          <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                            {item.priority}
                          </Badge>
                          {isPurchased && <Badge variant="outline">Purchased</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.quantity || "Quantity not specified"}
                          {item.needed_by
                            ? ` · Needed by ${format(new Date(item.needed_by), "MMM d, yyyy 'at' p")}`
                            : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignee ? `Assigned to ${assignee.name}` : "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!isPurchased && (
                        <form action={updateGroceryStatus}>
                          <input type="hidden" name="groceryId" value={item.id} />
                          <input type="hidden" name="status" value="purchased" />
                          <SubmitButton
                            title="Mark item purchased"
                            aria-label={`Mark ${item.name} purchased`}
                            pendingLabel="Marking item purchased"
                            showPendingLabel={false}
                            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </SubmitButton>
                        </form>
                      )}
                      <Link
                        href={`/groceries?edit=${item.id}#grocery-form`}
                        title="Edit grocery item"
                        aria-label={`Edit ${item.name}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {groceries.length === 0 && (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  Your shopping list is empty. Add the first item using the form.
                </p>
              )}
            </div>
          </section>

          <section id="grocery-form" className="h-fit rounded-lg border bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <h2 className="font-semibold">{editingItem ? "Edit item" : "Add an item"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add urgency and ownership so the agent can reason about errands later.
                </p>
              </div>
              {editingItem && (
                <Link
                  href="/groceries"
                  title="Cancel editing"
                  aria-label="Cancel editing"
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>

            <form action={saveGroceryItem} className="space-y-4">
              {editingItem && (
                <input type="hidden" name="groceryId" value={editingItem.id} />
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Item</label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  placeholder="Milk"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                  <input
                    id="quantity"
                    name="quantity"
                    defaultValue={editingItem?.quantity ?? ""}
                    placeholder="2 cartons"
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue={editingItem?.priority ?? "medium"}
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="neededBy" className="text-sm font-medium">Needed by</label>
                <input
                  id="neededBy"
                  name="neededBy"
                  type="datetime-local"
                  defaultValue={
                    editingItem?.needed_by
                      ? format(new Date(editingItem.needed_by), "yyyy-MM-dd'T'HH:mm")
                      : undefined
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="assignedMemberId" className="text-sm font-medium">Assign to</label>
                <select
                  id="assignedMemberId"
                  name="assignedMemberId"
                  defaultValue={editingItem?.assigned_member_id ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <SubmitButton
                pendingLabel={editingItem ? "Saving changes..." : "Adding item..."}
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {editingItem ? "Save changes" : "Add item"}
              </SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}