export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { buildDigestHtml } from "@/lib/email";
import { format } from "date-fns";

export async function GET() {
  const supabase = getServiceSupabase();
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const [{ data: tasks, error }, { data: settingsRows }, { data: tagRows }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("done", false)
        .or(`everyday.eq.true,due_date.lte.${todayStr}`),
      supabase.from("app_settings").select("key, value"),
      supabase.from("tags").select("name, color"),
    ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of settingsRows ?? []) settings[row.key] = row.value;
  const sortBy = settings["digest_sort_by"] === "tag" ? "tag" : "priority";

  const tagColors: Record<string, string> = {};
  for (const row of tagRows ?? []) tagColors[row.name] = row.color;

  const html = buildDigestHtml(tasks ?? [], today, sortBy, tagColors);
  return NextResponse.json({ html, taskCount: tasks?.length ?? 0 });
}
