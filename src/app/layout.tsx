import type { Metadata } from "next";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Trap Architect — Crie níveis impossíveis",
    template: "%s — Trap Architect",
  },
  description:
    "Crie, compartilhe e jogue níveis impossíveis! Um platformer troll onde a comunidade é o arquiteto da diversão.",
  keywords: [
    "trap architect",
    "troll platformer",
    "level editor",
    "cat mario",
    "community levels",
    "jogo de plataforma",
  ],
  openGraph: {
    siteName: "Trap Architect",
    type: "website",
    title: "Trap Architect — Crie níveis impossíveis",
    description:
      "Um platformer troll onde a comunidade é o arquiteto da diversão. Construa armadilhas diabólicas e desafie o mundo.",
  },
  twitter: {
    card: "summary",
    title: "Trap Architect",
    description:
      "Crie, compartilhe e jogue níveis impossíveis!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
