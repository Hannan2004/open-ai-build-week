"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

const billSchema = z.object({
  name: z.string().trim().min(1, "Bill name is required."),
  amount: z.coerce.number().nonnegative("Amount cannot be negative."),
  dueAt: z.string().min(1, "Due date is required."),
  assignedMemberId: z.string().optional(),
  status: z.enum(["upcoming", "paid", "overdue"]),
  notes: z.string().trim().optional(),
});

export async function saveBill(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const billId = String(formData.get("billId") || "");
  const parsed = billSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    dueAt: formData.get("dueAt"),
    assignedMemberId: formData.get("assignedMemberId") || "",
    status: formData.get("status"),
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid bill data.");
  }

  const values = {
    household_id: householdId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    due_at: new Date(parsed.data.dueAt).toISOString(),
    assigned_member_id: parsed.data.assignedMemberId || null,
    status: parsed.data.status,
    notes: parsed.data.notes || null,
  };

  const result = billId
    ? await supabaseAdmin
        .from("bills")
        .update(values)
        .eq("id", billId)
        .eq("household_id", householdId)
    : await supabaseAdmin.from("bills").insert(values);

  if (result.error) {
    throw new Error(result.error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bills");
}

export async function updateBillStatus(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const billId = String(formData.get("billId") || "");
  const status = String(formData.get("status") || "");

  if (!billId || !["upcoming", "paid", "overdue", "cancelled"].includes(status)) {
    throw new Error("Invalid bill status update.");
  }

  const { error } = await supabaseAdmin
    .from("bills")
    .update({ status })
    .eq("id", billId)
    .eq("household_id", householdId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/bills");
}
