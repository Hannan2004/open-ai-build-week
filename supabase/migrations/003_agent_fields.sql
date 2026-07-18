alter table agent_findings
  add column if not exists reasoning text,
  add column if not exists confidence numeric(3, 2),
  add column if not exists proposed_action text,
  add column if not exists nudge_message text;