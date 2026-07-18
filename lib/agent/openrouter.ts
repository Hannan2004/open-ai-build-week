import { agentResultSchema, type AgentResult } from "@/lib/agent/schema";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export async function askHouseholdAgent(input: {
  context: unknown;
}): Promise<AgentResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const url = process.env.URL;
  
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  const systemPrompt = `
You are Household Ops Agent, an autonomous household logistics assistant.

Your job is to inspect the complete household context and reason about:
- Scheduling conflicts.
- Overdue work.
- Unassigned work.
- Bills that need attention.
- Grocery and errand suitability.
- Uneven workload.
- Member preferences and capabilities.

Do not use a fixed checklist. Use your own reasoning over the supplied context.

Important rules:
- Do not invent people, events, preferences, or completed actions.
- Consider all relevant members before recommending someone.
- Prefer one targeted nudge over a household-wide notification.
- Explain the reasoning behind every finding.
- Only use IDs that appear in the supplied context.
- Return valid JSON only.
- Use camelCase field names.
- Use null when an ID or message does not apply.
- Do not claim that an action has already happened.
- Confidence must be a number between 0 and 1.

Return exactly this JSON shape:

{
  "summary": "Short summary of the household state",
  "findings": [
    {
      "findingType": "schedule_conflict",
      "severity": "high",
      "title": "Short title",
      "description": "What needs attention",
      "reasoning": "Why this is the best interpretation",
      "confidence": 0.92,
      "relatedEntityType": "grocery",
      "relatedEntityId": "UUID or null",
      "suggestedMemberId": "UUID or null",
      "proposedAction": "assign_grocery",
      "nudgeMessage": "Targeted message or null"
    }
  ]
}
`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": `${url}`,
      "X-Title": "Household Ops Agent",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(input.context),
        },
      ],
      response_format: {
        type: "json_object",
      },
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenRouter request failed.");
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenRouter returned an empty response.");
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error("OpenRouter returned invalid JSON.");
  }

  const validated = agentResultSchema.safeParse(parsedJson);

  if (!validated.success) {
    console.error("Household agent response validation failed:", {
      issues: validated.error.issues,
      response: parsedJson,
    });
    throw new Error("OpenRouter returned an unexpected agent response shape.");
  }

  return validated.data;
}
