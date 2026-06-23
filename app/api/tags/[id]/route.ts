import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceSupabase();

  // Get tag name first
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .select("name")
    .eq("id", params.id)
    .single();

  if (tagError || !tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Block deletion if any active (non-done) tasks use this tag
  const { count, error: countError } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("category", tag.name)
    .eq("done", false);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `"${tag.name}" is used by ${count} active task${count === 1 ? "" : "s"}. Complete or reassign them first.` },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("tags").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getServiceSupabase();
  const body = await req.json();

  const { data, error } = await supabase
    .from("tags")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
