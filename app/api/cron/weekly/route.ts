export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServiceSupabase } from "@/lib/supabase";
import { format, startOfWeek, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const today = new Date();

  // Monday of this week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const [{ data: pending }, { data: completed }, { data: tagRows }] =
    await Promise.all([
      supabase.from("tasks").select("*").eq("done", false),
      supabase
        .from("tasks")
        .select("*")
        .eq("done", true)
        .gte("updated_at", weekStart.toISOString()),
      supabase.from("tags").select("name, color"),
    ]);

  const tagColors: Record<string, string> = {};
  for (const row of tagRows ?? []) tagColors[row.name] = row.color;

  const weekLabel = `${format(weekStart, "MMM d")} – ${format(today, "MMM d, yyyy")}`;

  function taskRow(t: { title: string; priority: string; category: string }): string {
    const colors: Record<string, string> = { high: "#A32D2D", medium: "#854F0B", low: "#3B6D11" };
    const catColor = tagColors[t.category] ?? "#888";
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${catColor};flex-shrink:0;display:inline-block;"></span>
            <span style="font-size:14px;color:#111;font-weight:500;">${t.title}</span>
            <span style="font-size:11px;color:${colors[t.priority] ?? '#888'};margin-left:auto;">${t.priority}</span>
          </div>
        </td>
      </tr>`;
  }

  function section(title: string, tasks: typeof pending, emptyMsg: string): string {
    return `
      <tr><td style="padding:20px 0 8px;">
        <div style="font-size:13px;font-weight:700;color:#111;border-bottom:2px solid #f0f0f0;padding-bottom:6px;">${title}</div>
      </td></tr>
      ${tasks && tasks.length > 0
        ? tasks.map(taskRow).join("")
        : `<tr><td style="padding:8px 0;color:#9ca3af;font-size:13px;">${emptyMsg}</td></tr>`
      }`;
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr>
          <td style="background:#111827;padding:28px 32px;">
            <div style="color:#fff;font-size:20px;font-weight:700;">📊 Weekly Summary</div>
            <div style="color:#9ca3af;font-size:13px;margin-top:4px;">${weekLabel}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 24px;">
            <div style="display:flex;gap:24px;margin:20px 0 4px;">
              <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#111;">${completed?.length ?? 0}</div>
                <div style="font-size:12px;color:#6b7280;">completed</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:28px;font-weight:700;color:#111;">${pending?.length ?? 0}</div>
                <div style="font-size:12px;color:#6b7280;">still pending</div>
              </div>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${section(`✅ Completed this week (${completed?.length ?? 0})`, completed, "Nothing completed this week.")}
              ${section(`⏳ Still pending (${pending?.length ?? 0})`, pending, "All clear — no pending tasks!")}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <div style="color:#6b7280;font-size:12px;text-align:center;">
              Have a great weekend. — NTask+
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: `"NTask+" <${process.env.GMAIL_USER}>`,
    to: process.env.DIGEST_RECIPIENT,
    subject: `📊 Weekly summary — ${weekLabel}`,
    html,
  });

  return NextResponse.json({
    sent: true,
    completed: completed?.length ?? 0,
    pending: pending?.length ?? 0,
  });
}
