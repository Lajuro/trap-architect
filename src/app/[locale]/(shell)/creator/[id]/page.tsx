import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CREATOR_RANKS } from "@/game/constants";
import { getTranslations } from "next-intl/server";
import CreatorClient from "./CreatorClient";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "creator" });
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("nickname, creator_rank, levels_published, total_plays")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: t("notFound") };
  }

  const rank = CREATOR_RANKS.find((r) => r.level === data.creator_rank);
  const title = `${data.nickname} — Trap Architect`;
  const description = t("metaDesc", { rank: rank?.title ?? "Jogador", levels: String(data.levels_published), plays: String(data.total_plays) });

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
