import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Nível",
  description:
    "Use o editor visual para criar níveis com armadilhas, inimigos e trollagens. Publique e desafie a comunidade!",
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
