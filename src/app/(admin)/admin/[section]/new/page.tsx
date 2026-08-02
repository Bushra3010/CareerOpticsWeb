import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { EntityForm } from "@/components/admin/entity-form";
import { Button } from "@/components/ui/button";
import { findSection } from "@/config/admin-content";
import { fieldsFor } from "@/config/admin-fields";
import { can, requireStaff } from "@/lib/auth";
import { getSelectOptions } from "@/lib/queries/admin-options";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  return {
    title: `New ${findSection(section)?.title ?? "item"}`,
    robots: { index: false, follow: false },
  };
}

/** `/admin/[section]/new` — create a row (§5.5). */
export default async function NewRowPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "content")) redirect("/admin");

  const { section: slug } = await params;
  const section = findSection(slug);
  if (!section) notFound();

  const fields = fieldsFor(slug);
  if (fields.length === 0) notFound();

  const options = await getSelectOptions(slug);
  const back = `/admin/${slug}`;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={back}>
          <ArrowLeft />
          Back to {section.title.toLowerCase()}
        </Link>
      </Button>

      <h1 className="mt-3 text-h2">New {section.title.replace(/s$/, "")}</h1>

      <div className="mt-8">
        <EntityForm
          section={slug}
          fields={fields}
          optionsFrom={options}
          cancelHref={back}
        />
      </div>
    </div>
  );
}
