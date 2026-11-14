import Image from "next/image";
import Link from "next/link";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/queries/content";
import { imageSrc } from "@/lib/media";

/** Article dates as "12 Mar 2026" (en-IN). */
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

/** One blog/news card — used by the index pages and the home blog strip. */
export function ArticleCard({
  article,
  basePath,
  headingLevel = "h2",
}: {
  article: Article;
  basePath: string;
  headingLevel?: "h2" | "h3";
}) {
  const cover = imageSrc(article.cover_url);
  const published = formatArticleDate(article.published_at);
  const Heading = headingLevel;

  return (
    <article className="card-lift relative flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* 14:5 — the shape of the client's banners, which double as covers. */}
      <div className="relative aspect-[14/5] shrink-0 bg-brand-blue-50">
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

        <Heading className="text-h3">
          <Link
            href={`${basePath}/${article.slug}`}
            className="after:absolute after:inset-0 hover:text-brand-blue focus-visible:outline-none"
          >
            {article.title}
          </Link>
        </Heading>

        {article.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm text-body">
            {article.excerpt}
          </p>
        ) : null}

        <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-sm text-muted-foreground">
          {published ? <span className="tabular-nums">{published}</span> : null}
          {article.read_minutes ? (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="size-3.5" aria-hidden />
              {article.read_minutes} min read
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
