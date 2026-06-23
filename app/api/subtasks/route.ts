import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("task_id");
  if (!taskId) return NextResponse.json({ error: "task_id required" }, { status: 400 });

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { task_id, title } = await req.json();
  if (!task_id || !title?.trim()) {
    return NextResponse.json({ error: "task_id and title required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id, title: title.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
