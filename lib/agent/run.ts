import { getCurrentHouseholdContext } from "@/lib/household-context";
import { loadAgentContext } from "@/lib/agent/context";
import { AgentRunInProgressError } from "@/lib/agent/errors";
import { askHouseholdAgent } from "@/lib/agent/openrouter";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isValidId(
  value: string | null,
  validIds: Set<string>,
): value is string {
  return value !== null && validIds.has(value);
}

const validEntityTypes = [
  "chore",
  "grocery",
  "bill",
  "calendar_event",
] as const;

const validActions = [
  "no_action",
  "reassign_chore",
  "assign_grocery",
  "remind_bill",
  "create_nudge",
] as const;

export async function runHouseholdAgent(
  triggerType: "manual" | "scheduled",
  scheduledHouseholdId?: string,
) {
  const householdId =
    scheduledHouseholdId ??
    (await getCurrentHouseholdContext()).householdId;

  const staleRunCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { error: staleRunError } = await supabaseAdmin
    .from("agent_runs")
    .update({
      status: "failed",
      summary: "Agent run timed out before completion.",
      completed_at: new Date().toISOString(),
    })
    .eq("household_id", householdId)
    .eq("status", "running")
    .lt("started_at", staleRunCutoff);

  if (staleRunError) {
    throw new Error(staleRunError.message);
  }

  const { data: activeRun, error: activeRunError } = await supabaseAdmin
    .from("agent_runs")
    .select("id")
    .eq("household_id", householdId)
    .eq("status", "running")
    .limit(1)
    .maybeSingle();

  if (activeRunError) {
    throw new Error(activeRunError.message);
  }

  if (activeRun) {
    throw new AgentRunInProgressError();
  }

  const context = await loadAgentContext(householdId);

  const { data: run, error: runError } = await supabaseAdmin
    .from("agent_runs")
    .insert({
      household_id: householdId,
      trigger_type: triggerType,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(runError?.message || "Unable to create agent run.");
  }

  try {
    const result = await askHouseholdAgent({ context });

    const memberIds = new Set(context.members.map((member) => member.id));
    const choreIds = new Set(context.chores.map((chore) => chore.id));
    const groceryIds = new Set(
      context.groceries.map((grocery) => grocery.id),
    );
    const billIds = new Set(context.bills.map((bill) => bill.id));
    const eventIds = new Set(
      context.calendarEvents.map((event) => event.id),
    );

    const sanitizedFindings = result.findings.map((finding) => {
      const entityIds = {
        chore: choreIds,
        grocery: groceryIds,
        bill: billIds,
        calendar_event: eventIds,
      };

      const relatedEntityType = validEntityTypes.includes(
        finding.relatedEntityType as (typeof validEntityTypes)[number],
      )
        ? (finding.relatedEntityType as (typeof validEntityTypes)[number])
        : null;

      const relatedEntityId =
        relatedEntityType && finding.relatedEntityId
          ? isValidId(
              finding.relatedEntityId,
              entityIds[relatedEntityType],
            )
            ? finding.relatedEntityId
            : null
          : null;

      const suggestedMemberId = isValidId(
        finding.suggestedMemberId,
        memberIds,
      )
        ? finding.suggestedMemberId
        : null;

      return {
        agent_run_id: run.id,
        household_id: householdId,
        finding_type: finding.findingType,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        reasoning: finding.reasoning,
        confidence: finding.confidence,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        suggested_member_id: suggestedMemberId,
        proposed_action: validActions.includes(
          finding.proposedAction as (typeof validActions)[number],
        )
          ? finding.proposedAction
          : "no_action",
        nudge_message: finding.nudgeMessage,
        status: "open",
      };
    });

    if (sanitizedFindings.length > 0) {
      const { error: findingsError } = await supabaseAdmin
        .from("agent_findings")
        .insert(sanitizedFindings);

      if (findingsError) {
        throw new Error(findingsError.message);
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("agent_runs")
      .update({
        status: "completed",
        summary: result.summary,
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("household_id", householdId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      runId: run.id,
      summary: result.summary,
      findings: sanitizedFindings,
    };
  } catch (error) {
    await supabaseAdmin
      .from("agent_runs")
      .update({
        status: "failed",
        summary: error instanceof Error ? error.message : "Agent failed.",
        completed_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("household_id", householdId);

    throw error;
  }
}
