import Image from "next/image";

import { Clock, User } from "lucide-react";

import { formatArticleDate } from "@/components/content/article-index";
import { Prose } from "@/components/content/prose";
import { InlineLeadCard } from "@/components/forms/inline-lead-card";
import { PageHeader } from "@/components/taxonomy/page-header";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, JsonLd } from "@/lib/seo/json-ld";
import { imageSrc } from "@/lib/media";

type ArticleWithContent = {
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  author: string | null;
  read_minutes: number | null;
  published_at: string | null;
};

/** Shared detail body for `/blogs/[slug]` and `/news/[slug]`. */
export function ArticleDetail({
  article,
  indexTitle,
  basePath,
}: {
  article: ArticleWithContent;
  indexTitle: string;
  basePath: string;
}) {
  const cover = imageSrc(article.cover_url);
  const published = formatArticleDate(article.published_at);

  return (
    <>
      <PageHeader
        crumbs={[
          { name: indexTitle, href: basePath },
          { name: article.title ?? "Article" },
        ]}
        title={article.title ?? "Article"}
        description={article.excerpt}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {article.category ? (
            <Badge variant="secondary" size="sm">
              {article.category}
            </Badge>
          ) : null}
          {article.author ? (
            <span className="flex items-center gap-1">
              <User className="size-3.5" aria-hidden />
              {article.author}
            </span>
          ) : null}
          {published ? <span className="tabular-nums">{published}</span> : null}
          {article.read_minutes ? (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="size-3.5" aria-hidden />
              {article.read_minutes} min read
            </span>
          ) : null}
        </div>
      </PageHeader>

      <div className="container-site py-8 lg:py-12">
        {cover ? (
          <div className="relative mb-8 aspect-[16/7] max-w-3xl overflow-hidden rounded-xl bg-brand-blue-50">
            <Image
              src={cover}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 768px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}

        <article>
          <Prose content={article.content} />
        </article>

        {article.tags?.length ? (
          <ul className="mt-8 flex max-w-3xl flex-wrap gap-2">
            {article.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline" size="sm">
                  {tag}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-10 max-w-3xl">
          <InlineLeadCard />
        </div>
      </div>

      {/* §10 — Article schema for blog and news posts. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          ...(article.excerpt ? { description: article.excerpt } : {}),
          ...(article.published_at ? { datePublished: article.published_at } : {}),
          ...(article.author
            ? { author: { "@type": "Person", name: article.author } }
            : {}),
          publisher: {
            "@type": "Organization",
            name: siteConfig.legalName,
            url: siteConfig.url,
          },
          mainEntityOfPage: new URL(
            `${basePath}/${article.slug}`,
            siteConfig.url,
          ).toString(),
        }}
      />
      <JsonLd
        data={breadcrumbSchema(
          [
            { name: "Home", path: "/" },
            { name: indexTitle, path: basePath },
            { name: article.title ?? "Article", path: `${basePath}/${article.slug}` },
          ],
          siteConfig.url,
        )}
      />
    </>
  );
}
