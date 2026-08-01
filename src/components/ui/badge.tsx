import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * §6.1: orange is reserved for "NEW" pills and urgency badges, and never
 * carries white text — the `new` and `urgent` variants use text-ink.
 */
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-brand-blue text-white",
        secondary: "bg-brand-blue-50 text-brand-blue",
        outline: "border-border text-body",
        new: "bg-brand-orange text-ink uppercase tracking-wide",
        urgent: "bg-brand-orange/15 text-ink",
        success: "bg-success/10 text-success",
        rating: "bg-brand-amber/20 text-ink tabular-nums",
        destructive: "bg-destructive/10 text-destructive",
      },
      size: {
        default: "text-sm",
        sm: "px-2 py-0 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
