import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** GET /api/admin/reports — list pending reports (admin only) */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_rank")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdmin(profile.creator_rank)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("level_reports")
    .select("*, profiles!level_reports_user_id_fkey(nickname), levels!level_reports_level_id_fkey(name, author_id)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: data });
}

/** PATCH /api/admin/reports — update a report status (admin only) */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_rank")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdmin(profile.creator_rank)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { reportId, action } = body;

  if (!reportId || !["dismissed", "actioned"].includes(action)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  // Update report status
  const { error } = await supabase
    .from("level_reports")
    .update({ status: action })
    .eq("id", reportId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If actioned, hide the level
  if (action === "actioned") {
    const { data: report } = await supabase
      .from("level_reports")
      .select("level_id")
      .eq("id", reportId)
      .single();

    if (report) {
      await supabase
        .from("levels")
        .update({ published: false })
        .eq("id", report.level_id);
    }
  }

  return NextResponse.json({ success: true });
}
