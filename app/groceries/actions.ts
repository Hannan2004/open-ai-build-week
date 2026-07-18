"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const grocerySchema = z.object({
  name: z.string().trim().min(1, "Item name is required."),
  quantity: z.string().trim().optional(),
  neededBy: z.string().optional(),
  assignedMemberId: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});

export async function saveGroceryItem(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const groceryId = String(formData.get("groceryId") || "");
  const parsed = grocerySchema.safeParse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || "",
    neededBy: formData.get("neededBy") || "",
    assignedMemberId: formData.get("assignedMemberId") || "",
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid grocery item.");
  }

  const values = {
    household_id: householdId,
    name: parsed.data.name,
    quantity: parsed.data.quantity || null,
    needed_by: parsed.data.neededBy
      ? new Date(parsed.data.neededBy).toISOString()
      : null,
    assigned_member_id: parsed.data.assignedMemberId || null,
    priority: parsed.data.priority,
  };

  const result = groceryId
    ? await supabaseAdmin
        .from("grocery_items")
        .update(values)
        .eq("id", groceryId)
        .eq("household_id", householdId)
    : await supabaseAdmin.from("grocery_items").insert(values);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/groceries");
}

export async function updateGroceryStatus(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const groceryId = String(formData.get("groceryId") || "");
  const status = String(formData.get("status") || "");

  if (!groceryId || !["needed", "purchased", "cancelled"].includes(status)) {
    throw new Error("Invalid grocery status update.");
  }

  const { error } = await supabaseAdmin
    .from("grocery_items")
    .update({ status })
    .eq("id", groceryId)
    .eq("household_id", householdId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/groceries");
}
