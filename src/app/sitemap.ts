import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://traparchitect.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/browse`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/signup`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Published levels
  const { data: levels } = await supabase
    .from("levels")
    .select("id, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(5000);

  const levelPages: MetadataRoute.Sitemap = (levels ?? []).map((level) => ({
    url: `${BASE_URL}/play/${level.id}`,
    lastModified: level.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Creator profiles
  const { data: creators } = await supabase
    .from("profiles")
    .select("id, updated_at")
    .gt("levels_published", 0)
    .limit(5000);

  const creatorPages: MetadataRoute.Sitemap = (creators ?? []).map((c) => ({
    url: `${BASE_URL}/creator/${c.id}`,
    lastModified: c.updated_at,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...levelPages, ...creatorPages];
}
