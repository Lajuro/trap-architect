import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "editor" });
  return {
    title: t("createLevelTitle"),
    description: t("createLevelDesc"),
  };
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
