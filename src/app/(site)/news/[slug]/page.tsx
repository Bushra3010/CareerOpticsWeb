import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleDetail } from "@/components/content/article-detail";
import { siteConfig } from "@/config/site";
import { getArticle, getArticleSlugs } from "@/lib/queries/content";

export const revalidate = 600;

export async function generateStaticParams() {
  const slugs = await getArticleSlugs("news");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle("news", slug);
  if (!article) return { title: "Not found" };

  const title = article.meta_title ?? `${article.title} | ${siteConfig.name}`;
  const description = article.meta_description ?? article.excerpt ?? undefined;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle("news", slug);
  if (!article) notFound();

  return (
    <ArticleDetail article={article} indexTitle="News" basePath="/news" />
  );
}
