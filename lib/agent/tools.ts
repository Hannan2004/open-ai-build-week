export const allowedAgentActions = [
    "no_action",
    "reassign_chore",
    "assign_grocery",
    "remind_bill",
    "create_nudge",
] as const;

export const agentActionInstructions = `
The agent may propose these actions:

1. no_action
   Use when no household intervention is needed.

2. reassign_chore
   Use when a chore should be moved to a more suitable member.

3. assign_grocery
   Use when a grocery item needs an owner.

4. remind_bill
   Use when a bill needs a targeted reminder.

5. create_nudge
   Use when one household member should receive a concise message.

The agent must only propose actions. It must never claim that a database change or nudge was completed.
The application will validate and approve actions separately.
`;