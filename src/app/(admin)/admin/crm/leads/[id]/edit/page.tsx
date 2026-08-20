import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import { LeadForm } from "@/components/crm/lead-form";
import { Button } from "@/components/ui/button";
import { can, requireStaff } from "@/lib/auth";
import { getCrmLead, getCrmOptions } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit lead", robots: { index: false, follow: false } };

export default async function EditCrmLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const { id } = await params;
  const [lead, options] = await Promise.all([getCrmLead(id), getCrmOptions()]);
  if (!lead) notFound();

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={`/admin/crm/leads/${id}`}><ArrowLeft />Back to lead</Link>
      </Button>
      <h1 className="mt-3 text-h2">{lead.full_name}</h1>
      <div className="mt-8"><LeadForm lead={lead} options={options} /></div>
    </div>
  );
}
