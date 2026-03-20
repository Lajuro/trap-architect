"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

const NotFoundGame = dynamic(() => import("@/components/NotFoundGame"), {
  ssr: false,
});

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <NotFoundGame
      title={t("title")}
      description={t("description")}
      browseText={t("browseLevels")}
      homeText={t("home")}
      browseHref="/browse"
      homeHref="/"
    />
  );
}
