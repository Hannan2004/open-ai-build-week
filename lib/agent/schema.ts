import { z } from "zod";

const nullableModelString = z.string().nullable().default(null);

export const agentFindingSchema = z.object({
  findingType: z.string().min(1),
  severity: z.preprocess(
    (value) =>
      typeof value === "string" && ["low", "medium", "high"].includes(value)
        ? value
        : "medium",
    z.enum(["low", "medium", "high"]),
  ),
  title: z.string().min(1),
  description: z.string().min(1),
  reasoning: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1),
  relatedEntityType: nullableModelString,
  relatedEntityId: nullableModelString,
  suggestedMemberId: nullableModelString,
  proposedAction: z.string().default("no_action"),
  nudgeMessage: nullableModelString,
});

export const agentResultSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(agentFindingSchema).max(20),
});

export type AgentResult = z.infer<typeof agentResultSchema>;
