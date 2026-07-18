# Household Ops Agent Hackathon Plan

## Project

Household Ops Agent coordinates shared household logistics across chores, groceries, bills, and calendars. An LLM agent inspects the household context, reasons about conflicts, recommends practical resolutions, and sends a nudge to the right household member instead of notifying everyone.

## MVP Scope

- Clerk authentication
- One demo household called Maple House
- Household members with availability and preferences
- Chores, groceries, bills, and calendar events
- Dashboard with urgent items and workload summary
- CRUD workflows for household records
- Fully agentic household reasoning powered by an OpenRouter free model
- LLM tool calls for inspection, recommendations, assignment changes, and nudges
- Manual `Run Agent Now` button
- Scheduled Vercel Cron agent run
- Agent Inbox with findings, suggested assignees, and targeted nudges
- Public deployment and reproducible README

## Technical Stack

- Next.js 16 with App Router and TypeScript
- Tailwind CSS and shadcn/ui
- Clerk for authentication
- Supabase PostgreSQL for application data
- OpenRouter free model for agent reasoning and tool selection
- Vercel Hobby for hosting and Cron
- GitHub for source control

## Daily Schedule

### July 15: Foundation - Completed

- Scaffold the Next.js application.
- Install UI, validation, date, and Supabase packages.
- Create the Clerk application.
- Configure Clerk provider, sign-in, sign-up, protected routes, and user button.
- Create the Supabase project.
- Document the database schema in `docs/schema.md`.
- Document Maple House demo data in `docs/demo-data.md`.
- Confirm that `.env.local` is ignored by Git.

### July 16: Household Data and Agent-Ready Core UI

- Create the Supabase tables from `docs/schema.md`.
- Add the first authenticated profile and Maple House membership.
- Add server-side Supabase helpers.
- Build the shared application shell and navigation.
- Build the dashboard summary view.
- Build chores list and create/edit/complete flows.
- Build groceries list and create/edit/purchase flows.
- Build bills list and paid/unpaid flows.
- Add loading, empty, and error states.
- Seed the demo scenarios from `docs/demo-data.md`.
- Define agent tool contracts and permitted actions.
- Include availability, preferences, capabilities, and workload in household member data.

### July 17: Calendar and Agent Reasoning Loop

- Build the calendar or schedule view.
- Display member availability and household events.
- Build the agent context loader for tasks, bills, groceries, calendar events, members, preferences, and recent findings.
- Define the agent system prompt and household decision policy.
- Give the agent tools to inspect household records and member schedules.
- Ask the agent to identify conflicts, prioritize them, explain its reasoning, and propose resolutions.
- Require structured output for findings, suggested members, confidence, reasoning, and proposed actions.
- Store every run in `agent_runs`.
- Store findings in `agent_findings`.
- Add an Agent Inbox page.
- Add `Run Agent Now` using the LLM agent loop.

### July 18: OpenRouter Agent Tools and Nudges

- Create the OpenRouter server-side client.
- Configure the selected free model through `OPENROUTER_MODEL`.
- Send the agent a structured household snapshot and clear operating instructions.
- Let the model decide which records require attention instead of using hard-coded conflict rules.
- Let the model choose the best member using schedule, preferences, capabilities, workload, and task context.
- Let the model produce concise explanations and targeted nudge messages.
- Add tools to propose assignment changes, create nudges, and resolve findings.
- Validate the model response with Zod.
- Retry malformed responses once with a correction prompt.
- Show a clear failed-run state if OpenRouter is unavailable; do not pretend an agent decision was made.
- Save targeted messages in `nudges`.
- Add accept, dismiss, and resolve actions to findings.

### July 19: Agent Execution, Approval, and Product Polish

- Add the protected `/api/agent/run` endpoint for the manual button.
- Add `/api/cron/run-agent` for scheduled execution.
- Protect the Cron endpoint with `CRON_SECRET`.
- Add `vercel.json` with one or two daily Cron schedules.
- Confirm manual and scheduled runs use the same agent pipeline and tools.
- Add an approval step before assignment changes or targeted nudges are committed.
- Display the agent's reasoning summary, confidence, proposed action, and affected records.
- Prevent duplicate nudges and repeated actions for the same unresolved finding.
- Add run history and the last-run timestamp to the Agent Inbox.
- Improve responsive layouts and mobile navigation.
- Add clear success, failure, and retry states.

### July 20: Deployment and Demo Readiness

- Deploy the application to Vercel Hobby.
- Add Clerk, Supabase, OpenRouter, and Cron environment variables in Vercel.
- Configure Clerk production URLs and redirect behavior.
- Test the deployed application with a fresh account.
- Test the manual agent run in production.
- Verify the Vercel Cron endpoint and inspect execution logs.
- Finish the README with setup, sample data, environment variables, and architecture.
- Capture screenshots and prepare the demo script.
- Record the Codex session ID used for the core implementation.

### July 21: Final Verification and Submission

- Run a complete clean-user test from sign-up through agent resolution.
- Verify desktop and mobile layouts.
- Verify no secrets are committed to GitHub.
- Confirm the public repository and deployment URL work.
- Record a public YouTube demo under three minutes.
- Explain how Codex accelerated implementation and how the runtime uses a free OpenRouter model.
- Submit the category, description, demo URL, repository URL, README, and Codex feedback session ID before 5:00 PM PT.

## Agent Architecture

```text
Manual button or Vercel Cron
          |
          v
Agent run endpoint
          |
          v
Load household state from Supabase
          |
          v
LLM agent reasoning loop
          |
          v
Agent tools: inspect, propose, assign, nudge, resolve
          |
          v
Validate output and enforce permissions
          |
          v
Save run, findings, assignments, and nudges
          |
          v
Agent Inbox
```

The LLM is responsible for household reasoning. The application is responsible for identity, authorization, validation, persistence, idempotency, and preventing unsupported actions.

## Agent Behavior

The agent should:

- Inspect relevant household state before making a recommendation.
- Consider availability, preferences, capabilities, workload, deadlines, and existing assignments.
- Identify issues that are not explicitly listed as application rules.
- Explain why an issue matters and why a member is recommended.
- Prefer one targeted nudge over a household-wide notification.
- Ask for approval before changing an assignment or creating a nudge.
- Avoid inventing events, preferences, people, or completed actions.
- Return structured output that the application can validate and display.

## Non-Agentic Guardrails

These protections do not decide household logic:

- Clerk authentication and household membership checks.
- Server-only access to Supabase credentials.
- Zod validation of model responses and tool arguments.
- Allowlisted tools and writable database fields.
- Duplicate-action and duplicate-nudge prevention.
- Clear failed-run status when the model is unavailable.
- Human approval for assignment changes and nudges during the MVP.

## Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_MODEL=
CRON_SECRET=
```

Never commit `.env.local` or expose server-only secrets in client components.

## Definition of Done

The MVP is complete when a new user can sign in, view Maple House, manage household records, run the agent manually, see actionable findings, accept or dismiss a recommendation, and rely on Vercel Cron to run the same workflow automatically.
