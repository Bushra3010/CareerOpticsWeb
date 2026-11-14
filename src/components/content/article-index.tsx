import { PenLine } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { ArticleCard } from "@/components/content/article-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import type { Article } from "@/lib/queries/content";

/**
 * Shared index for `/blogs` and `/news` — the two tables are identical in
 * shape, so they differ only by label and base path.
 *
 * Both are empty until an editor publishes in P10. The empty state says so
 * plainly rather than filling the page with placeholder posts.
 */
export function ArticleIndex({
  articles,
  title,
  description,
  basePath,
  emptyMessage,
}: {
  articles: Article[];
  title: string;
  description: string;
  basePath: string;
  emptyMessage: string;
}) {
  return (
    <>
      <PageHeader
        crumbs={[{ name: title }]}
        title={title}
        description={description}
      />

      <div className="container-site py-8 lg:py-12">
        {articles.length === 0 ? (
          <>
            <div className="rounded-xl border border-dashed p-10 text-center">
              <PenLine
                className="mx-auto size-8 text-muted-foreground"
                aria-hidden
              />
              <h2 className="mt-3 text-h3">Nothing published yet</h2>
              <p className="mx-auto mt-1 max-w-md text-body">{emptyMessage}</p>
            </div>
            <div className="mt-8">
              <InlineLeadCard />
            </div>
          </>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} basePath={basePath} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
