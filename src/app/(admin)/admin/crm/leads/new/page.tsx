import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { LeadForm } from "@/components/crm/lead-form";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";
import { getCrmOptions } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New lead", robots: { index: false, follow: false } };

export default async function NewCrmLeadPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const options = await getCrmOptions();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/crm/leads"><ArrowLeft />Back to leads</Link>
      </Button>
      <h1 className="mt-3 text-h2">New lead</h1>
      <p className="mt-1 text-body">
        A walk-in or a phone enquiry. Website enquiries arrive on their own.
      </p>
      <div className="mt-8"><LeadForm options={options} /></div>
    </div>
  );
}
