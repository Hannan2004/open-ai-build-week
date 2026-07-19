import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendNudgeApprovalEmail(input: {
  nudgeId: string;
  householdName: string;
  targetMemberName: string;
  findingTitle: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipient = process.env.NOTIFICATION_EMAIL;
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  if (!from) {
    throw new Error("Missing RESEND_FROM_EMAIL.");
  }

  if (!recipient) {
    throw new Error("Missing NOTIFICATION_EMAIL.");
  }

  const resend = new Resend(apiKey);

  const safeHouseholdName = escapeHtml(input.householdName);
  const safeTargetMemberName = escapeHtml(input.targetMemberName);
  const safeFindingTitle = escapeHtml(input.findingTitle);
  const safeMessage = escapeHtml(input.message);
  const inboxUrl = `${appUrl}/agent`;

  const { data, error } = await resend.emails.send({
    from,
    to: [recipient],
    subject: `[Household Ops] Nudge approval: ${input.findingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Household Ops Agent nudge</h2>

        <p>
          The agent found an issue in
          <strong>${safeHouseholdName}</strong>.
        </p>

        <p>
          <strong>Finding:</strong> ${safeFindingTitle}
        </p>

        <p>
          <strong>Intended household member:</strong>
          ${safeTargetMemberName}
        </p>

        <p>
          <strong>Proposed message:</strong>
        </p>

        <blockquote style="border-left: 3px solid #888; padding-left: 12px;">
          ${safeMessage}
        </blockquote>

        <p>
          Review and approve this nudge in Agent Inbox:
        </p>

        <p>
          <a href="${inboxUrl}">${inboxUrl}</a>
        </p>
      </div>
    `,
    text: `
Household Ops Agent nudge

Household: ${input.householdName}
Finding: ${input.findingTitle}
Intended member: ${input.targetMemberName}

Proposed message:
${input.message}

Review this nudge in Agent Inbox:
${inboxUrl}
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.id) {
    throw new Error("Resend did not return an email ID.");
  }

  return data.id;
}