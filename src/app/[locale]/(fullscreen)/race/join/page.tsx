import type { Metadata } from "next";
import JoinRaceClient from "./JoinRaceClient";

export const metadata: Metadata = {
  title: "Entrar em Corrida — Trap Architect",
  description: "Entre em uma corrida versus usando o código de convite.",
};

export default function JoinRacePage() {
  return <JoinRaceClient />;
}
