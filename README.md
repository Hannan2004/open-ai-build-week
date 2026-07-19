# Household Ops Agent

Household Ops Agent is a shared household workspace for chores, groceries, bills, and calendars. Its AI agent reviews the household's live context, identifies issues such as overdue work, scheduling conflicts, and uneven workload, then proposes targeted, explainable actions for a person to approve.

The app is designed for households that want less coordination overhead: fewer missed chores and bills, fewer all-group reminders, and clearer ownership of the next task.

## Features

- Clerk authentication with a public landing page and an authenticated dashboard.
- Shared household dashboard for chores, groceries, bills, and calendar events.
- Create, edit, and complete household records with clear ownership and due dates.
- An LLM-powered Agent Inbox that reasons over the full household context rather than a fixed rule checklist.
- Findings include severity, reasoning, confidence, suggested owner, and a proposed action.
- Human-in-the-loop workflow: approve, dismiss, or apply each recommendation.
- Targeted nudges: create a proposed nudge, review it, and manually send an approval email through Resend.
- Manual agent runs for immediate review and a protected weekly Vercel Cron run every Sunday at 9:00 AM IST.
- Agent run history that distinguishes manual and scheduled runs.
- Loading states for navigation, data updates, approvals, and email actions.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript, App Router
- **Styling:** Tailwind CSS, shadcn/ui, Lucide icons
- **Authentication:** Clerk
- **Database:** Supabase Postgres
- **AI:** OpenRouter Chat Completions with a configurable free model
- **Email:** Resend
- **Scheduling and hosting:** Vercel Cron and Vercel
- **Validation:** Zod

## Local Setup

### Prerequisites

- Node.js 22 or later
- A Clerk application
- A Supabase project
- An OpenRouter API key and an available model
- A Resend API key and verified sender address for nudge emails

### Install and run

```bash
git clone <your-repository-url>
cd household-ops-agent
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell, create the local environment file with:

```powershell
Copy-Item .env.example .env.local
```

### Environment variables

Update `.env.local` with your own credentials. Do not commit this file.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk server secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `OPENROUTER_API_KEY` | OpenRouter API key used by the agent |
| `OPENROUTER_MODEL` | OpenRouter model ID; use an available free model for the MVP |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified Resend sender, for example `Household Ops <onboarding@resend.dev>` |
| `NOTIFICATION_EMAIL` | Your email address; all MVP nudge emails are sent here for review |
| `APP_URL` | `http://localhost:3000` locally and the deployed Vercel URL in production |
| `CRON_SECRET` | Long random secret that protects the cron route |
| `CRON_HOUSEHOLD_ID` | Household UUID processed by the weekly MVP cron run |

The Supabase service role key is used only in server-side modules. Never expose it in client code or use a `NEXT_PUBLIC_` prefix.

## Supabase Setup and Migrations

1. Create a Supabase project.
2. Open **SQL Editor** in Supabase.
3. Run these files in order:

   ```text
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_demo_data.sql
   supabase/migrations/003_agent_fields.sql
   ```

4. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
5. Copy the service-role key into `SUPABASE_SERVICE_ROLE_KEY`.

The second migration creates the demo household, **Maple House**, whose ID is:

```text
10000000-0000-0000-0000-000000000001
```

Use that value for `CRON_HOUSEHOLD_ID` when running the supplied demo data.

## Demo Data

`002_demo_data.sql` creates Maple House with four members, a calendar constraint, an overdue chore, a high-priority grocery trip, an upcoming internet bill, and uneven cleaning work. This gives the agent meaningful context to reason about immediately.

After signing in for the first time, the app creates a profile for the Clerk user and adds it to Maple House. You can then edit the sample records or add your own before running the agent.

## Testing the Agent

1. Start the app with `npm run dev` and sign in.
2. Open `/agent` and select **Run Agent Now**.
3. Wait for the run to complete, then review the agent's summary and findings.
4. Approve a finding, then select **Apply recommendation** to update the relevant chore or grocery assignment.
5. For a finding that proposes a nudge, apply the recommendation. The nudge becomes `pending`.
6. Select **Send nudge email**. Resend sends the review email to `NOTIFICATION_EMAIL`, then the nudge status becomes `sent`.
7. Confirm the run history records the manual run, summary, status, and finding count.

## Testing the Cron Route

The project includes this Vercel Cron configuration in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/run-agent",
      "schedule": "30 3 * * 0"
    }
  ]
}
```

Vercel schedules Cron in UTC. `30 3 * * 0` runs at **9:00 AM IST every Sunday**.

Test the protected route locally after setting `CRON_SECRET` and `CRON_HOUSEHOLD_ID`:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/cron/run-agent" `
  -Method Get `
  -Headers @{ Authorization = "Bearer YOUR_CRON_SECRET" }
```

Expected result:

```json
{
  "success": true,
  "triggerType": "scheduled"
}
```

Open `/agent` afterwards and confirm the run history labels the new entry as `scheduled`.

For Vercel deployment, add every variable from `.env.example` to the Production environment. Set `APP_URL` to the deployed URL. Vercel sends the configured cron request to the protected route automatically.

## Quality Checks

```bash
npm run lint
npm run build
```

## How Codex Accelerated Development

Codex was used as a hands-on engineering collaborator throughout this project. It accelerated:

- Designing the Postgres schema, migrations, and realistic household demo data.
- Building the Next.js CRUD workflows and Clerk-authenticated household context.
- Implementing the OpenRouter agent pipeline, structured Zod validation, finding persistence, and duplicate-run protection.
- Building the review, approval, recommendation-application, and targeted nudge workflows.
- Integrating Resend for the human-reviewed email step.
- Refactoring the agent so manual requests and Vercel Cron share the same execution pipeline.
- Improving the final product experience with loading states, run-history visibility, and a dedicated landing page.
- Verifying the project with lint and production-build checks.

The runtime agent intentionally uses a configurable OpenRouter model so the MVP can be run with a free available model. The app relies on LLM reasoning over household context to generate proposals; it does not use a fixed deterministic decision checklist.

> **Transparency note:** Codex was used to accelerate the project's development. The deployed runtime household agent uses a configurable free OpenRouter model, not GPT-5.6.

## License

This project is licensed under the [MIT License](LICENSE).
