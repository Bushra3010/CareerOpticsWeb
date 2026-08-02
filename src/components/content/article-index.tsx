import Image from "next/image";
import Link from "next/link";

import { Clock, PenLine } from "lucide-react";

import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/queries/content";
import { imageSrc } from "@/lib/media";

export function formatArticleDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

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
      <PageHeader crumbs={[{ name: title }]} title={title} description={description} />

      <div className="container-site py-8 lg:py-12">
        {articles.length === 0 ? (
          <>
            <div className="rounded-xl border border-dashed p-10 text-center">
              <PenLine className="mx-auto size-8 text-muted-foreground" aria-hidden />
              <h2 className="mt-3 text-h3">Nothing published yet</h2>
              <p className="mx-auto mt-1 max-w-md text-body">{emptyMessage}</p>
            </div>
            <div className="mt-8">
              <InlineLeadCard />
            </div>
          </>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const cover = imageSrc(article.cover_url);
              const published = formatArticleDate(article.published_at);

              return (
                <li key={article.id}>
                  <article className="card-lift relative flex h-full flex-col overflow-hidden rounded-xl border bg-card">
                    <div className="relative h-40 shrink-0 bg-brand-blue-50">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 380px, 100vw"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      {article.category ? (
                        <Badge variant="secondary" size="sm" className="mb-2 w-fit">
                          {article.category}
                        </Badge>
                      ) : null}

                      <h2 className="text-h3">
                        <Link
                          href={`${basePath}/${article.slug}`}
                          className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
                        >
                          {article.title}
                        </Link>
                      </h2>

                      {article.excerpt ? (
                        <p className="mt-2 line-clamp-3 text-sm text-body">
                          {article.excerpt}
                        </p>
                      ) : null}

                      <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-sm text-muted-foreground">
                        {published ? (
                          <span className="tabular-nums">{published}</span>
                        ) : null}
                        {article.read_minutes ? (
                          <span className="flex items-center gap-1 tabular-nums">
                            <Clock className="size-3.5" aria-hidden />
                            {article.read_minutes} min read
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
