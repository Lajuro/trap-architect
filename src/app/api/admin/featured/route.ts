import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/ranks";

/**
 * PATCH /api/admin/featured — toggle featured flag on a level (admin only)
 *
 * Schema note: levels table already has `featured boolean` and
 * `featured_category text` columns. If you need `developers_choice`:
 * ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS developers_choice boolean NOT NULL DEFAULT false;
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("creator_rank")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdmin(profile.creator_rank)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { level_id, featured, featured_category } = body as {
    level_id: string;
    featured?: boolean;
    featured_category?: string | null;
  };

  if (!level_id) {
    return NextResponse.json(
      { error: "level_id é obrigatório" },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (featured !== undefined) updates.featured = featured;
  if (featured_category !== undefined)
    updates.featured_category = featured_category;

  const { error } = await supabase
    .from("levels")
    .update(updates)
    .eq("id", level_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
