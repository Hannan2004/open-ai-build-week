"use client";

import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function RunAgentButton({
  isAgentRunning = false,
}: {
  isAgentRunning?: boolean;
}) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/agent/run", { method: "POST" });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          response.status === 409
            ? "An agent run is already in progress. Please wait for it to finish."
            : result.error || "Agent run failed.",
        );
      }

      router.refresh();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Agent run failed.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRun}
        disabled={isRunning || isAgentRunning}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRunning ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="size-4" aria-hidden="true" />
        )}
        {isRunning
          ? "Agent is thinking..."
          : isAgentRunning
            ? "Agent run in progress"
            : "Run Agent Now"}
      </button>

      {error && <p className="max-w-xs text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
