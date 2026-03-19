import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CREATOR_RANKS } from "@/game/constants";
import CreatorClient from "./CreatorClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("nickname, creator_rank, levels_published, total_plays")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Criador não encontrado — Trap Architect" };
  }

  const rank = CREATOR_RANKS.find((r) => r.level === data.creator_rank);
  const title = `${data.nickname} — Trap Architect`;
  const description = `${rank?.title ?? "Jogador"} · ${data.levels_published} níveis · ${data.total_plays} plays`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "Trap Architect",
    },
  };
}

export default function CreatorPage() {
  return <CreatorClient />;
}
