import { getCurrentHouseholdContext } from "@/lib/household-context";
import { loadAgentContext } from "@/lib/agent/context";
import { askHouseholdAgent } from "@/lib/agent/openrouter";
import { supabaseAdmin } from "@/lib/supabase/admin";

function isValidId(
  value: string | null,
  validIds: Set<string>,
): value is string {
  return value !== null && validIds.has(value);
}

export async function runHouseholdAgent(
  triggerType: "manual" | "scheduled",
) {
  const { householdId } = await getCurrentHouseholdContext();
  const context = await loadAgentContext();

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

      const relatedEntityId =
        finding.relatedEntityType && finding.relatedEntityId
          ? isValidId(
              finding.relatedEntityId,
              entityIds[finding.relatedEntityType],
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
        related_entity_type: finding.relatedEntityType,
        related_entity_id: relatedEntityId,
        suggested_member_id: suggestedMemberId,
        proposed_action: finding.proposedAction,
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