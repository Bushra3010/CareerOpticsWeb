import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ExternalLink, Info } from "lucide-react";

import { ContentRowActions } from "@/components/admin/content-row-actions";
import { Badge } from "@/components/ui/badge";
import { CONTENT_SECTIONS, findSection } from "@/config/admin-content";
import { can, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return CONTENT_SECTIONS.map((section) => ({ section: section.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section: slug } = await params;
  const section = findSection(slug);
  return {
    title: section?.title ?? "Content",
    robots: { index: false, follow: false },
  };
}

function display(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  const text = String(value);
  // ISO dates read badly in a dense table.
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
    }
  }
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/**
 * `/admin/[section]` — one screen for every managed content table (§5.5).
 *
 * This publishes, unpublishes and deletes. **It does not edit fields** — that
 * still happens in the Supabase table editor. Flagged in HANDOVER §9.
 */
export default async function ContentSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "content")) redirect("/admin");

  const { section: slug } = await params;
  const section = findSection(slug);
  if (!section) notFound();

  const supabase = await createClient();
  const columns = [
    "id",
    "slug",
    section.titleColumn,
    ...section.columns.map((column) => column.key),
    ...(section.visibility ? [section.visibility] : []),
  ];

  const { data, error } = await supabase
    .from(section.table)
    .select([...new Set(columns)].join(", "))
    .order(section.orderBy, {
      ascending: section.ascending ?? false,
      nullsFirst: false,
    })
    .limit(500);

  if (error) {
    return (
      <div>
        <h1 className="text-h2">{section.title}</h1>
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-body">
          Could not load this section: {error.message}
        </p>
      </div>
    );
  }

  const rows = (data ?? []) as unknown as Record<string, unknown>[];

  return (
    <div>
      <h1 className="text-h2">{section.title}</h1>
      <p className="mt-1 max-w-2xl text-body">{section.description}</p>

      <p className="mt-4 flex max-w-2xl items-start gap-2 rounded-lg bg-brand-blue-50 p-3 text-sm text-ink">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-blue" aria-hidden />
        <span>
          This screen controls what is live. To change a row&apos;s content,
          edit it in the Supabase table editor — per-field forms are not built
          yet.
        </span>
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed p-6 text-body">
          Nothing in this table yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">{section.title}</caption>
            <thead className="bg-surface">
              <tr>
                <th scope="col" className="p-3 font-semibold text-ink">
                  Name
                </th>
                {section.columns.map((column) => (
                  <th key={column.key} scope="col" className="p-3 font-semibold text-ink">
                    {column.label}
                  </th>
                ))}
                {section.visibility ? (
                  <th scope="col" className="p-3 font-semibold text-ink">
                    Live
                  </th>
                ) : null}
                <th scope="col" className="p-3 text-right font-semibold text-ink">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = String(row.id);
                const label = display(row[section.titleColumn]);
                const visible =
                  section.visibility === "status"
                    ? row.status === "published"
                    : section.visibility === "is_active"
                      ? row.is_active === true
                      : false;
                const publicPath = section.publicPath?.(row) ?? null;

                return (
                  <tr key={id} className="border-t align-top">
                    <td className="p-3">
                      <span className="font-medium text-ink">{label}</span>
                      {publicPath ? (
                        <Link
                          href={publicPath}
                          target="_blank"
                          className="ml-2 inline-flex items-center text-brand-blue-400 hover:underline"
                          title="Open public page"
                        >
                          <ExternalLink className="size-3.5" />
                          <span className="sr-only">Open {label}</span>
                        </Link>
                      ) : null}
                    </td>

                    {section.columns.map((column) => (
                      <td key={column.key} className="p-3 text-body">
                        {display(row[column.key])}
                      </td>
                    ))}

                    {section.visibility ? (
                      <td className="p-3">
                        <Badge variant={visible ? "success" : "outline"} size="sm">
                          {visible ? "Live" : "Hidden"}
                        </Badge>
                      </td>
                    ) : null}

                    <td className="p-3">
                      <ContentRowActions
                        section={section.slug}
                        id={id}
                        label={label}
                        visibility={section.visibility}
                        visible={visible}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
