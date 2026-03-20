import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/** PATCH /api/admin/levels/[id] — admin actions on a level (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: levelId } = await params;
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
  const { action } = body;

  switch (action) {
    case "hide": {
      const { error } = await supabase
        .from("levels")
        .update({ published: false })
        .eq("id", levelId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    case "unhide": {
      const { error } = await supabase
        .from("levels")
        .update({ published: true })
        .eq("id", levelId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    case "setWeekly": {
      const { error } = await supabase
        .from("levels")
        .update({ weekly_challenge_date: new Date().toISOString().split("T")[0] })
        .eq("id", levelId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    case "removeWeekly": {
      const { error } = await supabase
        .from("levels")
        .update({ weekly_challenge_date: null })
        .eq("id", levelId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }
}
