"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Event title is required."),
    memberId: z.string().optional(),
    startsAt: z.string().min(1, "Start time is required."),
    endsAt: z.string().min(1, "End time is required."),
    type: z.enum(["busy", "class", "work", "travel", "personal"]),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "End time must be after the start time.",
    path: ["endsAt"],
  });

export async function saveCalendarEvent(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const eventId = String(formData.get("eventId") || "");
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    memberId: formData.get("memberId") || "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid calendar event.");
  }

  const values = {
    household_id: householdId,
    member_id: parsed.data.memberId || null,
    title: parsed.data.title,
    starts_at: new Date(parsed.data.startsAt).toISOString(),
    ends_at: new Date(parsed.data.endsAt).toISOString(),
    type: parsed.data.type,
  };

  const result = eventId
    ? await supabaseAdmin
        .from("calendar_events")
        .update(values)
        .eq("id", eventId)
        .eq("household_id", householdId)
    : await supabaseAdmin.from("calendar_events").insert(values);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deleteCalendarEvent(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const eventId = String(formData.get("eventId") || "");

  if (!eventId) {
    throw new Error("Invalid calendar event.");
  }

  const { error } = await supabaseAdmin
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("household_id", householdId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
