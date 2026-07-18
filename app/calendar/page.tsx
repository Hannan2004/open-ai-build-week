import { format } from "date-fns";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deleteCalendarEvent, saveCalendarEvent } from "./actions";

type CalendarEvent = {
  id: string;
  member_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  type: string;
};

type Member = {
  id: string;
  name: string;
};

const eventTypes = ["busy", "class", "work", "travel", "personal"] as const;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { household, membership } = await getCurrentHouseholdContext();
  const params = searchParams ? await searchParams : {};

  const [eventsResult, membersResult] = await Promise.all([
    supabaseAdmin
      .from("calendar_events")
      .select("id, member_id, title, starts_at, ends_at, type")
      .eq("household_id", household.id)
      .order("starts_at", { ascending: true }),
    supabaseAdmin
      .from("household_members")
      .select("id, name")
      .eq("household_id", household.id)
      .order("name", { ascending: true }),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (membersResult.error) throw new Error(membersResult.error.message);

  const events = (eventsResult.data ?? []) as CalendarEvent[];
  const members = (membersResult.data ?? []) as Member[];
  const editingEvent = events.find((event) => event.id === params.edit);

  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Household context</p>
            <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
            <p className="mt-1 text-muted-foreground">
              See when household members are busy before assigning work.
            </p>
          </div>
          <a
            href="#event-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add event
          </a>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-lg border bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="font-semibold">Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  {events.length} household events
                </p>
              </div>
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Dashboard
              </Link>
            </div>

            <div className="divide-y">
              {events.map((event) => {
                const member = members.find((item) => item.id === event.member_id);

                return (
                  <div key={event.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{event.title}</p>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(new Date(event.starts_at), "EEE, MMM d 'at' p")} - {format(new Date(event.ends_at), "p")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member ? `For ${member.name}` : "Household-wide"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/calendar?edit=${event.id}#event-form`}
                        title="Edit event"
                        aria-label={`Edit ${event.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Link>
                      <form action={deleteCalendarEvent}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          title="Delete event"
                          aria-label={`Delete ${event.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-md border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}

              {events.length === 0 && (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  No calendar events yet. Add a member schedule or availability block.
                </p>
              )}
            </div>
          </section>

          <section id="event-form" className="rounded-lg border bg-background p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{editingEvent ? "Edit event" : "Add an event"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This context helps the agent avoid scheduling conflicts.
                </p>
              </div>
              {editingEvent && (
                <Link href="/calendar" title="Cancel editing" aria-label="Cancel editing">
                  <ArrowLeft className="size-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              )}
            </div>

            <form action={saveCalendarEvent} className="space-y-4">
              {editingEvent && <input type="hidden" name="eventId" value={editingEvent.id} />}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <input
                  id="title"
                  name="title"
                  required
                  defaultValue={editingEvent?.title}
                  placeholder="Maya class"
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="memberId" className="text-sm font-medium">Member</label>
                <select
                  id="memberId"
                  name="memberId"
                  defaultValue={editingEvent?.member_id ?? ""}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Household-wide</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="startsAt" className="text-sm font-medium">Starts</label>
                  <input
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    required
                    defaultValue={
                      editingEvent
                        ? format(new Date(editingEvent.starts_at), "yyyy-MM-dd'T'HH:mm")
                        : undefined
                    }
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="endsAt" className="text-sm font-medium">Ends</label>
                  <input
                    id="endsAt"
                    name="endsAt"
                    type="datetime-local"
                    required
                    defaultValue={
                      editingEvent
                        ? format(new Date(editingEvent.ends_at), "yyyy-MM-dd'T'HH:mm")
                        : undefined
                    }
                    className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Type</label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingEvent?.type ?? "busy"}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {eventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {editingEvent ? "Save changes" : "Add event"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
