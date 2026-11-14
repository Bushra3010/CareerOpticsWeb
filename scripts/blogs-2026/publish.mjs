// Publish (or update) the first blog posts. Idempotent: matched by slug.
//   node --env-file=.env.local scripts/blogs-2026/publish.mjs
import { createClient } from "@supabase/supabase-js";

import { AUTHOR, BANNER, POSTS } from "./posts.mjs";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

for (const p of POSTS) {
  const row = {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    cover_url: BANNER(p.cover),
    category: p.category,
    tags: p.tags,
    author: AUTHOR,
    read_minutes: p.read_minutes,
    published_at: new Date(`${p.published_at}T09:00:00+05:30`).toISOString(),
    status: "published",
    meta_title: p.title,
    meta_description: p.meta_description,
  };
  const { error } = await db.from("blogs").upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`${p.slug}: ${error.message}`);
  console.log("published", p.slug);
}
