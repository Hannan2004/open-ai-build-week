# Household Ops Agent Demo Data

The demo household is called **Maple House**. It contains four simulated members so the agent can demonstrate assignment decisions, scheduling conflicts, and targeted nudges.

## Household

| Name | Description |
| --- | --- |
| Maple House | A shared household with chores, groceries, bills, and personal schedules |

## Members

### Maya

- Role: Student
- Availability: Unavailable from 5:00 PM to 8:00 PM on weekdays
- Preference: Dislikes grocery trips
- Agent implication: Avoid assigning evening errands to Maya when another suitable member is available

### Sam

- Role: Remote worker
- Availability: Flexible during the day
- Capability: Owns a car
- Preference: Good for errands
- Agent implication: Suitable replacement for grocery pickup and other transport-related tasks

### Jordan

- Role: Night-shift worker
- Availability: Usually available during the day, sleeps in the morning
- Preference: Often handles household bills
- Agent implication: Keep bill reminders targeted to Jordan and avoid early-morning chores

### Priya

- Role: Busy professional
- Availability: Limited in the morning
- Preference: Prefers cleaning tasks
- Agent implication: Cleaning tasks are acceptable, but several tasks on the same day may indicate overload

## Seed Scenarios

### 1. Grocery scheduling conflict

- Task: Pick up groceries
- Assigned member: Maya
- Deadline: 7:00 PM today
- Conflict: Maya has class from 5:00 PM to 8:00 PM
- Recommended resolution: Reassign the task to Sam
- Nudge target: Sam

Expected agent finding:

> Maya is unavailable when the grocery pickup is due. Sam is available and owns a car, so Sam is the best replacement.

### 2. Urgent unpaid bill

- Bill: Internet
- Assigned member: Jordan
- Status: Unpaid
- Due date: Tomorrow
- Severity: High
- Nudge target: Jordan

Expected agent finding:

> The internet bill is due within 48 hours and is still unpaid. Remind Jordan directly.

### 3. Overdue chore

- Chore: Take out trash
- Assigned member: Sam
- Due date: Yesterday
- Status: Pending
- Severity: Medium
- Nudge target: Sam

Expected agent finding:

> The trash chore is overdue. Nudge Sam instead of notifying the entire household.

### 4. Member overload

- Member: Priya
- Tasks due today: Four chores
- Other members: One or fewer chores each
- Severity: Medium
- Recommended resolution: Suggest moving one task to Sam or Maya, depending on availability

Expected agent finding:

> Priya has a much heavier task load today than the rest of the household. Suggest moving one suitable chore.

### 5. Unassigned chore

- Chore: Clean the kitchen
- Assigned member: Nobody
- Deadline: Tonight
- Severity: Medium
- Recommended resolution: Suggest a member based on availability and preferences

Expected agent finding:

> Kitchen cleanup is due tonight but has no owner. Recommend an available member and ask only that person.

## Demo Sequence

Use this sequence for the first product demonstration:

1. Sign in with the demo account.
2. Open the household dashboard.
3. Show the grocery task assigned to Maya.
4. Open the calendar and show Maya's class conflict.
5. Click **Run Agent Now**.
6. Open the Agent Inbox.
7. Show the grocery reassignment recommendation for Sam.
8. Show the targeted bill nudge for Jordan.
9. Show the overdue trash reminder for Sam.
10. Explain that the scheduled Vercel Cron run uses the same agent pipeline automatically.

## Expected MVP Result

After an agent run, the Agent Inbox should show findings grouped by severity and identify one recommended person for each actionable issue. The system should avoid sending a household-wide message when one member can handle the issue.
