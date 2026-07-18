insert into households (id, name)
values (
  '10000000-0000-0000-0000-000000000001',
  'Maple House'
)
on conflict (id) do nothing;

insert into household_members
  (id, household_id, name, role, color, preferences)
values
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Maya',
  'Student',
  '#8b5cf6',
  '{
    "unavailable": ["weekday evenings 17:00-20:00"],
    "dislikes": ["grocery trips"],
    "preferences": ["quiet tasks"]
  }'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Sam',
  'Remote worker',
  '#2563eb',
  '{
    "capabilities": ["drives", "grocery pickup", "errands"],
    "availability": ["flexible daytime availability"]
  }'
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'Jordan',
  'Night-shift worker',
  '#16a34a',
  '{
    "preferences": ["handles bills"],
    "unavailable": ["early mornings"]
  }'
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  'Priya',
  'Professional',
  '#ea580c',
  '{
    "preferences": ["cleaning tasks"],
    "unavailable": ["weekday mornings"]
  }'
)
on conflict (id) do nothing;

insert into calendar_events
  (id, household_id, member_id, title, starts_at, ends_at, type)
values
(
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'Maya class',
  date_trunc('day', now()) + interval '17 hours',
  date_trunc('day', now()) + interval '20 hours',
  'class'
)
on conflict (id) do nothing;

insert into grocery_items
  (id, household_id, name, quantity, needed_by, assigned_member_id, status, priority)
values
(
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Weekly groceries',
  '1 trip',
  date_trunc('day', now()) + interval '19 hours',
  '20000000-0000-0000-0000-000000000001',
  'needed',
  'high'
)
on conflict (id) do nothing;

insert into bills
  (id, household_id, name, amount, due_at, assigned_member_id, status, notes)
values
(
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Internet bill',
  59.99,
  now() + interval '1 day',
  '20000000-0000-0000-0000-000000000003',
  'upcoming',
  'Monthly internet payment'
)
on conflict (id) do nothing;

insert into chores
  (id, household_id, title, description, assigned_member_id, due_at, recurrence, status)
values
(
  '60000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Take out trash',
  'Move bins to the collection point',
  '20000000-0000-0000-0000-000000000002',
  date_trunc('day', now()) - interval '1 day' + interval '18 hours',
  'weekly',
  'pending'
),
(
  '60000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Clean living room',
  'Vacuum and tidy the living room',
  '20000000-0000-0000-0000-000000000004',
  date_trunc('day', now()) + interval '18 hours',
  'weekly',
  'pending'
),
(
  '60000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000001',
  'Clean bathroom',
  'Clean the shared bathroom',
  '20000000-0000-0000-0000-000000000004',
  date_trunc('day', now()) + interval '19 hours',
  'weekly',
  'pending'
),
(
  '60000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000001',
  'Wash dishes',
  'Empty and clean the kitchen sink',
  '20000000-0000-0000-0000-000000000004',
  date_trunc('day', now()) + interval '20 hours',
  'daily',
  'pending'
),
(
  '60000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  'Organize pantry',
  'Check expired items and reorganize shelves',
  '20000000-0000-0000-0000-000000000004',
  date_trunc('day', now()) + interval '21 hours',
  'monthly',
  'pending'
),
(
  '60000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000001',
  'Clean kitchen',
  'Wipe counters and mop the floor',
  null,
  date_trunc('day', now()) + interval '21 hours',
  'none',
  'pending'
)
on conflict (id) do nothing;