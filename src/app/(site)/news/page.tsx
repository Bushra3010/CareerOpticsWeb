import type { Metadata } from "next";

import { ArticleIndex } from "@/components/content/article-index";
import { listArticles } from "@/lib/queries/content";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "News",
  description: "Admission notifications, exam date changes and scholarship announcements that affect students in Bihar and across India.",
  alternates: { canonical: "/news" },
};

/** `/news` — §4. */
export default async function Page() {
  const articles = await listArticles("news");

  return (
    <ArticleIndex
      articles={articles}
      title="News"
      description="Admission notifications, exam date changes and scholarship announcements that affect students in Bihar and across India."
      basePath="/news"
      emptyMessage="No notifications yet. Ask a counsellor and we will tell you what has changed for your course."
    />
  );
}
