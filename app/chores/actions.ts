"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const choreSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().optional(),
  assignedMemberId: z.string().optional(),
  dueAt: z.string().min(1, "Due date is required."),
  recurrence: z.string().min(1),
});

export async function saveChore(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const choreId = String(formData.get("choreId") || "");
  const parsed = choreSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    assignedMemberId: formData.get("assignedMemberId") || "",
    dueAt: formData.get("dueAt"),
    recurrence: formData.get("recurrence"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid chore data.");
  }

  const values = {
    household_id: householdId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    assigned_member_id: parsed.data.assignedMemberId || null,
    due_at: new Date(parsed.data.dueAt).toISOString(),
    recurrence: parsed.data.recurrence,
  };

  const result = choreId
    ? await supabaseAdmin
        .from("chores")
        .update(values)
        .eq("id", choreId)
        .eq("household_id", householdId)
    : await supabaseAdmin.from("chores").insert(values);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/chores");
}

export async function updateChoreStatus(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const choreId = String(formData.get("choreId") || "");
  const status = String(formData.get("status") || "");

  if (!choreId || !["pending", "completed", "cancelled"].includes(status)) {
    throw new Error("Invalid chore status update.");
  }

  const { error } = await supabaseAdmin
    .from("chores")
    .update({ status })
    .eq("id", choreId)
    .eq("household_id", householdId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/chores");
}
