import { Task } from "./types";
import { format } from "date-fns";

function groupByPriority(tasks: Task[]) {
  return {
    high: tasks.filter((t) => t.priority === "high"),
    medium: tasks.filter((t) => t.priority === "medium"),
    low: tasks.filter((t) => t.priority === "low"),
  };
}

function taskRow(task: Task): string {
  const dueLine = task.everyday
    ? `<span style="color:#185FA5;font-size:12px;">↺ Recurring every weekday</span>`
    : task.due_date
    ? `<span style="color:#6b7280;font-size:12px;">📅 Due ${format(new Date(task.due_date + "T00:00:00"), "MMM d, yyyy")}</span>`
    : "";

  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-weight:500;font-size:14px;color:#111;">${task.title}</div>
        ${task.note ? `<div style="color:#6b7280;font-size:12px;margin-top:2px;">${task.note}</div>` : ""}
        ${dueLine ? `<div style="margin-top:4px;">${dueLine}</div>` : ""}
      </td>
    </tr>`;
}

function prioritySection(
  emoji: string,
  label: string,
  tasks: Task[],
  color: string
): string {
  if (tasks.length === 0) return "";
  return `
    <tr>
      <td style="padding:16px 0 8px;">
        <div style="font-size:13px;font-weight:600;color:${color};">${emoji} ${label}</div>
      </td>
    </tr>
    ${tasks.map(taskRow).join("")}`;
}

export function buildDigestHtml(tasks: Task[], date: Date): string {
  const dateLabel = format(date, "EEEE, MMMM d, yyyy");
  const { high, medium, low } = groupByPriority(tasks);

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 32px;">
              <div style="color:#ffffff;font-size:20px;font-weight:700;">📋 Daily Task Digest</div>
              <div style="color:#9ca3af;font-size:13px;margin-top:4px;">${dateLabel}</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <div style="font-size:15px;font-weight:600;color:#111;margin-bottom:4px;">Here's what needs your attention today</div>
              <div style="color:#6b7280;font-size:13px;margin-bottom:20px;">You have ${tasks.length} task${tasks.length !== 1 ? "s" : ""} pending.</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${prioritySection("🔴", "High priority", high, "#A32D2D")}
                ${prioritySection("🟡", "Medium priority", medium, "#854F0B")}
                ${prioritySection("🟢", "Low priority", low, "#3B6D11")}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <div style="color:#6b7280;font-size:12px;text-align:center;">
                Stay focused. You've got this. — Your Task Manager
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
