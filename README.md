# NTask+

A personal task manager with daily email digest. Built with Next.js 14, Supabase, Tiptap, and Vercel.

## Features

- Add, edit, delete tasks with priority, tag, due date, and rich-text notes (WYSIWYG)
- Views: All, Today, Upcoming, Recurring, Completed, per-tag
- Priority filter chips and done/total progress bar
- Daily 8:00 AM email digest (weekdays only, skips public holidays)
- Email sort by priority or tag (configurable in settings)
- Dynamic tag management (add/rename/delete via settings)
- Single-user login (password-protected)
- Public holiday detection via Google Calendar API
- Responsive: sidebar on desktop, bottom tab bar on mobile

---

## Roadmap

| # | Feature | Status |
|---|---------|--------|
| 1 | Task detail modal (view full note + info) | ⬜ Next |
| 2 | Email digest preview (see email before it sends) | ⬜ |
| 3 | Weekly digest email (Friday summary) | ⬜ |
| 4 | Task completion stats (sidebar widget) | ⬜ |
| 5 | PWA (installable on mobile) | ⬜ |
| 6 | Dark mode | ⬜ |
| 7 | Subtasks (checklist inside a task) | ⬜ |

---

## Setup Guide

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase — run these SQL blocks in order

```sql
-- Tasks table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  note text,
  priority text check (priority in ('high', 'medium', 'low')) default 'medium',
  category text default 'General',
  due_date date,
  everyday boolean default false,
  done boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create policy "Allow all" on tasks for all using (true) with check (true);
alter table tasks enable row level security;
```

```sql
-- Tags table (dynamic categories)
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#888888',
  created_at timestamptz default now()
);
create policy "Allow all" on tags for all using (true) with check (true);
alter table tags enable row level security;

insert into tags (name, color) values
  ('Dev', '#534AB7'),
  ('Design', '#0F6E56'),
  ('Meeting', '#993C1D'),
  ('Personal', '#854F0B');
```

```sql
-- Settings table (email preferences)
create table app_settings (
  key text primary key,
  value text not null
);
insert into app_settings (key, value) values ('digest_sort_by', 'priority');
```

Go to **Project Settings → API** and copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Google Calendar API key (public holiday detection)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Google Calendar API**
3. Create an **API key** under Credentials
4. Copy → `GOOGLE_CALENDAR_API_KEY`

| Country | `HOLIDAY_CALENDAR_ID` |
|---------|----------------------|
| Malaysia | `en.malaysia#holiday@group.v.calendar.google.com` |
| Indonesia | `en.indonesia#holiday@group.v.calendar.google.com` |
| Singapore | `en.singapore#holiday@group.v.calendar.google.com` |

### 4. Gmail App Password

1. [myaccount.google.com](https://myaccount.google.com) → Security → 2-Step Verification ON
2. Search "App passwords" → create one for Mail
3. Copy 16-char password → `GMAIL_APP_PASSWORD`

### 5. Environment variables

Copy and fill `.env.local`:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

GOOGLE_CALENDAR_API_KEY=
HOLIDAY_CALENDAR_ID=en.malaysia#holiday@group.v.calendar.google.com

CRON_SECRET=random-secret-string
DIGEST_RECIPIENT=your@gmail.com

LOGIN_PASSWORD=your-app-password
SESSION_SECRET=random-32-char-string
```

### 6. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add all env vars in **Project → Settings → Environment Variables**
4. Deploy — Vercel picks up the cron from `vercel.json` automatically

Cron schedule: `0 0 * * 1-5` = midnight UTC = **8:00 AM Malaysia time**, weekdays only.

---

## Test cron manually

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/digest
```

Responses:
- `{"sent":true,"taskCount":N}` — email sent
- `{"skipped":"Weekend"}` — weekend
- `{"skipped":"Public holiday","holiday":"..."}` — holiday
- `{"skipped":"No pending tasks"}` — nothing to send

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create task |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/tags` | List all tags |
| `POST` | `/api/tags` | Create tag |
| `PATCH` | `/api/tags/:id` | Update tag |
| `DELETE` | `/api/tags/:id` | Delete tag (blocked if in use) |
| `GET` | `/api/settings` | Get all settings |
| `PATCH` | `/api/settings` | Update a setting |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/cron/digest` | Trigger email digest (Bearer token) |
