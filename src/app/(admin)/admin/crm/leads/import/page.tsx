import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { LeadImport } from "@/components/crm/lead-import";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Import leads",
  robots: { index: false, follow: false },
};

export default async function ImportLeadsPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/admin/crm/leads">
          <ArrowLeft />
          Back to leads
        </Link>
      </Button>

      <h1 className="mt-3 text-h2">Import leads</h1>
      <p className="mt-1 max-w-2xl text-body">
        Bring in a list from a campaign, a fair or a spreadsheet. Duplicates
        against numbers already in the CRM are skipped automatically.
      </p>

      <div className="mt-8">
        <LeadImport />
      </div>
    </div>
  );
}
