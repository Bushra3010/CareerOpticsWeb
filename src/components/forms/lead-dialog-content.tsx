"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadForm, type LeadField } from "@/components/forms/lead-form";
import type { CollegeOption, CourseOption } from "@/lib/queries/leads";
import type { LeadSource } from "@/lib/validations/lead";

export type LeadDialogProps = {
  source: LeadSource;
  title: string;
  description?: string;
  fields?: LeadField[];
  courses?: CourseOption[];
  colleges?: CollegeOption[];
  collegeId?: string;
  /** Pre-selects a course, e.g. the Apply button on a Courses & Fees row. */
  courseId?: string;
  submitLabel?: string;
};

/**
 * Modal body for LeadDialog. Split out so the Radix Dialog and the form only
 * download when a visitor actually opens one (§11).
 */
export function LeadDialogContent({
  open,
  onOpenChange,
  source,
  title,
  description,
  fields,
  courses,
  colleges,
  collegeId,
  courseId,
  submitLabel,
}: LeadDialogProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
      className={
        // The admission form is a two-column fieldset and needs the room; the
        // short counselling form stays narrow.
        fields?.includes("admission")
          ? "max-h-[90dvh] overflow-y-auto sm:max-w-[560px]"
          : "max-h-[90dvh] overflow-y-auto sm:max-w-[440px]"
      }
    >
        <DialogHeader>
          <DialogTitle className="text-h3">{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <LeadForm
          source={source}
          fields={fields}
          courses={courses}
          colleges={colleges}
          collegeId={collegeId}
          courseId={courseId}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
