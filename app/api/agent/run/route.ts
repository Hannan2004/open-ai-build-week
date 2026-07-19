import { auth } from "@clerk/nextjs/server";
import { AgentRunInProgressError } from "@/lib/agent/errors";
import { runHouseholdAgent } from "@/lib/agent/run";

export async function POST() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runHouseholdAgent("manual");

    return Response.json({
      success: true,
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
        error: error instanceof Error ? error.message : "Agent run failed.",
      },
      { status: 500 },
    );
  }
}
