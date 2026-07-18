create extension if not exists "pgcrypto";

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  role text,
  color text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  description text,
  assigned_member_id uuid references household_members(id) on delete set null,
  due_at timestamptz not null,
  recurrence text not null default 'none',
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table grocery_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  quantity text,
  needed_by timestamptz,
  assigned_member_id uuid references household_members(id) on delete set null,
  status text not null default 'needed'
    check (status in ('needed', 'purchased', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  amount numeric(12, 2) not null default 0,
  due_at timestamptz not null,
  assigned_member_id uuid references household_members(id) on delete set null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'paid', 'overdue', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid references household_members(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type text not null default 'personal',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  trigger_type text not null
    check (trigger_type in ('manual', 'scheduled')),
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table agent_findings (
  id uuid primary key default gen_random_uuid(),
  agent_run_id uuid not null references agent_runs(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  finding_type text not null,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high')),
  title text not null,
  description text not null,
  related_entity_type text,
  related_entity_id uuid,
  suggested_member_id uuid references household_members(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'accepted', 'dismissed', 'resolved')),
  created_at timestamptz not null default now()
);

create table nudges (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid not null references household_members(id) on delete cascade,
  agent_finding_id uuid not null references agent_findings(id) on delete cascade,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'read', 'dismissed')),
  created_at timestamptz not null default now()
);

create index chores_household_id_idx
  on chores(household_id);

create index chores_due_at_idx
  on chores(due_at);

create index groceries_household_id_idx
  on grocery_items(household_id);

create index bills_household_id_idx
  on bills(household_id);

create index bills_due_at_idx
  on bills(due_at);

create index calendar_events_household_id_idx
  on calendar_events(household_id);

create index agent_runs_household_id_idx
  on agent_runs(household_id);

create index agent_findings_household_id_idx
  on agent_findings(household_id);

create index nudges_member_id_idx
  on nudges(member_id);

alter table households enable row level security;
alter table profiles enable row level security;
alter table household_members enable row level security;
alter table chores enable row level security;
alter table grocery_items enable row level security;
alter table bills enable row level security;
alter table calendar_events enable row level security;
alter table agent_runs enable row level security;
alter table agent_findings enable row level security;
alter table nudges enable row level security;