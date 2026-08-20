import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Bell } from "lucide-react";

import { ActionForm } from "@/components/crm/action-form";
import { CrmEmpty, CrmPageHeader, CrmSection } from "@/components/crm/crm-ui";
import { Badge } from "@/components/ui/badge";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, type NotificationType } from "@/config/crm";
import { ROLE_LABELS } from "@/config/admin-nav";
import { sendNotification } from "@/app/(crm)/crm/phase2-actions";
import { can, requireStaff } from "@/lib/auth";
import { listNotifications } from "@/lib/queries/crm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

const TONE: Record<NotificationType, "secondary" | "success" | "urgent" | "outline"> = {
  info: "secondary",
  success: "success",
  warning: "outline",
  alert: "urgent",
};

/**
 * Staff broadcasts.
 *
 * In-app only — there is no push or email delivery behind this, and saying
 * otherwise on the button would be a lie the first time someone relies on it.
 */
export default async function NotificationsPage() {
  const profile = await requireStaff();
  if (!can(profile.role, "leads")) redirect("/admin");

  const notifications = await listNotifications(50);

  return (
    <div>
      <CrmPageHeader
        title="Notifications"
        description="In-app broadcasts to staff. Nothing here sends an email or a push."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CrmSection title="Send a notice">
          <ActionForm
            action={sendNotification}
            submitLabel="Post notice"
            columns={1}
            fields={[
              { name: "title", label: "Title", required: true },
              {
                name: "type", label: "Kind", type: "select", required: true,
                options: NOTIFICATION_TYPES.map((t) => ({
                  value: t, label: NOTIFICATION_TYPE_LABELS[t],
                })),
                defaultValue: "info",
              },
              {
                name: "target_role", label: "Audience", type: "select",
                options: Object.entries(ROLE_LABELS)
                  // Portal roles do not read this board.
                  .filter(([role]) => role !== "associate" && role !== "student")
                  .map(([role, label]) => ({ value: role, label })),
                help: "Leave blank to show it to everyone.",
              },
              { name: "message", label: "Message", type: "textarea", required: true },
            ]}
          />
        </CrmSection>

        <CrmSection title="Posted" description="Newest first.">
          {notifications.length === 0 ? (
            <CrmEmpty title="Nothing posted" icon={<Bell className="size-8" aria-hidden />}>
              Post the first notice on the left.
            </CrmEmpty>
          ) : (
            <ul className="grid gap-3">
              {notifications.map((n) => (
                <li key={n.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-ink">{n.title}</span>
                    <Badge variant={TONE[n.type as NotificationType]} size="sm">
                      {NOTIFICATION_TYPE_LABELS[n.type as NotificationType]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                    {String(n.created_at).slice(0, 10)}
                    {n.target_role
                      ? ` · ${ROLE_LABELS[n.target_role as keyof typeof ROLE_LABELS] ?? n.target_role}`
                      : " · Everyone"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CrmSection>
      </div>
    </div>
  );
}
