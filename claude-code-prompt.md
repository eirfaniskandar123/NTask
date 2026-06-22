# Claude Code Prompt — Daily Task Manager System

## Overview

Build a personal task manager web app with a daily weekday email digest. The system lets me add and manage tasks, then every weekday morning it sends me a summary email of pending tasks — skipping public holidays detected via Google Calendar.

---

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui (with Tailwind CSS) — use shadcn components as the base for all UI elements
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Email**: Gmail via Nodemailer (Gmail App Password)
- **Scheduled jobs**: Vercel Cron Jobs
- **Public holiday detection**: Google Calendar API (public holiday calendars)

---

## Database Schema (Supabase)

Create this table in Supabase:

```sql
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text check (category in ('Dev', 'Design', 'Meeting', 'Personal')) default 'Dev',
  due_date date,
  everyday boolean default false,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Rules:
- `due_date` is nullable — tasks with no due date and `everyday = true` appear in every weekday digest
- `everyday = true` means notify every weekday regardless of due date
- `done = true` tasks are excluded from the email digest

---

## UI Design Spec

Use **shadcn/ui** as the component foundation. Initialize with:
```bash
npx shadcn@latest init
```
Then add the components needed:
```bash
npx shadcn@latest add button badge card checkbox input select separator progress popover calendar
```

Map shadcn components to the UI as follows:
- Sidebar nav items → plain `<button>` styled with Tailwind, active state via conditional classes
- Count badges → shadcn `<Badge variant="secondary">`
- Task cards → shadcn `<Card>` with custom padding and hover border
- Priority / category / date badges → shadcn `<Badge>` with custom color overrides via `className`
- Checkboxes → shadcn `<Checkbox>` restyled as a circle (use `rounded-full` override)
- Add task form inputs → shadcn `<Input>`, `<Select>`, shadcn `<Calendar>` inside a `<Popover>` for the date picker
- Filter chips → shadcn `<Button variant="outline">` toggled to `variant="default"` when active
- Progress bar → shadcn `<Progress>`
- Cancel / Add buttons → shadcn `<Button variant="outline">` and `<Button>`

### Layout
Two-column layout, full viewport height:
- **Left sidebar** — 200px wide, light background (`#F9F9F8` light / slightly darker in dark mode)
- **Right main area** — fills remaining space, white background

### Sidebar
- Top label: "MY WORKSPACE" in small uppercase muted text
- Navigation items (icon + label + count badge):
  - All tasks
  - Today (tasks due today OR everyday tasks)
  - Upcoming (tasks with future due date)
  - Recurring (everyday = true tasks)
  - Completed
- Divider, then a "Tags" section with colored dot + category name:
  - Dev → purple dot `#534AB7`
  - Design → teal dot `#0F6E56`
  - Meeting → coral dot `#993C1D`
  - Personal → amber dot `#854F0B`
- Footer: small blue info banner showing "Email digest: 8:00 AM"

### Main area — header
- View title (e.g. "All tasks") at 16px font-weight 500
- Subtitle: current date formatted as "Monday, June 22, 2026"
- Top-right: "Add task" button (outline style, small)

### Filter bar
Pill-shaped filter chips below the header: All / High / Medium / Low
Active chip: filled dark background, white text

### Progress bar
Thin 4px bar below filter chips showing completed/total ratio
Label: "X / Y done" in small muted text

### Task cards
Each task is a card with:
- Thin border `0.5px`, rounded corners `border-radius: 12px`
- Hover: slightly darker border
- Left: circular checkbox (toggle done on click). When done: filled dark circle with checkmark
- Right side content:
  - Title: 14px font-weight 500
  - Note (if any): 12px muted, single line with ellipsis overflow
  - Meta row of badges:
    - Priority badge (pill shape):
      - High → red background `#FCEBEB`, red text `#A32D2D`, label "↑ High"
      - Medium → amber background `#FAEEDA`, amber text `#854F0B`, label "→ Medium"
      - Low → green background `#EAF3DE`, green text `#3B6D11`, label "↓ Low"
    - Category badge: light gray background, muted text, colored dot matching sidebar
    - Recurring badge (if everyday = true): blue background `#E6F1FB`, blue text `#185FA5`, "↺ Every weekday"
    - Due date badge (if due_date set): light gray, calendar icon + formatted date (e.g. "Jun 22"). If overdue: red background + "· overdue" suffix
- Done tasks: card opacity 50%, title has strikethrough

