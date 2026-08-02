import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft, ExternalLink } from "lucide-react";

import { EntityForm } from "@/components/admin/entity-form";
import { Button } from "@/components/ui/button";
import { findSection } from "@/config/admin-content";
import { fieldsFor } from "@/config/admin-fields";
import { can, requireStaff } from "@/lib/auth";
import { getSectionRow, getSelectOptions } from "@/lib/queries/admin-options";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  return {
    title: `Edit ${findSection(section)?.title ?? "item"}`,
    robots: { index: false, follow: false },
  };
}

/** `/admin/[section]/[id]` — edit a row (§5.5). */
export default async function EditRowPage({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "content")) redirect("/admin");

  const { section: slug, id } = await params;
  const section = findSection(slug);
  if (!section) notFound();

  const fields = fieldsFor(slug);
  if (fields.length === 0) notFound();

  const [row, options] = await Promise.all([
    getSectionRow(section.table, id),
    getSelectOptions(slug),
  ]);
  if (!row) notFound();

  const back = `/admin/${slug}`;
  const title = String(row[section.titleColumn] ?? "Untitled");
  const publicPath = section.publicPath?.(row) ?? null;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={back}>
          <ArrowLeft />
          Back to {section.title.toLowerCase()}
        </Link>
      </Button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h2">{title}</h1>
        {publicPath ? (
          <Button asChild variant="outline" size="sm">
            <Link href={publicPath} target="_blank">
              <ExternalLink />
              View live page
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-8">
        <EntityForm
          section={slug}
          fields={fields}
          row={row}
          optionsFrom={options}
          cancelHref={back}
        />
      </div>
    </div>
  );
}
