import { createPublicClient } from "@/lib/supabase/public";

/**
 * Content reads — PRD §4 `/blogs`, `/news`, `/gallery`, `/press-release`,
 * `/placements`, `/scholarships`.
 *
 * `blogs`, `news` and `guides` are empty until an editor writes something in
 * P10. Every list here returns `[]` rather than throwing, and the pages render
 * an honest empty state instead of placeholder posts.
 */

const ARTICLE_SELECT =
  "id, title, slug, excerpt, cover_url, category, tags, author, read_minutes, published_at, meta_title, meta_description";

type ArticleTable = "blogs" | "news";

export async function listArticles(table: ArticleTable) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from(table)
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

export type Article = Awaited<ReturnType<typeof listArticles>>[number];

export async function getArticle(table: ArticleTable, slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from(table)
    .select(`${ARTICLE_SELECT}, content`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`${table} ${slug}: ${error.message}`);
  return data;
}

export async function getArticleSlugs(table: ArticleTable) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from(table)
    .select("slug")
    .eq("status", "published");
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.slug ? [row.slug] : []));
}

/** `/gallery` — every item, newest event first. */
export async function getGallery() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("gallery")
    .select("id, image_url, caption, event_date")
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`gallery: ${error.message}`);
  return data ?? [];
}

/** `/press-release`. */
export async function getPressReleases() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("press_releases")
    .select("id, publication, image_url, article_url, published_on")
    .order("published_on", { ascending: false, nullsFirst: false });

  if (error) throw new Error(`press_releases: ${error.message}`);
  return data ?? [];
}

/** `/placements` — the testimonial showcase (§4). */
export async function getPlacements() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id, student_name, photo_url, company, package_lpa, course, city, quote, colleges(name, slug)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`testimonials: ${error.message}`);
  return data ?? [];
}

export type Placement = Awaited<ReturnType<typeof getPlacements>>[number];

/** `/scholarships`. */
export async function listScholarships() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("scholarships")
    .select("id, title, slug, state, image_url, content")
    .eq("status", "published")
    .order("title", { ascending: true });

  if (error) throw new Error(`scholarships: ${error.message}`);
  return data ?? [];
}

export async function getScholarship(slug: string) {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("scholarships")
    .select("id, title, slug, state, image_url, content, meta_title, meta_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(`scholarship ${slug}: ${error.message}`);
  return data;
}

export async function getScholarshipSlugs() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("scholarships")
    .select("slug")
    .eq("status", "published");
  if (error) throw new Error(`scholarships: ${error.message}`);
  return (data ?? []).flatMap((row) => (row.slug ? [row.slug] : []));
}
