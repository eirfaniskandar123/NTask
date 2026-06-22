# NTask+

A personal task manager with a daily weekday email digest. Built with Next.js 14, shadcn/ui, Supabase, and Vercel.

## Features

- Add and manage tasks with priority, category, due dates, and notes
- Views: All, Today, Upcoming, Recurring, Completed, and per-category
- Priority filter chips and done/total progress bar
- Daily 8:00 AM email digest (weekdays only, skips public holidays)
- Public holiday detection via Google Calendar API
- Responsive: sidebar on desktop, bottom tab bar on mobile

---

## Setup Guide

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run this to create the tasks table:

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

-- Allow all operations (tighten later with auth)
create policy "Allow all" on tasks for all using (true) with check (true);
alter table tasks enable row level security;
```

3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Get a Google Calendar API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use existing).
3. Enable the **Google Calendar API**.
4. Go to **Credentials → Create Credentials → API key**.
5. (Optional) Restrict the key to Google Calendar API.
6. Copy the key → `GOOGLE_CALENDAR_API_KEY`.

Available holiday calendar IDs:
| Country | Calendar ID |
|---------|------------|
| Indonesia | `en.indonesia#holiday@group.v.calendar.google.com` |
| Malaysia | `en.malaysia#holiday@group.v.calendar.google.com` |
| Singapore | `en.singapore#holiday@group.v.calendar.google.com` |

Set your country's ID as `HOLIDAY_CALENDAR_ID`.

### 4. Set up Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**.
2. Make sure **2-Step Verification** is ON.
3. Search for **"App passwords"** → Create one for **Mail**.
4. Copy the 16-character password → `GMAIL_APP_PASSWORD`.
5. Set `GMAIL_USER` to your Gmail address.
6. Set `DIGEST_RECIPIENT` to the email where you want digests sent.

### 5. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

GOOGLE_CALENDAR_API_KEY=your-google-api-key
HOLIDAY_CALENDAR_ID=en.indonesia#holiday@group.v.calendar.google.com

CRON_SECRET=some-long-random-string
DIGEST_RECIPIENT=your@gmail.com
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add all environment variables in **Vercel → Project → Settings → Environment Variables** (same as `.env.local`).
4. Deploy. Vercel will automatically pick up the cron job from `vercel.json`.

The cron runs at `0 1 * * 1-5` (1:00 AM UTC = 8:00 AM WIB, weekdays only).

---

## Test the cron manually

After deploying, you can trigger the digest manually with:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-project.vercel.app/api/cron/digest
```

Or locally (start dev server first):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/digest
```

Expected responses:
- `{"sent":true,"taskCount":N,"to":"..."}` — email sent
- `{"skipped":"Weekend"}` — called on a weekend
- `{"skipped":"Public holiday","holiday":"..."}` — today is a holiday
- `{"skipped":"No pending tasks"}` — nothing to send

---

## Database schema

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

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | Get all tasks (sorted) |
| `POST` | `/api/tasks` | Create a task |
| `PATCH` | `/api/tasks/:id` | Update a task (any fields) |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/cron/digest` | Trigger email digest (requires `Authorization: Bearer <CRON_SECRET>`) |
