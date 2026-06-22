import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServiceSupabase } from "@/lib/supabase";
import { buildDigestHtml } from "@/lib/email";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat

  // Skip weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return NextResponse.json({ skipped: "Weekend" });
  }

  // Check public holidays via Google Calendar
  const calendarId = process.env.HOLIDAY_CALENDAR_ID ?? "en.indonesia#holiday@group.v.calendar.google.com";
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

  if (apiKey) {
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const calUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events?key=${apiKey}&timeMin=${todayStart.toISOString()}&timeMax=${todayEnd.toISOString()}&singleEvents=true`;

    try {
      const calRes = await fetch(calUrl);
      const calData = await calRes.json();
      if (calData.items && calData.items.length > 0) {
        return NextResponse.json({
          skipped: "Public holiday",
          holiday: calData.items[0]?.summary,
        });
      }
    } catch {
      // If calendar check fails, proceed with sending
    }
  }

  // Fetch tasks
  const supabase = getServiceSupabase();
  const todayStr = format(today, "yyyy-MM-dd");

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("done", false)
    .or(`everyday.eq.true,due_date.lte.${todayStr}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ skipped: "No pending tasks" });
  }

  // Build and send email
  const html = buildDigestHtml(tasks, today);
  const dayLabel = format(today, "EEEE, MMMM d, yyyy");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"NTask+" <${process.env.GMAIL_USER}>`,
    to: process.env.DIGEST_RECIPIENT,
    subject: `📋 Your tasks for today — ${dayLabel}`,
    html,
  });

  return NextResponse.json({
    sent: true,
    taskCount: tasks.length,
    to: process.env.DIGEST_RECIPIENT,
  });
}
