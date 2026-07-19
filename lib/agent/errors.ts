export class AgentRunInProgressError extends Error {
  constructor() {
    super("An agent run is already in progress for this household.");
    this.name = "AgentRunInProgressError";
  }
}
