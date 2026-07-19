import { AgentRunInProgressError } from "@/lib/agent/errors";
import { runHouseholdAgent } from "@/lib/agent/run";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const householdId = process.env.CRON_HOUSEHOLD_ID;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!householdId) {
    return Response.json(
      { error: "CRON_HOUSEHOLD_ID is not configured." },
      { status: 500 },
    );
  }

  try {
    const result = await runHouseholdAgent("scheduled", householdId);

    return Response.json({
      success: true,
      triggerType: "scheduled",
      result,
    });
  } catch (error) {
    if (error instanceof AgentRunInProgressError) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Scheduled run failed.",
      },
      { status: 500 },
    );
  }
}