### Add task form
Slides in at the bottom of the main area (not a modal). Fields:
- Title input (full width)
- Notes input (full width)
- Row: Priority select | Category select | Date picker
- Checkbox: "Notify every weekday (no due date)"
- Buttons: Cancel | Add (dark filled button)

### Styling notes
- Font: Inter (add via `next/font/google`)
- Use Tailwind utility classes throughout — no custom CSS files unless absolutely necessary
- shadcn's default CSS variables handle light/dark mode automatically — don't override them unless needed for the custom badge colors
- No gradients, no drop shadows (except shadcn focus rings which are fine)
- All corners: `rounded-md` (inputs, badges, chips) or `rounded-xl` (cards)
- Sentence case everywhere, never ALL CAPS in content
- Fully responsive: on mobile, sidebar collapses to a bottom tab bar using Tailwind `md:hidden` / `hidden md:flex` breakpoints

---

## API Routes

### `GET /api/tasks`
Returns all tasks, sorted by: undone first, then by priority (high→medium→low), then by due_date ascending (nulls last).

### `POST /api/tasks`
Create a task. Body: `{ title, note, priority, category, due_date, everyday }`

### `PATCH /api/tasks/[id]`
Update any field. Used for toggling `done`, editing task details.

### `DELETE /api/tasks/[id]`
Delete a task.

### `GET /api/cron/digest`
The cron endpoint. Logic:
1. Check if today is a weekday (Mon–Fri). If not, return early.
2. Call Google Calendar API to check if today is a public holiday in my country. If yes, return early.
3. Fetch all undone tasks where: `everyday = true` OR `due_date <= today`
4. If no tasks, return early (don't send empty email).
5. Send email via Gmail with the task summary (see Email Template below).

---

## Email Template

Subject: `📋 Your tasks for today — [Day, Date]`

HTML email body:
- Header: bold title "Here's what needs your attention today"
- Subtitle: formatted date
- Task list grouped by priority:
  - 🔴 High priority tasks
  - 🟡 Medium priority tasks
  - 🟢 Low priority tasks
- Each task shows: title, note (if any), due date or "Recurring" label
- Footer: "Stay focused. You've got this. — Your Task Manager"
- Simple clean styling, works in Gmail

---

## Vercel Cron Job

In `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 1 * * 1-5"
    }
  ]
}
```
Note: `0 1 * * 1-5` = 1:00 AM UTC = 8:00 AM WIB (UTC+7). Adjust if your timezone differs.

Secure the cron route with a `CRON_SECRET` env variable:
```js
if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

## Environment Variables

Set these in both `.env.local` and Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

GOOGLE_CALENDAR_API_KEY=
HOLIDAY_CALENDAR_ID=en.indonesia#holiday@group.v.calendar.google.com

CRON_SECRET=your-random-secret-string
DIGEST_RECIPIENT=your@gmail.com
```

---

## Google Calendar — Public Holiday Setup

Use the Google Calendar API (no OAuth needed, just an API key) to check public holidays:

```js
const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${todayStart}&timeMax=${todayEnd}&singleEvents=true`;
const res = await fetch(url);
const data = await res.json();
const isHoliday = data.items && data.items.length > 0;
```

Available holiday calendar IDs:
- Indonesia: `en.indonesia#holiday@group.v.calendar.google.com`
- Malaysia: `en.malaysia#holiday@group.v.calendar.google.com`
- Singapore: `en.singapore#holiday@group.v.calendar.google.com`
- (Use whichever matches your country)

---

## Gmail App Password Setup (tell user at the end)

After build is complete, remind me to:
1. Go to myaccount.google.com → Security → 2-Step Verification (must be ON)
2. Search "App passwords" → Create one for "Mail"
3. Copy the 16-character password → paste as `GMAIL_APP_PASSWORD`

---

## Deliverables Checklist

Build everything end-to-end:
- [ ] `npx shadcn@latest init` with Tailwind configured
- [ ] All required shadcn components installed
- [ ] Supabase table + RLS policies (allow all for now, can restrict later)
- [ ] Next.js app with the UI exactly as described using shadcn/ui components
- [ ] All 4 API routes (GET, POST, PATCH, DELETE /api/tasks)
- [ ] Cron route `/api/cron/digest` with holiday check + email send
- [ ] `vercel.json` with cron config
- [ ] `.env.local.example` with all variable names
- [ ] `README.md` with step-by-step setup instructions:
  - Install dependencies + shadcn init
  - Create Supabase project + run SQL
  - Get Google Calendar API key
  - Set up Gmail App Password
  - Deploy to Vercel + set env vars
  - How to test the cron manually

Do not skip the README. I need clear setup steps to go from zero to running.
