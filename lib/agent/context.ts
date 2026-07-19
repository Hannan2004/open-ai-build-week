import { supabaseAdmin } from "@/lib/supabase/admin";

export async function loadAgentContext(householdId: string) {
  const [
    householdResult,
    membersResult,
    choresResult,
    groceriesResult,
    billsResult,
    eventsResult,
    findingsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("households")
      .select("id, name, created_at")
      .eq("id", householdId)
      .single(),

    supabaseAdmin
      .from("household_members")
      .select("id, name, role, preferences")
      .eq("household_id", householdId),

    supabaseAdmin
      .from("chores")
      .select(
        "id, title, description, assigned_member_id, due_at, recurrence, status",
      )
      .eq("household_id", householdId)
      .neq("status", "cancelled"),

    supabaseAdmin
      .from("grocery_items")
      .select(
        "id, name, quantity, needed_by, assigned_member_id, status, priority",
      )
      .eq("household_id", householdId)
      .neq("status", "cancelled"),

    supabaseAdmin
      .from("bills")
      .select(
        "id, name, amount, due_at, assigned_member_id, status, notes",
      )
      .eq("household_id", householdId)
      .neq("status", "cancelled"),

    supabaseAdmin
      .from("calendar_events")
      .select("id, member_id, title, starts_at, ends_at, type")
      .eq("household_id", householdId),

    supabaseAdmin
      .from("agent_findings")
      .select(
        "id, finding_type, severity, title, description, status, created_at",
      )
      .eq("household_id", householdId)
      .in("status", ["open", "accepted"])
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const queryError = [
    householdResult.error,
    membersResult.error,
    choresResult.error,
    groceriesResult.error,
    billsResult.error,
    eventsResult.error,
    findingsResult.error,
  ].find(Boolean);

  if (queryError) {
    throw new Error(queryError.message);
  }

  return {
    household: householdResult.data,
    members: membersResult.data ?? [],
    chores: choresResult.data ?? [],
    groceries: groceriesResult.data ?? [],
    bills: billsResult.data ?? [],
    calendarEvents: eventsResult.data ?? [],
    recentFindings: findingsResult.data ?? [],
    currentTime: new Date().toISOString(),
  };
}