import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CommunityLevelClient from "./CommunityLevelClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("levels")
    .select("name, subtitle, plays, likes, profiles!inner(nickname)")
    .eq("id", id)
    .eq("published", true)
    .single();

  if (!data) {
    return { title: "Nível não encontrado — Trap Architect" };
  }

  const author = (data.profiles as unknown as { nickname: string }).nickname;
  const title = `${data.name} — Trap Architect`;
  const description =
    data.subtitle ||
    `Jogue "${data.name}" por ${author}. ${data.plays} plays, ${data.likes} likes.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Trap Architect",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function CommunityLevelPage() {
  return <CommunityLevelClient />;
}
