import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * PRD §6.1 CTA rules:
 *   primary   = brand-red      (the only "Apply Now" / "Need Counselling" look)
 *   outline   = brand-blue     (secondary)
 *   secondary = brand-blue-50  (tertiary, tinted)
 *   link      = brand-blue-400
 * Focus ring is the §6.5 a11y floor: ring-2 brand-blue-400 with offset.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-red-600",
        outline:
          "border-brand-blue bg-transparent text-brand-blue hover:bg-brand-blue-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-brand-blue-400/15",
        ghost: "text-brand-blue hover:bg-brand-blue-50",
        inverse:
          "bg-white text-brand-blue hover:bg-brand-blue-50 focus-visible:ring-offset-brand-blue-900",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/50",
        link: "text-brand-blue-400 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 text-sm",
        lg: "h-11 px-6",
        xl: "h-12 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
