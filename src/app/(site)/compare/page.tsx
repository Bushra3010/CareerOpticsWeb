import type { Metadata } from "next";
import Link from "next/link";

import { Check, Minus } from "lucide-react";

import { LeadDialog } from "@/components/forms/lead-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { MAX_COMPARE } from "@/config/filters";
import { getComparedColleges, type ComparedCollege } from "@/lib/queries/colleges";
import { formatInr, initials } from "@/lib/media";

export const metadata: Metadata = {
  title: "Compare Colleges",
  description:
    "Compare fees, packages, NAAC grade, NIRF rank and facilities side by side.",
  // A comparison is generated from a query string, never a landing page (§10).
  robots: { index: false, follow: true },
};

/** Rows of the comparison table, in the order a student actually weighs them. */
const ROWS: {
  label: string;
  render: (college: ComparedCollege) => React.ReactNode;
}[] = [
  {
    label: "Location",
    render: (c) =>
      [c.cities?.name, c.cities?.states?.name].filter(Boolean).join(", ") || null,
  },
  { label: "Type", render: (c) => (c.type ? <span className="capitalize">{c.type}</span> : null) },
  { label: "Established", render: (c) => c.established_year },
  { label: "NAAC grade", render: (c) => c.naac_grade },
  { label: "NIRF rank", render: (c) => (c.nirf_rank ? `#${c.nirf_rank}` : null) },
  { label: "Fee / year", render: (c) => formatInr(c.minFee) },
  { label: "Highest package", render: (c) => formatInr(c.highest_package) },
  { label: "Average package", render: (c) => formatInr(c.average_package) },
  {
    label: "Rating",
    render: (c) =>
      c.rating && c.rating > 0 ? (
        <Rating value={Number(c.rating)} count={c.review_count} size="sm" />
      ) : null,
  },
  { label: "Students", render: (c) => c.total_students?.toLocaleString("en-IN") },
  { label: "Campus size", render: (c) => c.campus_size },
  {
    label: "Approvals",
    render: (c) => (c.approvals?.length ? c.approvals.join(", ") : null),
  },
  {
    label: "Facilities",
    render: (c) => (c.facilities?.length ? c.facilities.join(", ") : null),
  },
];

/** `/compare?ids=a,b,c` — §4, up to three colleges. */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.ids) ? params.ids.join(",") : (params.ids ?? "");
  const colleges = await getComparedColleges(raw.split(",").map((id) => id.trim()));

  return (
    <div className="container-site py-6 lg:py-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/colleges">Colleges</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Compare</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="heading-underline mt-4 text-h2">Compare Colleges</h1>

      {colleges.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-10 text-center">
          <h2 className="text-h3">Nothing to compare yet</h2>
          <p className="mt-1 text-body">
            Tick <strong>Compare</strong> on up to {MAX_COMPARE} colleges in the
            listing and they will show up side by side here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/colleges">Browse colleges</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* The table is wider than a phone; it scrolls in its own container
              so the page body never scrolls sideways. */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <caption className="sr-only">
                Side-by-side comparison of {colleges.length} colleges
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-[160px] p-3 align-bottom">
                    <span className="sr-only">Attribute</span>
                  </th>
                  {colleges.map((college) => (
                    <th key={college.id} scope="col" className="p-3 align-bottom">
                      <span className="flex size-12 items-center justify-center rounded-lg border bg-white font-display text-sm font-extrabold text-brand-blue">
                        {initials(college.short_name ?? college.name)}
                      </span>
                      <Link
                        href={`/colleges/${college.slug}`}
                        className="mt-2 block font-semibold text-ink hover:text-brand-blue"
                      >
                        {college.name}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t">
                    <th
                      scope="row"
                      className="p-3 align-top text-sm font-medium text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    {colleges.map((college) => {
                      const value = row.render(college);
                      return (
                        <td key={college.id} className="p-3 align-top text-body">
                          {value ?? (
                            <Minus
                              className="size-4 text-muted-foreground"
                              aria-label="Not available"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t">
                  <th scope="row" className="p-3">
                    <span className="sr-only">Apply</span>
                  </th>
                  {colleges.map((college) => (
                    <td key={college.id} className="p-3">
                      <LeadDialog
                        source="apply_now"
                        collegeId={college.id}
                        title={`Apply to ${college.short_name ?? college.name}`}
                        description="A counsellor will confirm eligibility, fees and the next admission date."
                        fields={["city", "level", "message"]}
                        submitLabel="Submit Application"
                      >
                        <Button size="sm">Apply Now</Button>
                      </LeadDialog>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="size-4 text-success" aria-hidden />
            Not sure which one fits your marks and budget? A counsellor will tell
            you, free.
          </p>
          <LeadDialog
            source="college_detail"
            title="Get free counselling"
            description="Share a few details and a counsellor will call you within 24 hours."
            fields={["city", "level", "message"]}
          >
            <Button className="mt-3">Get Free Counselling</Button>
          </LeadDialog>
        </>
      )}
    </div>
  );
}
