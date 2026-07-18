import { format } from "date-fns";
import { ArrowLeft, Check, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { saveChore, updateChoreStatus } from "./actions";

type Chore = {
  id: string;
  title: string;
  description: string | null;
  assigned_member_id: string | null;
  due_at: string;
  recurrence: string;
  status: string;
};

type Member = {
  id: string;
  name: string;
};

export default async function ChoresPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { household, membership } = await getCurrentHouseholdContext();
  const params = searchParams ? await searchParams : {};

  const [choresResult, membersResult] = await Promise.all([
    supabaseAdmin
      .from("chores")
      .select(
        "id, title, description, assigned_member_id, due_at, recurrence, status",
      )
      .eq("household_id", household.id)
      .neq("status", "cancelled")
      .order("due_at", { ascending: true }),
    supabaseAdmin
      .from("household_members")
      .select("id, name")
      .eq("household_id", household.id)
      .order("name", { ascending: true }),
  ]);

  if (choresResult.error) throw new Error(choresResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const chores = (choresResult.data ?? []) as Chore[];
  const members = (membersResult.data ?? []) as Member[];
  const editingChore = chores.find((chore) => chore.id === params.edit);

  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Household workflow</p>
            <h1 className="text-3xl font-bold tracking-tight">Chores</h1>
            <p className="mt-1 text-muted-foreground">
              Keep recurring work visible and make ownership clear.
            </p>
          </div>
          <a
            href="#chore-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add chore
          </a>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Open chores</h2>
                <p className="text-sm text-muted-foreground">
                  {chores.filter((chore) => chore.status === "pending").length} pending items
                </p>
              </div>
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Dashboard
              </Link>
            </div>

            <div className="divide-y">
              {chores.map((chore) => {
                const assignee = members.find(
                  (member) => member.id === chore.assigned_member_id,
                );
                const isCompleted = chore.status === "completed";

                return (
                  <div key={chore.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                          {chore.title}
                        </p>
                        {isCompleted && <Badge variant="secondary">Completed</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Due {format(new Date(chore.due_at), "MMM d, yyyy 'at' p")} · {chore.recurrence}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {assignee ? `Assigned to ${assignee.name}` : "Unassigned"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!isCompleted && (
                        <form action={updateChoreStatus}>
                          <input type="hidden" name="choreId" value={chore.id} />
                          <input type="hidden" name="status" value="completed" />
                          <button
                            type="submit"
                            title="Mark chore complete"
                            aria-label={`Mark ${chore.title} complete`}
                            className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            <Check className="size-4" aria-hidden="true" />
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/chores?edit=${chore.id}#chore-form`}
                        title="Edit chore"
                        aria-label={`Edit ${chore.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {chores.length === 0 && (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No chores yet. Add the first household task using the form.
                </p>
              )}
            </div>
          </section>

          <section id="chore-form" className="rounded-lg border bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{editingChore ? "Edit chore" : "Add a chore"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add enough context for the household agent to reason about ownership later.
                </p>
              </div>
              {editingChore && (
                <Link href="/chores" title="Cancel editing" aria-label="Cancel editing">
                  <ArrowLeft className="size-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              )}
            </div>

            <form action={saveChore} className="space-y-4">
              {editingChore && (
                <input type="hidden" name="choreId" value={editingChore.id} />
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  defaultValue={editingChore?.title}
                  placeholder="Take out trash"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={editingChore?.description ?? ""}
                  placeholder="Add helpful context"
                  className="flex min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="dueAt" className="text-sm font-medium">Due date</label>
                  <input
                    id="dueAt"
                    name="dueAt"
                    type="datetime-local"
                    required
                    defaultValue={
                      editingChore
                        ? format(new Date(editingChore.due_at), "yyyy-MM-dd'T'HH:mm")
                        : undefined
                    }
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="recurrence" className="text-sm font-medium">Recurrence</label>
                  <select
                    id="recurrence"
                    name="recurrence"
                    defaultValue={editingChore?.recurrence ?? "none"}
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="none">One time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="assignedMemberId" className="text-sm font-medium">Assign to</label>
                <select
                  id="assignedMemberId"
                  name="assignedMemberId"
                  defaultValue={editingChore?.assigned_member_id ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {editingChore ? "Save changes" : "Add chore"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
