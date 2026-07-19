import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageCircle,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { RunAgentButton } from "@/components/agent/run-agent-button";
import { getCurrentHouseholdContext } from "@/lib/household-context";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { acceptFinding, applyFinding, dismissFinding } from "./actions";
import { dismissNudge, sendNudgeToAdmin } from "./nudge-actions";

type AgentRun = {
  id: string;
  trigger_type: string;
  status: string;
  summary: string | null;
  started_at: string;
  completed_at: string | null;
};

type AgentFinding = {
  id: string;
  agent_run_id: string;
  finding_type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  reasoning: string | null;
  confidence: number | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  suggested_member_id: string | null;
  proposed_action: string | null;
  nudge_message: string | null;
  status: string;
  created_at: string;
};

type Member = {
  id: string;
  name: string;
};

type Nudge = {
  id: string;
  agent_finding_id: string;
  status: string;
};

const severityStyles = {
  high: "destructive",
  medium: "outline",
  low: "secondary",
} as const;

export default async function AgentPage() {
  const { household, membership } = await getCurrentHouseholdContext();

  const [runsResult, findingsResult, membersResult, nudgesResult] = await Promise.all([
    supabaseAdmin
      .from("agent_runs")
      .select("id, trigger_type, status, summary, started_at, completed_at")
      .eq("household_id", household.id)
      .order("started_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("agent_findings")
      .select(
        "id, agent_run_id, finding_type, severity, title, description, reasoning, confidence, related_entity_type, related_entity_id, suggested_member_id, proposed_action, nudge_message, status, created_at",
      )
      .eq("household_id", household.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("household_members")
      .select("id, name")
      .eq("household_id", household.id),
    supabaseAdmin
      .from("nudges")
      .select("id, agent_finding_id, status")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false }),
  ]);

  const queryError = [runsResult.error, findingsResult.error, membersResult.error, nudgesResult.error].find(Boolean);

  if (queryError) {
    throw new Error(queryError.message);
  }

  const runs = (runsResult.data ?? []) as AgentRun[];
  const findings = (findingsResult.data ?? []) as AgentFinding[];
  const members = (membersResult.data ?? []) as Member[];
  const nudges = (nudgesResult.data ?? []) as Nudge[];
  const memberNames = new Map(members.map((member) => [member.id, member.name]));
  const latestRun = runs[0];
  const openFindings = findings.filter((finding) => finding.status === "open");
  const isAgentRunning = runs.some((run) => run.status === "running");
  const findingCountsByRun = new Map<string, number>();

  for (const finding of findings) {
    findingCountsByRun.set(
      finding.agent_run_id,
      (findingCountsByRun.get(finding.agent_run_id) ?? 0) + 1,
    );
  }
  
  return (
    <AppShell householdName={household.name} memberName={membership.name}>
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-muted-foreground">Household intelligence</p>
            <h1 className="text-3xl font-bold tracking-tight">Agent Inbox</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              Review the agent&apos;s reasoning and approve the next household decisions.
            </p>
          </div>
          <RunAgentButton isAgentRunning={isAgentRunning} />
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Agent summary">
          <SummaryCard
            icon={AlertCircle}
            label="Open findings"
            value={openFindings.length}
            detail="Waiting for review"
          />
          <SummaryCard
            icon={Clock3}
            label="Latest run"
            value={latestRun ? latestRun.status : "New"}
            detail={latestRun ? formatDistanceToNow(new Date(latestRun.started_at), { addSuffix: true }) : "No run yet"}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Runs completed"
            value={runs.filter((run) => run.status === "completed").length}
            detail="Manual runs so far"
          />
        </section>

        {latestRun && (
          <section className="rounded-lg border bg-background p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">Latest agent summary</h2>
                  <Badge variant={latestRun.status === "completed" ? "secondary" : "outline"}>
                    {latestRun.status}
                  </Badge>
                  <Badge variant="outline">{latestRun.trigger_type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Started {format(new Date(latestRun.started_at), "MMM d, yyyy 'at' p")}
                </p>
              </div>
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Back to dashboard
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6">
              {latestRun.summary || "The agent did not provide a summary for this run."}
            </p>
          </section>
        )}

        <section className="rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Run history</h2>
              <p className="text-sm text-muted-foreground">
                Manual runs now, scheduled runs after Vercel Cron is connected.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {runs.length} {runs.length === 1 ? "run" : "runs"}
            </span>
          </div>

          <div className="divide-y">
            {runs.map((run) => {
              const findingCount = findingCountsByRun.get(run.id) ?? 0;
              const isCompleted = run.status === "completed";
              const isFailed = run.status === "failed";

              return (
                <div
                  key={run.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          isCompleted
                            ? "secondary"
                            : isFailed
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {run.status}
                      </Badge>
                      <Badge variant="outline">{run.trigger_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {findingCount} {findingCount === 1 ? "finding" : "findings"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6">
                      {run.summary || "No summary was returned for this run."}
                    </p>
                  </div>

                  <div className="shrink-0 text-sm text-muted-foreground sm:text-right">
                    <p>{format(new Date(run.started_at), "MMM d, yyyy 'at' p")}</p>
                    <p className="mt-1 text-xs">
                      {run.completed_at
                        ? `Finished ${formatDistanceToNow(new Date(run.completed_at), { addSuffix: true })}`
                        : "Still running"}
                    </p>
                  </div>
                </div>
              );
            })}

            {runs.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground">
                No agent runs yet. Run the agent to create the first history entry.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Findings</h2>
            <p className="text-sm text-muted-foreground">
              Recommendations are proposals until you approve them.
            </p>
          </div>

          {findings.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-background px-6 py-12 text-center">
              <Lightbulb className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">No findings yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Run the agent to have it inspect Maple House.
              </p>
            </div>
          ) : (
            findings.map((finding) => {
              const suggestedMember = finding.suggested_member_id
                ? memberNames.get(finding.suggested_member_id)
                : null;
              const isOpen = finding.status === "open";
              const relatedNudge = nudges.find(
                (nudge) => nudge.agent_finding_id === finding.id,
              );
              
              return (
                <article key={finding.id} className="rounded-lg border bg-background p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={severityStyles[finding.severity]}>
                          {finding.severity} priority
                        </Badge>
                        <Badge variant="outline">{finding.finding_type.replaceAll("_", " ")}</Badge>
                        <Badge variant={isOpen ? "outline" : "secondary"}>{finding.status}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold">{finding.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.description}</p>
                    </div>

                    {isOpen && (
                      <div className="flex shrink-0 items-start gap-2">
                        <form action={acceptFinding}>
                          <input type="hidden" name="findingId" value={finding.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            Approve
                          </button>
                        </form>

                        <form action={dismissFinding}>
                          <input type="hidden" name="findingId" value={finding.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                          >
                            Dismiss
                          </button>
                        </form>
                      </div>
                    )}

                    {finding.status === "accepted" && (
                      <form action={applyFinding} className="shrink-0">
                        <input type="hidden" name="findingId" value={finding.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          Apply recommendation
                        </button>
                      </form>
                    )}

                    {relatedNudge?.status === "pending" && (
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Badge variant="outline">Nudge pending</Badge>
                        <form action={sendNudgeToAdmin}>
                          <input
                            type="hidden"
                            name="nudgeId"
                            value={relatedNudge.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                          >
                            Send nudge email
                          </button>
                        </form>
                        <form action={dismissNudge}>
                          <input
                            type="hidden"
                            name="nudgeId"
                            value={relatedNudge.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
                          >
                            Dismiss nudge
                          </button>
                        </form>
                      </div>
                    )}

                    {relatedNudge?.status === "sent" && (
                      <Badge variant="secondary">Email sent</Badge>
                    )}

                    {relatedNudge?.status === "dismissed" && (
                      <Badge variant="outline">Nudge dismissed</Badge>
                    )}
                  </div>

                  <div className="mt-5 grid gap-4 border-t pt-5 md:grid-cols-3">
                    <InfoBlock label="Agent reasoning" icon={Lightbulb}>
                      {finding.reasoning || "No reasoning provided."}
                    </InfoBlock>
                    <InfoBlock label="Suggested owner" icon={ShieldAlert}>
                      {suggestedMember || "No member suggested"}
                      {finding.proposed_action && (
                        <span className="mt-1 block text-xs capitalize text-muted-foreground">
                          Action: {finding.proposed_action.replaceAll("_", " ")}
                        </span>
                      )}
                    </InfoBlock>
                    <InfoBlock label="Targeted nudge" icon={MessageCircle}>
                      {finding.nudge_message || "No nudge proposed."}
                    </InfoBlock>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Confidence: {finding.confidence === null ? "Unknown" : `${Math.round(finding.confidence * 100)}%`}</span>
                    {finding.related_entity_type && <span>Related: {finding.related_entity_type.replaceAll("_", " ")}</span>}
                    <span>Found {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true })}</span>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof AlertCircle;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold capitalize">{value}</p>
        </div>
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function InfoBlock({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Lightbulb;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
