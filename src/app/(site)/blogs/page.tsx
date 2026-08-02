import type { Metadata } from "next";

import { ArticleIndex } from "@/components/content/article-index";
import { listArticles } from "@/lib/queries/content";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Blogs",
  description: "Admission guides, course comparisons and exam prep written by our counsellors.",
  alternates: { canonical: "/blogs" },
};

/** `/blogs` — §4. */
export default async function Page() {
  const articles = await listArticles("blogs");

  return (
    <ArticleIndex
      articles={articles}
      title="Blogs"
      description="Admission guides, course comparisons and exam prep written by our counsellors."
      basePath="/blogs"
      emptyMessage="Our counsellors are writing the first posts. In the meantime, ask them directly — that is faster than any article."
    />
  );
}
