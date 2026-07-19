"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { sendNudgeApprovalEmail } from "@/lib/email/resend";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function sendNudgeToAdmin(formData: FormData) {
  const { householdId, household } = await getCurrentHouseholdContext();
  const nudgeId = String(formData.get("nudgeId") || "");

  if (!nudgeId) {
    throw new Error("Nudge ID is required.");
  }

  const { data: nudge, error: nudgeError } = await supabaseAdmin
    .from("nudges")
    .select(
      "id, member_id, agent_finding_id, message, status",
    )
    .eq("id", nudgeId)
    .eq("household_id", householdId)
    .single();

  if (nudgeError || !nudge) {
    throw new Error(nudgeError?.message || "Nudge not found.");
  }

  if (nudge.status !== "pending") {
    throw new Error("This nudge has already been processed.");
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("household_members")
    .select("name")
    .eq("id", nudge.member_id)
    .eq("household_id", householdId)
    .single();

  if (memberError || !member) {
    throw new Error("Nudge recipient was not found.");
  }

  const { data: finding, error: findingError } = await supabaseAdmin
    .from("agent_findings")
    .select("title")
    .eq("id", nudge.agent_finding_id)
    .eq("household_id", householdId)
    .single();

  if (findingError || !finding) {
    throw new Error("Related agent finding was not found.");
  }

  const emailId = await sendNudgeApprovalEmail({
    nudgeId: nudge.id,
    householdName: household.name,
    targetMemberName: member.name,
    findingTitle: finding.title,
    message: nudge.message,
  });

  const { error: updateError } = await supabaseAdmin
    .from("nudges")
    .update({
      status: "sent",
    })
    .eq("id", nudge.id)
    .eq("household_id", householdId)
    .eq("status", "pending");

  if (updateError) {
    throw new Error(updateError.message);
  }

  console.log(`Resend email sent: ${emailId}`);

  revalidatePath("/agent");
}

export async function dismissNudge(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const nudgeId = String(formData.get("nudgeId") || "");

  if (!nudgeId) {
    throw new Error("Nudge ID is required.");
  }

  const { error } = await supabaseAdmin
    .from("nudges")
    .update({ status: "dismissed" })
    .eq("id", nudgeId)
    .eq("household_id", householdId)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/agent");
}
