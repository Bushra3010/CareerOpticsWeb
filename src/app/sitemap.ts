import type { MetadataRoute } from "next";

import { LEVEL_HUBS } from "@/lib/queries/taxonomy";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Dynamic sitemap — PRD §10.
 *
 * Only pages worth indexing. Deliberately absent: `/search`, `/compare` and
 * any filtered `/colleges?…` view (all `noindex` and generated from a query
 * string), `/style-guide`, and every `/admin` route.
 *
 * §10 asks for chunking past 5k URLs. At the current catalogue this returns
 * roughly 150, so a single file is correct — `MAX_URLS` makes the ceiling
 * visible and logs rather than silently truncating.
 */
export const revalidate = 3600;

const MAX_URLS = 5000;

type Entry = MetadataRoute.Sitemap[number];

function url(path: string, priority: number, frequency: Entry["changeFrequency"]): Entry {
  return {
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: frequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  const [colleges, courses, streams, exams, cities, scholarships, blogs, news] =
    await Promise.all([
      supabase.from("colleges").select("slug, updated_at").eq("status", "published"),
      supabase.from("courses").select("slug").eq("status", "published"),
      supabase.from("streams").select("slug"),
      supabase.from("exams").select("slug").eq("status", "published"),
      // Only cities that have a college — the other 100+ would be empty pages.
      supabase.from("colleges").select("cities!inner(slug)").eq("status", "published"),
      supabase.from("scholarships").select("slug").eq("status", "published"),
      supabase.from("blogs").select("slug, published_at").eq("status", "published"),
      supabase.from("news").select("slug, published_at").eq("status", "published"),
    ]);

  const entries: Entry[] = [
    url("/", 1, "daily"),
    url("/colleges", 0.9, "daily"),
    url("/courses", 0.9, "weekly"),
    url("/exams", 0.8, "weekly"),
    url("/college-finder", 0.9, "monthly"),
    url("/scholarships", 0.7, "weekly"),
    url("/placements", 0.6, "weekly"),
    url("/blogs", 0.6, "daily"),
    url("/news", 0.6, "daily"),
    url("/gallery", 0.4, "monthly"),
    url("/press-release", 0.4, "monthly"),
    url("/about", 0.5, "yearly"),
    url("/contact", 0.6, "yearly"),
    url("/help-support", 0.4, "monthly"),
    url("/privacy-policy", 0.3, "yearly"),
    url("/terms-and-conditions", 0.3, "yearly"),
    url("/disclaimer", 0.3, "yearly"),
    ...LEVEL_HUBS.map((hub) => url(`/${hub.slug}`, 0.8, "weekly")),
  ];

  for (const row of colleges.data ?? []) {
    entries.push({
      url: new URL(`/colleges/${row.slug}`, siteConfig.url).toString(),
      // Real freshness where the row tracks it — better than a blanket "now".
      lastModified: row.updated_at ? new Date(row.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  for (const row of courses.data ?? []) entries.push(url(`/courses/${row.slug}`, 0.8, "weekly"));
  for (const row of streams.data ?? []) entries.push(url(`/streams/${row.slug}`, 0.7, "weekly"));
  for (const row of exams.data ?? []) entries.push(url(`/exams/${row.slug}`, 0.7, "weekly"));
  for (const row of scholarships.data ?? []) {
    entries.push(url(`/scholarships/${row.slug}`, 0.6, "monthly"));
  }

  const citySlugs = new Set(
    (cities.data ?? []).map((row) => row.cities?.slug).filter(Boolean) as string[],
  );
  for (const slug of citySlugs) entries.push(url(`/city/${slug}`, 0.7, "weekly"));

  for (const row of blogs.data ?? []) {
    if (row.slug) entries.push(url(`/blogs/${row.slug}`, 0.6, "monthly"));
  }
  for (const row of news.data ?? []) {
    if (row.slug) entries.push(url(`/news/${row.slug}`, 0.6, "monthly"));
  }

  if (entries.length > MAX_URLS) {
    // §10 wants chunked sitemaps past this point. Say so loudly rather than
    // handing search engines a silently truncated file.
    console.warn(
      `[sitemap] ${entries.length} URLs exceeds ${MAX_URLS}. Split into sitemap/[id] chunks.`,
    );
  }

  return entries.slice(0, MAX_URLS);
}
