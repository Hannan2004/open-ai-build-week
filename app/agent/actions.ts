"use server";

import { revalidatePath } from "next/cache";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function updateFindingStatus(formData: FormData, status: "accepted" | "dismissed") {
  const { householdId } = await getCurrentHouseholdContext();
  const findingId = String(formData.get("findingId") || "");

  if (!findingId) {
    throw new Error("Finding ID is required.");
  }

  const { error } = await supabaseAdmin
    .from("agent_findings")
    .update({ status })
    .eq("id", findingId)
    .eq("household_id", householdId)
    .eq("status", "open");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/agent");
}

export async function acceptFinding(formData: FormData) {
  await updateFindingStatus(formData, "accepted");
}

export async function dismissFinding(formData: FormData) {
  await updateFindingStatus(formData, "dismissed");
}

export async function applyFinding(formData: FormData) {
  const { householdId } = await getCurrentHouseholdContext();
  const findingId = String(formData.get("findingId") || "");

  if (!findingId) {
    throw new Error("Finding ID is required.");
  }

  const { data: finding, error: findingError } = await supabaseAdmin
    .from("agent_findings")
    .select(
      "id, finding_type, related_entity_type, related_entity_id, suggested_member_id, proposed_action, nudge_message, description, status",
    )
    .eq("id", findingId)
    .eq("household_id", householdId)
    .single();

  if (findingError || !finding) {
    throw new Error(findingError?.message || "Finding not found.");
  }

  if (finding.status !== "accepted") {
    throw new Error("Only approved findings can be applied.");
  }

  const action = finding.proposed_action || "no_action";
  const relatedEntityType = finding.related_entity_type;
  const relatedEntityId = finding.related_entity_id;
  const suggestedMemberId = finding.suggested_member_id;

  const shouldCreateNudge =
    ["remind_bill", "create_nudge"].includes(action) ||
    Boolean(finding.nudge_message);

  if (
    (["reassign_chore", "assign_grocery", "remind_bill", "create_nudge"].includes(
      action,
    ) || shouldCreateNudge) &&
    !suggestedMemberId
  ) {
    throw new Error("This recommendation does not have a valid member.");
  }

  if (suggestedMemberId) {
    const { data: member, error: memberError } = await supabaseAdmin
      .from("household_members")
      .select("id")
      .eq("id", suggestedMemberId)
      .eq("household_id", householdId)
      .single();

    if (memberError || !member) {
      throw new Error("Suggested member does not belong to this household.");
    }
  }

  if (action === "reassign_chore") {
    if (relatedEntityType !== "chore" || !relatedEntityId) {
      throw new Error("This finding is not linked to a valid chore.");
    }

    const { error } = await supabaseAdmin
      .from("chores")
      .update({
        assigned_member_id: suggestedMemberId,
      })
      .eq("id", relatedEntityId)
      .eq("household_id", householdId);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (action === "assign_grocery") {
    if (relatedEntityType !== "grocery" || !relatedEntityId) {
      throw new Error("This finding is not linked to a valid grocery item.");
    }

    const { error } = await supabaseAdmin
      .from("grocery_items")
      .update({
        assigned_member_id: suggestedMemberId,
      })
      .eq("id", relatedEntityId)
      .eq("household_id", householdId);

    if (error) {
      throw new Error(error.message);
    }
  }

  if (shouldCreateNudge) {
    const { data: existingNudge, error: existingNudgeError } =
      await supabaseAdmin
        .from("nudges")
        .select("id")
        .eq("agent_finding_id", findingId)
        .neq("status", "dismissed")
        .limit(1)
        .maybeSingle();

    if (existingNudgeError) {
      throw new Error(existingNudgeError.message);
    }

    if (!existingNudge) {
      const { error: nudgeError } = await supabaseAdmin.from("nudges").insert({
        household_id: householdId,
        member_id: suggestedMemberId,
        agent_finding_id: findingId,
        message: finding.nudge_message || finding.description,
        status: "pending",
      });

      if (nudgeError) {
        throw new Error(nudgeError.message);
      }
    }
  }

  if (action === "no_action") {
    // The user approved the finding but there is no database action to apply.
  }

  const { error: findingUpdateError } = await supabaseAdmin
    .from("agent_findings")
    .update({
      status: "resolved",
    })
    .eq("id", findingId)
    .eq("household_id", householdId)
    .eq("status", "accepted");

  if (findingUpdateError) {
    throw new Error(findingUpdateError.message);
  }

  revalidatePath("/agent");
  revalidatePath("/dashboard");
  revalidatePath("/chores");
  revalidatePath("/groceries");
  revalidatePath("/bills");
}
