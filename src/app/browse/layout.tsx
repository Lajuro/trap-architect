import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explorar Níveis",
  description:
    "Descubra milhares de níveis criados pela comunidade. Filtre por dificuldade, popularidade e mais.",
};

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
