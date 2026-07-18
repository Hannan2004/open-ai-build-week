import { z } from "zod";

export const agentFindingSchema = z.object({
  findingType: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  title: z.string().min(1),
  description: z.string().min(1),
  reasoning: z.string().min(1),
  confidence: z.number().min(0).max(1),
  relatedEntityType: z
    .enum(["chore", "grocery", "bill", "calendar_event"])
    .nullable(),
  relatedEntityId: z.string().uuid().nullable(),
  suggestedMemberId: z.string().uuid().nullable(),
  proposedAction: z.enum([
    "no_action",
    "reassign_chore",
    "assign_grocery",
    "remind_bill",
    "create_nudge",
  ]),
  nudgeMessage: z.string().nullable(),
});

export const agentResultSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(agentFindingSchema).max(20),
});

export type AgentResult = z.infer<typeof agentResultSchema>;