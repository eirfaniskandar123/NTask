import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { format, subDays, startOfDay } from "date-fns";

export async function GET() {
  const supabase = getServiceSupabase();

  const { data: tasks } = await supabase.from("tasks").select("done, updated_at");

  if (!tasks) return NextResponse.json({ completedThisWeek: 0, streak: 0, total: 0, done: 0 });

  const now = new Date();
  const weekAgo = subDays(now, 7);

  const completedThisWeek = tasks.filter(
    (t) => t.done && new Date(t.updated_at) >= weekAgo
  ).length;

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  // Daily streak: count consecutive days (going back from today) with at least 1 completion
  const completedDates = new Set(
    tasks
      .filter((t) => t.done)
      .map((t) => format(startOfDay(new Date(t.updated_at)), "yyyy-MM-dd"))
  );

  let streak = 0;
  let cursor = startOfDay(now);
  while (completedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streak++;
    cursor = subDays(cursor, 1);
  }

  return NextResponse.json({ completedThisWeek, streak, total, done });
}
