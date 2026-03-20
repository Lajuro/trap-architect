import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://traparchitect.com";

function localizedEntry(
  path: string,
  opts: { changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number; lastModified?: string },
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    languages[locale] = `${BASE_URL}${prefix}${path}`;
  }
  return {
    url: `${BASE_URL}${path}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    localizedEntry("", { changeFrequency: "daily", priority: 1.0 }),
    localizedEntry("/browse", { changeFrequency: "daily", priority: 0.9 }),
    localizedEntry("/login", { changeFrequency: "monthly", priority: 0.3 }),
    localizedEntry("/signup", { changeFrequency: "monthly", priority: 0.3 }),
  ];

  // Published levels
  const { data: levels } = await supabase
    .from("levels")
    .select("id, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(5000);

  const levelPages: MetadataRoute.Sitemap = (levels ?? []).map((level) =>
    localizedEntry(`/play/${level.id}`, {
      changeFrequency: "weekly",
      priority: 0.7,
      lastModified: level.updated_at,
    }),
  );

  // Creator profiles
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .gt("levels_published", 0)
    .limit(5000);

  const creatorPages: MetadataRoute.Sitemap = (creators ?? []).map((c) =>
    localizedEntry(`/creator/${c.id}`, {
      changeFrequency: "weekly",
      priority: 0.5,
      lastModified: c.updated_at,
    }),
  );

  return [...staticPages, ...levelPages, ...creatorPages];
}
