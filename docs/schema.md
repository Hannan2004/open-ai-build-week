# Household Ops Agent Database Schema

The application uses Clerk for authentication and Supabase PostgreSQL for household data.

## Design Notes

- Clerk owns user accounts and sessions.
- `profiles.clerk_user_id` maps a Clerk user to an application profile.
- Supabase access is performed server-side.
- Every household-owned record includes `household_id`.
- Simulated household members can exist without a linked Clerk profile.
- All timestamps use UTC.

## Tables

### households

Represents a shared household.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| name | text | Household display name |
| created_at | timestamptz | Defaults to current time |

### profiles

Maps a real application user to their Clerk identity.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| clerk_user_id | text | Required and unique |
| email | text | Required |
| full_name | text | Required |
| created_at | timestamptz | Defaults to current time |

### household_members

Represents real or simulated people in a household.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| profile_id | uuid | Nullable; references `profiles.id` |
| name | text | Display name |
| role | text | Example: parent, student, roommate |
| color | text | UI accent color |
| preferences | jsonb | Scheduling preferences and constraints |
| created_at | timestamptz | Defaults to current time |

### chores

Tracks recurring or one-time household tasks.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| title | text | Required |
| description | text | Optional details |
| assigned_member_id | uuid | Nullable; references `household_members.id` |
| due_at | timestamptz | Required |
| recurrence | text | Example: none, daily, weekly |
| status | text | pending, completed, or cancelled |
| created_at | timestamptz | Defaults to current time |

### grocery_items

Tracks items needed by the household.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| name | text | Required |
| quantity | text | Example: 2 cartons |
| needed_by | timestamptz | Optional deadline |
| assigned_member_id | uuid | Nullable; references `household_members.id` |
| status | text | needed, purchased, or cancelled |
| priority | text | low, medium, or high |
| created_at | timestamptz | Defaults to current time |

### bills

Tracks household bills and payment responsibility.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| name | text | Required |
| amount | numeric | Payment amount |
| due_at | timestamptz | Required |
| assigned_member_id | uuid | Nullable; references `household_members.id` |
| status | text | upcoming, paid, overdue, or cancelled |
| notes | text | Optional details |
| created_at | timestamptz | Defaults to current time |

### calendar_events

Represents availability and conflicts for household members.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| member_id | uuid | Nullable; references `household_members.id` |
| title | text | Required |
| starts_at | timestamptz | Required |
| ends_at | timestamptz | Required |
| type | text | busy, class, work, travel, or personal |
| created_at | timestamptz | Defaults to current time |

### agent_runs

Records every manual or scheduled agent execution.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| trigger_type | text | manual or scheduled |
| status | text | running, completed, or failed |
| summary | text | Short run summary |
| started_at | timestamptz | Required |
| completed_at | timestamptz | Nullable until completion |

### agent_findings

Stores conflicts and recommendations identified by the agent.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| agent_run_id | uuid | References `agent_runs.id` |
| household_id | uuid | References `households.id` |
| finding_type | text | Example: schedule_conflict, overdue_task, bill_due, overload |
| severity | text | low, medium, or high |
| title | text | Short finding title |
| description | text | Human-readable explanation |
| related_entity_type | text | chore, grocery, bill, or event |
| related_entity_id | uuid | Related record ID |
| suggested_member_id | uuid | Nullable; recommended replacement |
| status | text | open, accepted, dismissed, or resolved |
| created_at | timestamptz | Defaults to current time |

### nudges

Represents a message intended for one household member.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key |
| household_id | uuid | References `households.id` |
| member_id | uuid | References `household_members.id` |
| agent_finding_id | uuid | References `agent_findings.id` |
| message | text | Nudge content |
| status | text | pending, sent, read, or dismissed |
| created_at | timestamptz | Defaults to current time |

## Initial Indexes

Add indexes on commonly filtered columns:

- `household_members.household_id`
- `chores.household_id`
- `chores.due_at`
- `grocery_items.household_id`
- `bills.household_id`
- `bills.due_at`
- `calendar_events.household_id`
- `agent_runs.household_id`
- `agent_findings.household_id`
- `nudges.member_id`

## MVP Authorization

For the hackathon MVP, server-side application code will:

1. Read the current Clerk user ID.
2. Find or create the matching profile.
3. Resolve the user's household membership.
4. Include the resolved `household_id` in every database query.

The Supabase service-role key must only be used on the server and must never be sent to the browser.
