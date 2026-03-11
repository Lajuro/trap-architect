import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trap Architect",
  description: "Crie, compartilhe e jogue níveis impossíveis! Um platformer troll onde a comunidade é o arquiteto da diversão.",
  keywords: ["trap architect", "troll platformer", "level editor", "cat mario", "community levels"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
