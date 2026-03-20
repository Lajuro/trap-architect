import type { Metadata } from "next";
import RaceClient from "./RaceClient";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Race ${code} — Trap Architect`,
    description: "Corrida Versus em tempo real!",
  };
}

export default function RacePage() {
  return <RaceClient />;
}
